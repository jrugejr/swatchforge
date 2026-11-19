/* SwatchForge mobile-friendly color studio, including chameleon gradients. */
(()=>{
'use strict';
const presets=['#682a91','#128e91','#c3883e','#cb477b','#78ad52','#374ca4'];
const valid=c=>/^#[0-9a-f]{6}$/i.test(c);
function hsvhex(h,s,v){
 const n=(k)=>(k+h/60)%6;
 const f=k=>v-v*s*Math.max(Math.min(n(k),4-n(k),1),0);
 return '#'+[f(5),f(3),f(1)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');
}
function hsv(hex){
 const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=0;
 if(d){if(max===r)h=60*((g-b)/d%6);else if(max===g)h=60*((b-r)/d+2);else h=60*((r-g)/d+4)}
 return {h:(h+360)%360,s:max?d/max:0,v:max};
}
function setup(){
 const editor=document.querySelector('#editor-content');if(!editor)return;
 const input=editor.querySelector('input[name=color][type=color]'),finish=editor.querySelector('select[name=finish]'),hidden=editor.querySelector('input[name=shiftColors]'),mode=editor.querySelector('select[name=swatchMode]'),build=editor.querySelector('select[name=buildStrength]'),symbol=editor.querySelector('select[name=clearSymbol]');
 if(!input||!finish||!hidden||input.dataset.paletteReady)return;
 input.dataset.paletteReady='true';
 let shifts=[];try{shifts=JSON.parse(hidden.value)}catch{}
 if(!Array.isArray(shifts))shifts=[];shifts=shifts.filter(valid).slice(0,6);
 let color=valid(input.value)?input.value:'#8d6679',active=-1,state=hsv(color);
 const isShiftFinish=()=>['Chameleon','Cat Eye','Magnetic'].includes(finish.value);

 const box=document.createElement('section');box.className='sf-palette wide';
 box.innerHTML=[
 '<div class="sf-palette-head"><strong>Color Studio</strong><small>Easy-to-use color controls</small></div>',
 '<div class="sf-gradient-preview"></div>',
 '<div class="sf-shift-area" hidden><div class="sf-shift-title"><strong>Chameleon shifts</strong><div class="sf-stepper"><button class="button secondary" type="button" data-minus>−</button><span class="sf-count"></span><button class="button secondary" type="button" data-plus>+</button></div></div><div class="sf-shift-colors"></div><p class="small">Gradient previews approximate the color shifts; appearance changes with light.</p></div>',
 '<p class="sf-color-title">Adjust <strong class="sf-active-label">Swatch color</strong></p>',
 '<div class="sf-sv" aria-label="Adjust color saturation and brightness"><div class="sf-sv-target"></div></div>',
 '<label class="sf-hue-label">Hue<input class="sf-hue" type="range" min="0" max="359" step="1"></label>',
 '<label class="sf-hex-label">Hex color<input class="sf-hex" type="text" maxlength="7" spellcheck="false"></label>'
 ].join('');
 input.closest('label').insertAdjacentElement('afterend',box);input.classList.add('sf-native-color-hidden');
 const preview=box.querySelector('.sf-gradient-preview'),sv=box.querySelector('.sf-sv'),dot=box.querySelector('.sf-sv-target'),slider=box.querySelector('.sf-hue'),hex=box.querySelector('.sf-hex'),area=box.querySelector('.sf-shift-area'),chips=box.querySelector('.sf-shift-colors'),count=box.querySelector('.sf-count'),title=box.querySelector('.sf-active-label');
 function controls(){
  const current=active>=0&&isShiftFinish()?shifts[active]:color;
  state=hsv(current);
  slider.value=Math.round(state.h);sv.style.backgroundColor=hsvhex(state.h,1,1);
  dot.style.left=state.s*100+'%';dot.style.top=(1-state.v)*100+'%';hex.value=current.toUpperCase();
 }
 function show(){
  const multi=isShiftFinish();
  const displayMode=mode?.value||'solid',clear=displayMode==='clear';
  const material=window.SwatchforgeMaterial;
  const info=material?.info({swatchMode:displayMode,buildStrength:build?.value,color,shiftColors:multi?shifts:[],clearSymbol:symbol?.value});
  preview.classList.toggle('sf-checker',displayMode!=='solid');
  preview.style.background=displayMode==='solid'?'linear-gradient(100deg,'+(multi?shifts:[color,color]).join(',')+')':'';
  let layer=preview.querySelector('.sf-material-fill');
  if(!layer){layer=document.createElement('span');layer.className='sf-material-fill';preview.appendChild(layer)}
  layer.style.background=info?.fill||'transparent';
  layer.hidden=displayMode==='solid';
  let iconEl=preview.querySelector('.sf-material-symbol');
  if(iconEl)iconEl.remove();
  const colorArea=box.querySelector('.sf-color-title');
  for(const elem of [sv,slider.closest('label'),hex.closest('label'),colorArea])if(elem)elem.hidden=clear;
  const buildChoice=editor.querySelector('.sf-build-choice'),clearChoice=editor.querySelector('.sf-clear-choice'),swatchColorLabel=input.closest('label');
  if(buildChoice)buildChoice.hidden=!['jelly','milky'].includes(displayMode);
  if(clearChoice)clearChoice.hidden=true;
  if(swatchColorLabel)swatchColorLabel.hidden=clear;
  area.hidden=!(multi&&!clear&&displayMode==='solid');
  area.querySelector('.sf-shift-title strong').textContent=finish.value==='Cat Eye'?'Cat Eye color shifts':'Chameleon shifts';
  input.value=color;
  hidden.value=JSON.stringify(multi?shifts:[]);
  count.textContent=shifts.length;
  title.textContent=multi?'Shift '+(active+1):'Swatch color';
  chips.replaceChildren();
  if(multi&&displayMode==='solid')shifts.forEach((c,i)=>{
   const b=document.createElement('button');b.type='button';b.className='sf-shift-choice'+(i===active?' active':'');b.setAttribute('aria-label','Edit color shift '+(i+1));
   const sw=document.createElement('span');sw.className='sf-shift-dot';sw.style.background=c;
   const tx=document.createElement('span');tx.textContent='Shift '+(i+1);b.append(sw,tx);
   b.addEventListener('click',()=>{active=i;controls();show()});chips.append(b);
  });
 }
 function apply(next){
  if(!valid(next))return;next=next.toLowerCase();
  if(active>=0&&isShiftFinish())shifts[active]=next;else color=next;
  controls();show();
 }
 function finishChange(){
  if(isShiftFinish()){if(shifts.length<2)shifts=[color,presets[1],presets[2]];active=Math.max(0,Math.min(active,shifts.length-1))}
  else active=-1;
  controls();show();
 }
 finish.addEventListener('change',finishChange);
 if(mode)mode.addEventListener('change',show);
 if(build)build.addEventListener('change',show);
 if(symbol)symbol.addEventListener('change',show);

 box.querySelector('[data-minus]').addEventListener('click',()=>{if(shifts.length<3)return;shifts.pop();active=Math.min(active,shifts.length-1);controls();show()});
 box.querySelector('[data-plus]').addEventListener('click',()=>{if(shifts.length>=6)return;shifts.push(presets[shifts.length]);active=shifts.length-1;controls();show()});
 slider.addEventListener('input',()=>apply(hsvhex(Number(slider.value),state.s,state.v)));
 hex.addEventListener('change',()=>{if(valid(hex.value.trim()))apply(hex.value.trim());else controls()});
 function move(e){const r=sv.getBoundingClientRect();state.s=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width));state.v=1-Math.min(1,Math.max(0,(e.clientY-r.top)/r.height));apply(hsvhex(state.h,state.s,state.v))}
 sv.addEventListener('pointerdown',e=>{sv.setPointerCapture(e.pointerId);move(e)});
 sv.addEventListener('pointermove',e=>{if(sv.hasPointerCapture(e.pointerId))move(e)});
 finishChange();
}
document.addEventListener('DOMContentLoaded',()=>{const el=document.querySelector('#editor-content');if(el){new MutationObserver(setup).observe(el,{childList:true,subtree:true});setup()}});
})();