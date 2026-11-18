/* SwatchForge Photo Prep — preserve normal camera settings; fit uploads under Cloudflare's 4 MiB limit. */
(()=>{'use strict';
const TARGET=3.7*1024*1024;
function label(file){return String(file?.name||'photo').replace(/\.[^.]*$/,'').replace(/[^a-z0-9_-]+/gi,'-').slice(0,65)||'photo'}
async function prepare(file){
 if(!file||!file.size)throw Error('Choose a photo first.');
 if(file.size<=TARGET&&['image/jpeg','image/png','image/webp'].includes(file.type))return file;
 // Decode using the phone/browser's own image support (including HEIC where supported).
 const url=URL.createObjectURL(file);let bitmap;
 try{
  const img=new Image();img.src=url;
  try{await img.decode()}catch{throw Error('This phone could not open the photo format. Try sharing it from Photos as JPEG or using the phone camera again.')}
  if(!img.naturalWidth||!img.naturalHeight)throw Error('Could not read photo dimensions.');
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)throw Error('Photo processing is unavailable on this device.');
  const steps=[[2600,.88],[2400,.84],[2200,.80],[2000,.76],[1800,.73],[1600,.70],[1400,.68],[1200,.65],[1000,.62]];
  for(const [maxDimension,quality] of steps){
   const scale=Math.min(1,maxDimension/Math.max(img.naturalWidth,img.naturalHeight));
   canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
   canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.drawImage(img,0,0,canvas.width,canvas.height);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
   if(blob&&blob.size<=TARGET)return new File([blob],label(file)+'.jpg',{type:'image/jpeg',lastModified:Date.now()});
  }
  throw Error('This photo is too complex to fit the upload limit. Try a cropped version.');
 }finally{
  URL.revokeObjectURL(url);
 }
}
window.SwatchforgePreparePhoto=prepare;
})();