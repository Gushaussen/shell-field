function solveSmoothBowl(mask,width,height,source,dx,dy,maxIterations=2400,tolerance=1e-7){
  if(width<3||height<3||mask.length!==width*height||source.length!==mask.length||!(dx>0)||!(dy>0))throw Error('Invalid smooth bowl grid');
  const values=new Float64Array(mask.length),ax=1/(dx*dx),ay=1/(dy*dy),denom=2*(ax+ay),omega=1.7;
  let iterations=0,change=Infinity;
  for(;iterations<maxIterations;iterations++){
    change=0;
    for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
      const i=y*width+x;if(!mask[i])continue;
      const target=(ax*(values[i-1]+values[i+1])+ay*(values[i-width]+values[i+width])+source[i])/denom;
      const delta=omega*(target-values[i]);values[i]+=delta;change=Math.max(change,Math.abs(delta));
    }
    if(iterations>20&&change<tolerance)break;
  }
  if(change>=tolerance)throw Error('Smooth bowl solver did not converge');
  let maximum=0,residual=0;
  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
    const i=y*width+x;if(!mask[i])continue;
    if(!Number.isFinite(values[i]))throw Error('Non-finite smooth bowl solution');
    maximum=Math.max(maximum,values[i]);
    residual=Math.max(residual,Math.abs(denom*values[i]-ax*(values[i-1]+values[i+1])-ay*(values[i-width]+values[i+width])-source[i]));
  }
  if(!(maximum>0))throw Error('Outline is too thin for a smooth bowl grid');
  return {values:Float64Array.from(values,v=>v/maximum),width,height,iterations:iterations+1,residual,maximum};
}
function sampleSmoothBowl(field,x,y){
  const px=Math.max(0,Math.min(field.width-1,x)),py=Math.max(0,Math.min(field.height-1,y)),ix=Math.floor(px),iy=Math.floor(py),tx=px-ix,ty=py-iy;
  const at=(xx,yy)=>field.values[Math.max(0,Math.min(field.height-1,yy))*field.width+Math.max(0,Math.min(field.width-1,xx))];
  const cubic=(a,b,c,d,t)=>b+.5*t*(c-a+t*(2*a-5*b+4*c-d+t*(3*(b-c)+d-a)));
  const rows=[];for(let j=-1;j<=2;j++)rows.push(cubic(at(ix-1,iy+j),at(ix,iy+j),at(ix+1,iy+j),at(ix+2,iy+j),tx));
  return Math.max(0,cubic(...rows,ty));
}
// Studio binding
(() => {
  let field=null,parameters=null,amplitude=0;
  const label=document.createElement('p');label.id='smoothBowlGenerator';label.className='note';label.setAttribute('role','status');label.textContent='Bowl generator: smooth-field v1. Rebuild a separate test cloud to apply.';
  document.getElementById('dome').closest('section').querySelector('h2').after(label);
  const prepareBeforeSmooth=prepareSurfaceFields;
  prepareSurfaceFields=function(){
    field=null;prepareBeforeSmooth();
    parameters=Object.fromEntries(formKeys.map(key=>[key,Number($(key).value)/100]));
    amplitude=Number($('depth').value)/100*(parameters.dome/.4);
    if(!Number.isFinite(amplitude)||amplitude<0)throw Error('Invalid bowl amplitude');
    const img=sides[0].img,ba=bounds(sides[0]),length=endpointDistance();
    const spanX=(ba.maxx-ba.minx)*img.width/length,spanY=(ba.maxy-ba.miny)*img.height/length;
    const width=Math.max(17,Math.round(61*spanX/Math.max(spanX,spanY)))+4,height=Math.max(17,Math.round(61*spanY/Math.max(spanX,spanY)))+4;
    const stepX=(ba.maxx-ba.minx)/(width-5),stepY=(ba.maxy-ba.miny)/(height-5),minX=ba.minx-2*stepX,minY=ba.miny-2*stepY;
    const mask=new Uint8Array(width*height),source=new Float64Array(mask.length);
    const bx=ends[0][0]*img.width,by=ends[0][1]*img.height,ux=(ends[1][0]*img.width-bx)/length,uy=(ends[1][1]*img.height-by)/length;
    const peak=.5+.8*parameters.deeppos,sigma=.15+.55*parameters.crossround;
    for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
      const xx=minX+x*stepX,yy=minY+y*stepY,i=y*width+x;
      if(!contains(sides[0],xx,yy))continue;mask[i]=1;
      const px=(xx*img.width-bx)/length,py=(yy*img.height-by)/length,u=px*ux+py*uy,v=-px*uy+py*ux;
      const longitudinal=Math.exp(-.5*((u-peak)/.45)**2),transverse=Math.exp(-.5*(v/sigma)**2),lean=Math.max(.25,1+parameters.tiplean*(2*u-1));
      source[i]=(.2+.8*longitudinal*transverse)*lean;
    }
    field=solveSmoothBowl(mask,width,height,source,stepX*img.width/length,stepY*img.height/length);
    Object.assign(field,{minX,minY,stepX,stepY});
    label.textContent=`Bowl generator: smooth-field v1 / ${width} × ${height} grid / ${field.iterations} solver iterations. Final edge blending remains enabled.`;
  };
  // Replace the complete estimated-height path, bypassing distance-power modifiers.
  profileSurfaceHeight=function(x,y,fallback,thickness){
    if(!field||!parameters)throw Error('Smooth bowl field was not prepared');
    const q=sampleSmoothBowl(field,(x-field.minX)/field.stepX,(y-field.minY)/field.stepY),rounding=parameters.rimround-.35;
    const shape=q*(1+rounding*(1-q));
    const rim=profileConstraints?profileRimHeight(x,y):0,estimated=rim-amplitude*shape;
    if(!profileConstraints)return estimated;
    const reviewed=reviewedSurfaceHeight(x,y,estimated,thickness);
    return estimated*(1-parameters.profile)+reviewed*parameters.profile;
  };
  const settingsBeforeSmooth=$('settings').onclick;
  $('settings').onclick=()=>{
    const downloadBeforeSmooth=download;
    download=function(blob,name){
      if(name!=='shell-field-settings.json')return downloadBeforeSmooth(blob,name);
      blob.text().then(text=>{const data=JSON.parse(text);data.shellForm={version:3,fallback:'smooth-poisson-field-v1',parameters:readStudioForm(),grid:field?{width:field.width,height:field.height,iterations:field.iterations,residual:field.residual}:null};downloadBeforeSmooth(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),name)}).catch(error=>say('Settings export failed: '+error.message));
    };
    try{settingsBeforeSmooth()}finally{download=downloadBeforeSmooth}
  };
})();
