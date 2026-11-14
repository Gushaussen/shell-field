(() => {
  const brand = document.querySelector('#shellToolBar .shell-tool-brand');
  if (!brand || brand.dataset.fluidWordmark) return;
  brand.dataset.fluidWordmark = 'true';
  const duplicate = document.querySelector('main aside > h1');
  if (duplicate?.textContent.trim().toUpperCase() === 'SHELL FIELD') duplicate.remove();
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const style = document.createElement('style');
  style.textContent = `
    #shellToolBar .shell-tool-brand{display:inline-flex;align-items:center;flex-shrink:0;white-space:nowrap;line-height:1.6;padding:5px 0;overflow:visible}
    #shellToolBar .shell-fluid-word{display:inline-flex;white-space:pre;transform-origin:50% 65%;pointer-events:none}
    #shellToolBar .shell-fluid-letter{display:inline-block;white-space:pre;transform-origin:50% 75%}
    @media(prefers-reduced-motion:reduce){#shellToolBar .shell-fluid-word,#shellToolBar .shell-fluid-letter{transform:none!important}}
  `;
  document.head.append(style);
  brand.setAttribute('aria-label','Shell Field — return to Point Cloud Studio');
  const word = document.createElement('span');
  word.className = 'shell-fluid-word';
  word.setAttribute('aria-hidden','true');
  const letters = [...'SHELL FIELD'].map(character => {
    const span = document.createElement('span');
    span.className = 'shell-fluid-letter';
    span.textContent = character;
    word.append(span);
    return span;
  });
  brand.replaceChildren(word);
  const animations = new Map();
  let pending = 0, pointer = null, hovering = false;
  const neutral = 'translate(0px,0px) rotate(0deg) skewX(0deg) scale(1,1)';
  function animate(element,frames,options){
    if (motion.matches || !element.animate) return;
    const current = getComputedStyle(element).transform;
    animations.get(element)?.cancel();
    const animation = element.animate([{transform:current === 'none' ? neutral : current},...frames],options);
    animations.set(element,animation);
  }
  function settle(){
    if(pending)cancelAnimationFrame(pending);
    pending=0;
    letters.forEach((letter,index)=>animate(letter,[
      {transform:'translateY(1px) rotate('+((index%2 ? 1 : -1)*1.2)+'deg) scale(1.025,.97)',offset:.65},
      {transform:neutral}
    ],{duration:540,delay:index*9,easing:'cubic-bezier(.22,.7,.25,1)',fill:'forwards'}));
  }
  function deform(){
    pending=0;
    if(!hovering || !pointer || motion.matches)return;
    const rect=brand.getBoundingClientRect();
    const x=Math.max(0,Math.min(1,(pointer.x-rect.left)/Math.max(1,rect.width)));
    const y=Math.max(-1,Math.min(1,(pointer.y-rect.top-rect.height/2)/Math.max(1,rect.height/2)));
    letters.forEach((letter,index)=>{
      const distance=x-index/(letters.length-1);
      const weight=Math.exp(-distance*distance/0.045);
      const transform='translate('+(distance*7*weight)+'px,'+((-3+y*1.4)*weight)+'px) rotate('+(distance*15*weight)+'deg) skewX('+(distance*9*weight)+'deg) scale('+(1-.055*weight)+','+(1+.18*weight)+')';
      animate(letter,[{transform}],{duration:280,delay:Math.min(45,Math.abs(distance)*70),easing:'cubic-bezier(.2,.75,.25,1)',fill:'forwards'});
    });
  }
  brand.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch' || motion.matches)return;
    hovering=true;pointer={x:event.clientX,y:event.clientY};
    if(!pending)pending=requestAnimationFrame(deform);
  });
  brand.addEventListener('pointerleave',()=>{hovering=false;pointer=null;settle()});
  brand.addEventListener('pointercancel',()=>{hovering=false;pointer=null;settle()});
  brand.addEventListener('click',()=>{
    animate(word,[
      {transform:'scale(1.065,.84)',offset:.25},
      {transform:'scale(.99,1.045)',offset:.68},
      {transform:neutral}
    ],{duration:480,easing:'cubic-bezier(.22,.7,.25,1)',fill:'forwards'});
  });
  motion.addEventListener('change',()=>{
    if(pending)cancelAnimationFrame(pending);
    pending=0;
    animations.forEach(animation=>animation.cancel());
    animations.clear();
  });
  letters.forEach((letter,index)=>animate(letter,[
    {transform:'translateY(-3px) scale(.95,1.18)',offset:.35},
    {transform:'translateY(1px) scale(1.025,.96)',offset:.72},
    {transform:neutral}
  ],{duration:760,delay:index*38,easing:'cubic-bezier(.22,.7,.25,1)',fill:'forwards'}));
})();
