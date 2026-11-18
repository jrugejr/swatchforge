/* SwatchForge Nail Photo Studio — local camera, batch photo picker, optional framing. */
(()=>{'use strict';
const choices={
 full:{label:'Full Set · portrait',ratio:3/4,hint:'Leave breathing room around the complete set.'},
 detail:{label:'Single Nail · square',ratio:1,hint:'Center the nail and its artwork.'},
 process:{label:'Process · landscape',ratio:4/3,hint:'Keep the nail and tool together in the frame.'}
};
let target=null,stream=null,face='environment',mode='full',source=null,sourceURL='',zoom=1,px=0,py=0,lastPointer=null,shotCount=0;
const $=s=>document.querySelector(s), dlg=()=>$('#nail-photo-studio');
const safeName=name=>String(name||'nail-photo').replace(/\.[^.]+$/,'').replace(/[^a-z0-9_-]+/gi,'-').slice(0,60);
function notify(msg){const el=$('#nail-photo-status');if(el)el.textContent=msg}
function fileSet(input,file){const d=new DataTransfer();d.items.add(file);input.files=d.files;input.dispatchEvent(new Event('change',{bubbles:true}));}
function stop(){if(stream){for(const t of stream.getTracks())t.stop();stream=null}const v=$('#nail-video');if(v)v.srcObject=null}
function revoke(){if(sourceURL){URL.revokeObjectURL(sourceURL);sourceURL=''}source=null}
function closeStudio(){stop();revoke();if(dlg()?.open)dlg().close();target=null;lastPointer=null}
async function cameraReadyFile(file){return await window.SwatchforgePreparePhoto(file)}
function wrapFileFields(){
 const editor=$('#editor-content');if(!editor)return;
 for(const input of editor.querySelectorAll('input[type="file"][accept*="image"]')){
  if(input.dataset.studioReady)continue;input.dataset.studioReady='yes';
  const group=document.createElement('div');group.className='nail-photo-tools';
  group.innerHTML='<button type="button" class="button secondary" data-nail-native>Open phone camera</button><button type="button" class="button secondary" data-nail-camera>Guided camera</button><button type="button" class="button secondary" data-nail-batch>Choose from gallery</button><button type="button" class="button secondary" data-nail-crop>Crop selected photo</button><span class="nail-photo-file-note">Normal upload also works. Framing is optional.</span>';
  input.closest('label')?.insertAdjacentElement('afterend',group);
  input.addEventListener('change',()=>{const note=group.querySelector('.nail-photo-file-note');if(note)note.textContent=input.files[0]?'Selected: '+input.files[0].name:'Normal upload also works. Framing is optional.'});
  for(const btn of group.querySelectorAll('button'))btn.dataset.photoInput='yes';
  group.querySelector('[data-nail-native]').addEventListener('click',()=>{
   const picker=document.createElement('input');
   picker.type='file';picker.accept='image/*';picker.capture='environment';
   picker.style.position='fixed';picker.style.left='-200vw';document.body.appendChild(picker);
   let chosen=false;
   picker.addEventListener('change',async()=>{
    chosen=true;const file=picker.files?.[0];picker.remove();if(!file)return;
    try{fileSet(input,await cameraReadyFile(file))}catch(err){const note=group.querySelector('.nail-photo-file-note');if(note)note.textContent='Could not prepare camera photo: '+err.message}
   },{once:true});
   picker.click();
   window.addEventListener('focus',()=>{setTimeout(()=>{if(!chosen&&!picker.files?.length)picker.remove()},1200)},{once:true});
  });
  group.querySelector('[data-nail-camera]').addEventListener('click',()=>openStudio(input,true));
  group.querySelector('[data-nail-batch]').addEventListener('click',()=>input.click());
  group.querySelector('[data-nail-crop]').addEventListener('click',()=>{if(input.files?.[0])openStudio(input,false,input.files[0]);else{input.click();}});
 }
}
function makeDialog(){
 if(dlg())return;
 const el=document.createElement('dialog');el.id='nail-photo-studio';el.setAttribute('aria-label','SwatchForge Nail Photo Studio');
 el.innerHTML=`<div class="nail-studio-inner">
 <div class="nail-studio-heading"><div><div class="nail-studio-eyebrow">GILDED & PRESSED</div><h2>Nail Photo Studio</h2><p>Capture now, or crop a photo taken earlier.</p></div><button type="button" class="nail-studio-x" data-nail-close aria-label="Close photo studio">×</button></div>
 <div class="nail-studio-tabs"><button type="button" class="button secondary" data-nail-tab="camera">Guided camera</button><button type="button" class="button secondary" data-nail-tab="crop">Crop / frame</button></div>
 <label class="nail-studio-select">Framing guide<select id="nail-mode"><option value="full">Full Set · portrait (3:4)</option><option value="detail">Single Nail · square (1:1)</option><option value="process">Process · landscape (4:3)</option></select></label>
 <p id="nail-mode-hint" class="nail-mode-hint"></p>
 <div id="nail-camera-area"><div class="nail-camera-window"><video id="nail-video" autoplay muted playsinline></video><div class="nail-camera-guides"><div class="nail-guide-frame"><span class="nail-guide-nails"></span><span class="nail-guide-cross"></span></div></div></div><div class="nail-studio-controls"><button type="button" class="button" data-nail-capture>Capture</button><button type="button" class="button secondary" data-nail-flip>Flip camera</button></div></div>
 <div id="nail-crop-area" hidden><div class="nail-crop-canvas-wrap"><canvas id="nail-crop-canvas" width="750" height="1000" aria-label="Crop preview; drag photo to reposition"></canvas></div><label>Adjust framing <input id="nail-zoom" type="range" min="1" max="3" step=".02" value="1"></label><p class="nail-mode-hint">Drag the image to reposition it. The guide and overlay will not appear in the saved photo.</p><div class="nail-studio-controls"><button type="button" class="button" data-nail-apply>Use framed photo</button><button type="button" class="button secondary" data-nail-original>Keep original</button><button type="button" class="button secondary" data-nail-retake>Retake / Choose another</button></div></div>
 <p id="nail-photo-status" role="status" aria-live="polite">Photos are processed locally until you save the form.</p>
 </div>`;
 document.body.append(el);
 el.addEventListener('cancel',()=>{stop();revoke();target=null});
 el.querySelector('[data-nail-close]').addEventListener('click',closeStudio);
 el.querySelector('[data-nail-tab="camera"]').addEventListener('click',()=>cameraPanel());
 el.querySelector('[data-nail-tab="crop"]').addEventListener('click',()=>{if(source)showTab(false);else if(target?.files?.[0])loadFile(target.files[0]);else notify('Choose a photo first using the gallery or camera.');});
 el.querySelector('[data-nail-capture]').addEventListener('click',capture);
 el.querySelector('[data-nail-flip]').addEventListener('click',()=>{face=face==='environment'?'user':'environment';startCamera()});
 el.querySelector('[data-nail-apply]').addEventListener('click',applyCrop);
 el.querySelector('[data-nail-original]').addEventListener('click',()=>{if(source?.file){fileSet(target,source.file);closeStudio()}else notify('This image is a camera capture; use framed photo or retake.')});
 el.querySelector('[data-nail-retake]').addEventListener('click',()=>{if(source?.camera)cameraPanel();else {const input=target;closeStudio();input?.click()}});
 el.querySelector('#nail-mode').addEventListener('change',e=>{mode=e.target.value;setMode();renderCrop()});
 el.querySelector('#nail-zoom').addEventListener('input',e=>{zoom=Number(e.target.value);clampPan();renderCrop()});
 const canvas=el.querySelector('#nail-crop-canvas');
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);lastPointer={x:e.clientX,y:e.clientY}});
 canvas.addEventListener('pointermove',e=>{if(!lastPointer)return;const rect=canvas.getBoundingClientRect();px+=(e.clientX-lastPointer.x)/rect.width;py+=(e.clientY-lastPointer.y)/rect.height;lastPointer={x:e.clientX,y:e.clientY};clampPan();renderCrop()});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>lastPointer=null);
}
function setMode(){
 const spec=choices[mode],frame=$('.nail-guide-frame');$('#nail-mode-hint').textContent=spec.hint;
 const area=$('.nail-camera-window');area.style.aspectRatio=String(spec.ratio);
 frame.className='nail-guide-frame nail-guide-'+mode;
 const canvas=$('#nail-crop-canvas');canvas.width=mode==='process'?1000:mode==='detail'?900:750;canvas.height=mode==='process'?750:mode==='detail'?900:1000;
}
function showTab(camera){
 $('#nail-camera-area').hidden=!camera;$('#nail-crop-area').hidden=camera;
 for(const el of dlg().querySelectorAll('[data-nail-tab]'))el.classList.toggle('nail-tab-active',(el.dataset.nailTab==='camera')===camera);
}
async function startCamera(){
 stop();if(!navigator.mediaDevices?.getUserMedia){notify('This browser does not support live camera access. Use your phone camera and upload the photo instead.');return}
 const button=dlg().querySelector('[data-nail-capture]');button.disabled=true;notify('Requesting camera access…');
 try{
  stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:face},width:{ideal:1920},height:{ideal:1440}}});
  if(!dlg()?.open){stop();return}
  const video=$('#nail-video');video.srcObject=stream;await video.play();notify('Frame your nails within the guide. Nothing is uploaded until you save.');button.disabled=false;
 }catch(err){notify('Camera unavailable ('+(err.name||'permission')+'). You can still upload or crop an existing photo.');button.disabled=true}
}
async function cameraPanel(){showTab(true);setMode();await startCamera()}
async function openStudio(input,camera,file){
 makeDialog();target=input;mode='full';$('#nail-mode').value=mode;setMode();dlg().showModal();
 if(camera)await cameraPanel();else await loadFile(file);
}
async function loadFile(file,isCapture=false){
 if(!file||!file.type.startsWith('image/')){notify('Choose a JPEG, PNG, or WebP photo.');return}
 stop();revoke();sourceURL=URL.createObjectURL(file);
 try{const img=new Image();img.decoding='async';img.src=sourceURL;await img.decode();source={img,file:isCapture?null:file,camera:isCapture};zoom=1;px=0;py=0;$('#nail-zoom').value='1';showTab(false);setMode();renderCrop();notify('Adjust your framing, or keep the original photo.')}catch{notify('Could not open this image. Try a JPG or PNG.')}
}
async function capture(){
 const video=$('#nail-video');if(!video.videoWidth){notify('Camera is still starting.');return}
 const ratio=choices[mode].ratio,w=video.videoWidth,h=video.videoHeight;let sw=w,sh=h;if(w/h>ratio)sw=h*ratio;else sh=w/ratio;
 const canvas=document.createElement('canvas');const longest=1600;canvas.width=ratio>1?longest:Math.round(longest*ratio);canvas.height=ratio>1?Math.round(longest/ratio):longest;
 canvas.getContext('2d').drawImage(video,(w-sw)/2,(h-sh)/2,sw,sh,0,0,canvas.width,canvas.height);
 canvas.toBlob(async blob=>{if(!blob){notify('Could not capture. Try again.');return}const file=new File([blob],'nail-capture-'+(++shotCount)+'.jpg',{type:'image/jpeg'});await loadFile(file,true)},'image/jpeg',.87);
}
function metrics(){
 if(!source)return null;const img=source.img,canvas=$('#nail-crop-canvas'),w=canvas.width,h=canvas.height;
 const base=Math.max(w/img.naturalWidth,h/img.naturalHeight),scale=base*zoom,iw=img.naturalWidth*scale,ih=img.naturalHeight*scale;
 return {canvas,w,h,iw,ih,base,scale};
}
function clampPan(){
 const m=metrics();if(!m)return;px=Math.max(-.5*(m.iw-m.w)/m.w,Math.min(.5*(m.iw-m.w)/m.w,px));py=Math.max(-.5*(m.ih-m.h)/m.h,Math.min(.5*(m.ih-m.h)/m.h,py));
}
function renderCrop(){
 const m=metrics();if(!m)return;clampPan();const ctx=m.canvas.getContext('2d');ctx.clearRect(0,0,m.w,m.h);
 ctx.fillStyle='#fff7ed';ctx.fillRect(0,0,m.w,m.h);ctx.drawImage(source.img,(m.w-m.iw)/2+px*m.w,(m.h-m.ih)/2+py*m.h,m.iw,m.ih);
}
function applyCrop(){
 const m=metrics();if(!m||!target)return;const button=dlg().querySelector('[data-nail-apply]');button.disabled=true;notify('Preparing framed photo…');
 m.canvas.toBlob(blob=>{button.disabled=false;if(!blob){notify('Could not export the photo.');return}
 const file=new File([blob],safeName(source?.file?.name||'nail-photo')+'-framed.jpg',{type:'image/jpeg',lastModified:Date.now()});fileSet(target,file);closeStudio();},'image/jpeg',.86);
}
document.addEventListener('DOMContentLoaded',()=>{
 makeDialog();const editor=$('#editor-content');if(editor){new MutationObserver(wrapFileFields).observe(editor,{childList:true,subtree:true});wrapFileFields()}
});
})();