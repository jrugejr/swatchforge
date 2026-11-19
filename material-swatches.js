/* Shared material swatch rendering for inventory and recipe catalog. */
(()=>{'use strict';
const valid=c=>/^#[0-9a-f]{6}$/i.test(c);
function rgba(hex,a){const n=parseInt(valid(hex)?hex.slice(1):'8d6679',16);return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')'}
function info(x){
 const mode=['solid','jelly','milky','clear'].includes(x.swatchMode)?x.swatchMode:'solid';
 const strength=['light','medium','strong'].includes(x.buildStrength)?x.buildStrength:'medium',color=valid(x.color)?x.color:'#8d6679';
 const levels={light:[.12,.27,.46],medium:[.23,.48,.72],strong:[.34,.65,.91]}[strength];
 const overlay='linear-gradient(90deg,'+levels.map((v,i)=>rgba(color,v)+' '+i*50+'%').join(',')+')';
 const shifts=Array.isArray(x.shiftColors)?x.shiftColors.filter(valid).slice(0,6):[];
 const solid=shifts.length>=2?'linear-gradient(110deg,'+shifts.join(',')+')':color;
 const haze='linear-gradient(90deg,rgba(255,255,255,.22),rgba(255,255,255,.43) 50%,rgba(255,255,255,.65))';
 const symbol=['matte','gloss','transparent'].includes(x.clearSymbol)?x.clearSymbol:'transparent';
 return {mode,fill:mode==='solid'?solid:mode==='jelly'?overlay:mode==='milky'?haze+','+overlay:'transparent',symbol};
}
function symbol(type){
 if(type==='gloss')return '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M18 4 Q20 17 32 19 Q20 21 18 34 Q16 21 4 19 Q16 17 18 4Z M36 23 Q37 31 45 32 Q37 34 36 42 Q34 34 27 32 Q34 31 36 23Z" stroke="currentColor" stroke-width="1.7" fill="none"/></svg>';
 if(type==='matte')return '<svg viewBox="0 0 48 48" aria-hidden="true">'+Array.from({length:7},(_,y)=>Array.from({length:7},(_,x)=>'<circle cx="'+(7+x*5.7)+'" cy="'+(6+y*5.7)+'" r="1.2" fill="currentColor"/>').join('')).join('')+'</svg>';
 return '<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 3V45M24 3V45M37 3V45M3 11H45M3 24H45M3 37H45"/><path d="M5 28H15Q20 28 20 33T26 33V27Q26 22 31 22T36 27H43" stroke-width="2"/></g></svg>';
}
function render(x,cls='swatch'){
 const {mode,fill,symbol:icon}=info(x);
 const esc=s=>String(s).replace(/"/g,'&quot;');
 return '<span class="'+cls+' sf-material-swatch'+(mode!=='solid'?' sf-checker':'')+'" role="img" aria-label="'+esc(mode==='clear'?'Clear transparent swatch':mode+' swatch')+'"><span class="sf-material-fill" style="background:'+esc(fill)+'"></span></span>';
}
window.SwatchforgeMaterial={info,render};
})();