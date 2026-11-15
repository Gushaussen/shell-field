const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const defaults=Object.freeze({dome:40,rimround:35,deeppos:0,tiplean:0,crossround:50,profile:50});
export function normalizeForm(input={}) {
  const result={};
  for(const key of Object.keys(defaults)){
    const value=Number(input[key]??defaults[key]);
    if(!Number.isFinite(value))throw new TypeError(`Invalid Shell Form parameter: ${key}`);
    result[key]=clamp(value,...(['deeppos','tiplean'].includes(key)?[-50,50]:[0,100]))/100;
  }
  return Object.freeze(result);
}
// All heights are fractions of calibrated base-tip length.
export function createShellForm(input={}) {
  const p=normalizeForm(input);
  return function height({depth,u,estimatedHeight,profileHeight=null,rimHeight=0}) {
    for(const [key,value] of Object.entries({depth,u,estimatedHeight,rimHeight}))
      if(!Number.isFinite(value))throw new TypeError(`Invalid shell sample: ${key}`);
    if(profileHeight!==null&&!Number.isFinite(profileHeight))throw new TypeError('Invalid reviewed profile height');
    const d=clamp(depth,0,1),t=clamp(u,0,1);
    if(d===0)return rimHeight;
    const peak=clamp(.5+p.deeppos*.8,.1,.9);
    const shifted=t<=peak?.5*t/peak:.5+.5*(t-peak)/(1-peak);
    const ratio=t===0?.5/peak:t===1?.5/(1-peak):(4*shifted*(1-shifted))/(4*t*(1-t));
    const positionGain=clamp(Math.sqrt(Math.max(0,ratio)),0,2);
    const rounding=Math.pow(d,(.35-p.rimround)*.8);
    const cross=Math.pow(d,(.5-p.crossround)*.8);
    const lean=1+p.tiplean*(2*t-1);
    const estimated=(estimatedHeight-rimHeight)*(p.dome/.4)*rounding*cross*positionGain*lean;
    const reviewed=profileHeight===null?estimated:profileHeight-rimHeight;
    const mixed=profileHeight===null?estimated:estimated*(1-p.profile)+reviewed*p.profile;
    const result=rimHeight+mixed;
    if(!Number.isFinite(result))throw new RangeError('Non-finite Shell Form height');
    return result;
  };
}
export function longitudinalPosition(x,y,base,tip) {
  const values=[x,y,...base,...tip];
  if(values.length!==6||values.some(v=>!Number.isFinite(v)))throw new TypeError('Invalid base-tip coordinates');
  const dx=tip[0]-base[0],dy=tip[1]-base[1],length2=dx*dx+dy*dy;
  if(length2<=1e-12)throw new RangeError('Base and tip must be distinct');
  return clamp(((x-base[0])*dx+(y-base[1])*dy)/length2,0,1);
}
