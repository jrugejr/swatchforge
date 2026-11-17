// SwatchForge Shared Studio API — Cloudflare Worker, D1 + R2.
// Secrets (never commit): BLOO_PASSWORD, PHOENIXX_PASSWORD, SESSION_SECRET.
// The browser never gets a Sheets/Drive secret or a studio password.
const kinds = new Set(['items','recipes','shopping']);
const encoder = new TextEncoder();
function json(value, status=200, headers={}) { return new Response(JSON.stringify(value), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}}); }
function base64(bytes) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function unbase64(s) { const raw=atob(s.replace(/-/g,'+').replace(/_/g,'/')); return Uint8Array.from(raw,c=>c.charCodeAt(0)); }
async function sign(secret, text) {
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),'HMAC',false,['sign']);
  return base64(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(text))));
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
  const data={...entry,id,owner:kind==='items'?profile:(entry.owner||profile),updatedAt:new Date().toISOString()};
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
      const expected=profile==='Bloo'?env.BLOO_PASSWORD:env.PHOENIXX_PASSWORD;
      const clientKey=profile+':'+await sign(env.SESSION_SECRET,request.headers.get('cf-connecting-ip')||'unknown');
      const now=Date.now();
      const attempts=await env.DB.prepare('SELECT attempts, expires_at FROM login_attempts WHERE identity=?').bind(clientKey).first();
      if(attempts&&attempts.expires_at>now&&attempts.attempts>=5)return json({error:'Too many attempts. Try again in fifteen minutes.'},429,headers);
      // This is a private two-member beta. Set long random secrets in Wrangler;
      // switch to managed identity before wider/public use.
      if(!expected||typeof password!=='string'||password.length<12||password!==expected) {
        await env.DB.prepare('INSERT INTO login_attempts(identity,attempts,expires_at) VALUES(?,?,?) ON CONFLICT(identity) DO UPDATE SET attempts=CASE WHEN expires_at<? THEN 1 ELSE attempts+1 END, expires_at=?')
          .bind(clientKey,1,now+900000,now,now+900000).run();
        return json({error:'Incorrect studio passphrase.'},401,headers);
      }
      await env.DB.prepare('DELETE FROM login_attempts WHERE identity=?').bind(clientKey).run();
      const payload=base64(encoder.encode(JSON.stringify({profile,expires:Date.now()+12*60*60*1000})));
      const token=payload+'.'+await sign(env.SESSION_SECRET,payload);
      return json({token,profile},200,headers);
    }
    const profile=await verifyToken(request,env);
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
        const existing=previous&&kind!=='items' ? previous.owner : null;
        if(existing)record.owner=existing;
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
