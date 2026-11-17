// SwatchForge Shared Studio API — Cloudflare Worker, D1 + R2.
// Secrets (never commit): BLOO_PASSWORD, PHOENIXX_PASSWORD, SESSION_SECRET.
// The browser never gets a Sheets/Drive secret or a studio password.
const kinds = new Set(['items','recipes','shopping']);
const encoder = new TextEncoder();
function json(value, status=200, headers={}) { return new Response(JSON.stringify(value), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}}); }
function base64(bytes) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function unbase64(s) { const raw=atob(s.replace(/-/g,'+').replace(/_/g,'/')); return Uint8Array.from(raw,c=>c.charCodeAt(0)); }
async function sign(secret, text) {
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return base64(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(text))));
}
// Private account passwords are stored as salted PBKDF2 hashes in D1.
// Legacy Worker secrets are accepted only until an account has migrated.
const PASSWORD_ITERATIONS=310000;
async function ensureAccounts(env){
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS studio_accounts (profile TEXT PRIMARY KEY, salt TEXT NOT NULL, password_hash TEXT NOT NULL, iterations INTEGER NOT NULL, session_version TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
}
function passwordValid(p){return typeof p==='string'&&p.length>=12&&p.length<=128&&encoder.encode(p).length<=512}
async function derivePassword(password,salt,iterations=PASSWORD_ITERATIONS){
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:unbase64(salt),iterations},key,256));
}
async function newPasswordRecord(password){
  const salt=base64(crypto.getRandomValues(new Uint8Array(24)));
  return {salt,hash:base64(await derivePassword(password,salt)),iterations:PASSWORD_ITERATIONS,version:crypto.randomUUID()};
}
async function matchesPassword(password,record){
  if(!passwordValid(password)||!record)return false;
  const current=await derivePassword(password,record.salt,record.iterations);
  const original=unbase64(record.password_hash);
  if(current.length!==original.length)return false;
  let diff=0;for(let i=0;i<current.length;i++)diff|=current[i]^original[i];
  return diff===0;
}
function legacyPassword(profile,env){return profile==='Bloo'?env.BLOO_PASSWORD:env.PHOENIXX_PASSWORD}
async function currentPasswordOK(password,account,profile,env){
  if(account)return matchesPassword(password,account);
  const legacy=legacyPassword(profile,env);
  return passwordValid(password)&&typeof legacy==='string'&&password===legacy;
}
async function issueToken(profile,version,env){
  const payload=base64(encoder.encode(JSON.stringify({profile,version,expires:Date.now()+12*60*60*1000})));
  return payload+'.'+await sign(env.SESSION_SECRET,payload);
}
async function verifyToken(request,env) {
  const token=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  const parts=token.split('.');
  if(parts.length!==2)throw Error('Please sign in.');
  const expected=await sign(env.SESSION_SECRET,parts[0]);
  if(expected.length!==parts[1].length)throw Error('Session invalid.');
  let different=0;for(let i=0;i<expected.length;i++)different|=expected.charCodeAt(i)^parts[1].charCodeAt(i);
  if(different)throw Error('Session invalid.');
  const user=JSON.parse(new TextDecoder().decode(unbase64(parts[0])));
  if(!['Bloo','Phoenixx'].includes(user.profile)||Date.now()>user.expires)throw Error('Session expired.');
  await ensureAccounts(env);
  const account=await env.DB.prepare('SELECT session_version FROM studio_accounts WHERE profile=?').bind(user.profile).first();
  if(account&&user.version!==account.session_version)throw Error('Session expired. Please sign in again.');
  return user.profile;
}
function safeOrigin(request,env) {
  const origin=request.headers.get('origin');
  const allowed=(env.FRONTEND_ORIGIN||'').replace(/\/$/,'');
  if(origin&&origin!==allowed)throw Error('Unrecognized website origin.');
  return origin===allowed ? {'access-control-allow-origin':allowed,'vary':'Origin'} : {};
}
function cleanRecord(kind,entry,profile) {
  if(!entry||typeof entry!=='object'||Array.isArray(entry))throw Error('Invalid record.');
  const val=JSON.stringify(entry);
  if(val.length>200000)throw Error('Record too large.');
  const id=String(entry.id||crypto.randomUUID());
  if(!/^[a-zA-Z0-9_-]{8,80}$/.test(id))throw Error('Invalid record ID.');
  if(kind==='items'&&!String(entry.name||'').trim())throw Error('Item name is required.');
  if(kind==='recipes'&&!String(entry.title||'').trim())throw Error('Recipe title is required.');
  if(kind==='shopping'&&!String(entry.name||'').trim())throw Error('Shopping item name is required.');
  const data={...entry,id,owner:profile,updatedAt:new Date().toISOString()};
  return data;
}
export default {
 async fetch(request,env) {
  let headers={};
  try {
    headers=safeOrigin(request,env);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'access-control-allow-methods':'GET,POST,DELETE,OPTIONS','access-control-allow-headers':'Content-Type,Authorization','access-control-max-age':'86400'}});
    const url=new URL(request.url), path=url.pathname;
    if(path==='/api/health')return json({ok:true,version:'1.0.0'},200,headers);
    if(path==='/api/login'&&request.method==='POST') {
      const {profile,password}=await request.json();
      if(!['Bloo','Phoenixx'].includes(profile))return json({error:'Unknown studio member.'},401,headers);
      await ensureAccounts(env);
      const clientKey=profile+':'+await sign(env.SESSION_SECRET,request.headers.get('cf-connecting-ip')||'unknown');
      const now=Date.now();
      const attempts=await env.DB.prepare('SELECT attempts, expires_at FROM login_attempts WHERE identity=?').bind(clientKey).first();
      if(attempts&&attempts.expires_at>now&&attempts.attempts>=5)return json({error:'Too many attempts. Try again in fifteen minutes.'},429,headers);
      let account=await env.DB.prepare('SELECT * FROM studio_accounts WHERE profile=?').bind(profile).first();
      const allowed=await currentPasswordOK(password,account,profile,env);
      if(!allowed){
        await env.DB.prepare('INSERT INTO login_attempts(identity,attempts,expires_at) VALUES(?,?,?) ON CONFLICT(identity) DO UPDATE SET attempts=CASE WHEN expires_at<? THEN 1 ELSE attempts+1 END, expires_at=?')
          .bind(clientKey,1,now+900000,now,now+900000).run();
        return json({error:'Incorrect studio passphrase.'},401,headers);
      }
      // First valid legacy login migrates the profile to a hash; never store the password.
      if(!account){
        const next=await newPasswordRecord(password);
        await env.DB.prepare('INSERT OR IGNORE INTO studio_accounts (profile,salt,password_hash,iterations,session_version,updated_at) VALUES (?,?,?,?,?,?)')
          .bind(profile,next.salt,next.hash,next.iterations,next.version,new Date().toISOString()).run();
        account=await env.DB.prepare('SELECT * FROM studio_accounts WHERE profile=?').bind(profile).first();
        // Race-safe: a simultaneous first login may have created a different credential.
        if(!await matchesPassword(password,account))return json({error:'Incorrect studio passphrase.'},401,headers);
      }
      await env.DB.prepare('DELETE FROM login_attempts WHERE identity=?').bind(clientKey).run();
      const token=await issueToken(profile,account.session_version,env);
      return json({token,profile},200,headers);
    }
    const profile=await verifyToken(request,env);
    if(path==='/api/account/password'&&request.method==='POST'){
      const {currentPassword,newPassword}=await request.json();
      if(!passwordValid(newPassword))return json({error:'New password must be 12–128 characters.'},400,headers);
      if(currentPassword===newPassword)return json({error:'Choose a password different from the current one.'},400,headers);
      await ensureAccounts(env);
      const account=await env.DB.prepare('SELECT * FROM studio_accounts WHERE profile=?').bind(profile).first();
      if(!await currentPasswordOK(currentPassword,account,profile,env))return json({error:'Current password is incorrect.'},401,headers);
      const next=await newPasswordRecord(newPassword);
      if(account){
        const updated=await env.DB.prepare('UPDATE studio_accounts SET salt=?, password_hash=?, iterations=?, session_version=?, updated_at=? WHERE profile=? AND session_version=?')
          .bind(next.salt,next.hash,next.iterations,next.version,new Date().toISOString(),profile,account.session_version).run();
        if(updated.meta?.changes!==1)return json({error:'Account was updated elsewhere. Please sign in again.'},409,headers);
      }else{
        await env.DB.prepare('INSERT OR IGNORE INTO studio_accounts(profile,salt,password_hash,iterations,session_version,updated_at) VALUES(?,?,?,?,?,?)')
          .bind(profile,next.salt,next.hash,next.iterations,next.version,new Date().toISOString()).run();
        const saved=await env.DB.prepare('SELECT session_version FROM studio_accounts WHERE profile=?').bind(profile).first();
        if(saved?.session_version!==next.version)return json({error:'Account was updated elsewhere. Please sign in again.'},409,headers);
      }
      const token=await issueToken(profile,next.version,env);
      return json({ok:true,token,profile},200,headers);
    }
    if(path==='/api/state'&&request.method==='GET') {
      const r=await env.DB.prepare('SELECT kind, data FROM records ORDER BY updated_at DESC').all();
      const result={items:[],recipes:[],shopping:[],profile};
      for(const row of r.results){ if(result[row.kind]) result[row.kind].push(JSON.parse(row.data)); }
      return json(result,200,headers);
    }
    const recordMatch=path.match(/^\/api\/(items|recipes|shopping)(?:\/([a-zA-Z0-9_-]+))?$/);
    if(recordMatch){
      const kind=recordMatch[1],id=recordMatch[2];
      if(request.method==='POST'&&!id){
        const payload=await request.json(), incomingId=String(payload.id||'');
        const previous=incomingId?await env.DB.prepare('SELECT owner FROM records WHERE kind=? AND id=?').bind(kind,incomingId).first():null;
        if(kind==='items'&&previous&&previous.owner!==profile)return json({error:'Only the owner can edit this item.'},403,headers);
        const record=cleanRecord(kind,payload,profile);
        if(previous)record.owner=previous.owner;
        await env.DB.prepare('INSERT INTO records(kind,id,owner,data,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data, owner=excluded.owner, updated_at=excluded.updated_at').bind(kind,record.id,record.owner,JSON.stringify(record),record.updatedAt).run();
        return json({ok:true,record},200,headers);
      }
      if(request.method==='DELETE'&&id){
        const previous=await env.DB.prepare('SELECT owner FROM records WHERE kind=? AND id=?').bind(kind,id).first();
        if(kind==='items'&&previous&&previous.owner!==profile)return json({error:'Only the owner can delete this item.'},403,headers);
        await env.DB.prepare('DELETE FROM records WHERE kind=? AND id=?').bind(kind,id).run();
        return json({ok:true,id},200,headers);
      }
    }
    if(path==='/api/photos'&&request.method==='POST') {
      const type=request.headers.get('content-type')||'';
      if(!['image/jpeg','image/png','image/webp'].includes(type))return json({error:'Upload JPEG, PNG or WebP.'},400,headers);
      const bytes=await request.arrayBuffer();
      if(bytes.byteLength>4*1024*1024)return json({error:'Please upload images smaller than 4 MB.'},413,headers);
      const key=crypto.randomUUID();
      await env.PHOTOS.put(key,bytes,{httpMetadata:{contentType:type}});
      return json({ok:true,key},200,headers);
    }
    const photo=path.match(/^\/api\/photos\/([0-9a-f-]{36})$/);
    if(photo&&request.method==='GET'){
      const data=await env.PHOTOS.get(photo[1]);
      if(!data)return json({error:'Image not found.'},404,headers);
      return new Response(data.body,{headers:{...headers,'content-type':data.httpMetadata?.contentType||'image/jpeg','cache-control':'private, max-age=300'}});
    }
    return json({error:'Not found.'},404,headers);
  } catch(err) {
    const message=String(err?.message||err);
    const status=/Session|sign in|origin/i.test(message)?401:400;
    return json({error:message},status,headers);
  }
 }
};
