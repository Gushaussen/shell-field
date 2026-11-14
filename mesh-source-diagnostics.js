(() => {
  const button=document.getElementById('mtSource');
  const status=document.getElementById('mtStatus');
  if(!button||!status)return;
  const section=button.closest('section');
  const report=document.createElement('pre');
  report.id='mtPairDiagnostic';
  report.tabIndex=0;
  report.setAttribute('aria-label','Source cloud pairing diagnostic');
  report.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:10px/1.6 monospace;max-width:100%;margin:12px 0;user-select:text';
  section.append(status,report);
  const original=button.onclick;
  let running=false;
  const pause=()=>new Promise(resolve=>setTimeout(resolve,0));
  const number=value=>Number.isFinite(value)?Number(value.toPrecision(7)).toString():String(value);
  button.onclick=async function(event){
    if(running)return;
    running=true;button.disabled=true;report.textContent='Inspecting source point layout…';
    try{
      const data=raw,model=cloud;
      if(!data||!model||!data.length){report.textContent='No current Studio point array. Open the specimen with OPEN IN WORKSPACE.';if(original)original.call(button,event);return}
      const scale=model.scale.x,epsilon=1e-6,pairs=Math.floor(data.length/6);
      let matched=0,mismatched=0,nonfinite=0,upper=0,lower=0,equal=0,firstMismatch=null,firstReversed=null,firstInvalid=null,maxDelta=0,prefix=0,prefixEnded=false;
      for(let pair=0;pair<pairs;pair++){
        if(pair%20000===0){await pause();if(raw!==data||cloud!==model)throw Error('Studio cloud changed during inspection. Press the source button again.')}
        const i=pair*6;
        let finite=true;for(let j=0;j<6;j++)if(!Number.isFinite(data[i+j]))finite=false;
        let invalid=false;
        if(!finite){nonfinite++;invalid=true}else{
          const dx=Math.abs(data[i]-data[i+3]),dz=Math.abs(data[i+2]-data[i+5]);
          maxDelta=Math.max(maxDelta,dx,dz);
          if(dx>epsilon||dz>epsilon){mismatched++;invalid=true;if(!firstMismatch)firstMismatch={pair,i,dx,dz}}else{matched++;const dy=data[i+1]-data[i+4];if(dy>0)upper++;else if(dy<0)lower++;else equal++}
          if(data[i+1]<data[i+4]){invalid=true;if(!firstReversed)firstReversed={pair,i,dy:data[i+1]-data[i+4]}}
        }
        if(invalid&&!firstInvalid)firstInvalid={pair,i};
        if(invalid)prefixEnded=true;else if(!prefixEnded)prefix++;
      }
      if(raw!==data||cloud!==model)throw Error('Studio cloud changed during inspection. Press the source button again.');
      const lines=['SOURCE PAIR DIAGNOSTIC','Points: '+(data.length/3).toLocaleString(),'Adjacent pairs checked: '+pairs.toLocaleString(),'Unpaired trailing coordinates: '+data.length%6,'Scale: '+number(scale)+' mm per stored unit','Studio marked out of date: '+(dirty?'yes':'no'),'Matching X/Z pairs: '+matched.toLocaleString(),'Mismatched X/Z pairs: '+mismatched.toLocaleString(),'Non-finite pairs: '+nonfinite.toLocaleString(),'Among matching X/Z pairs:','  First point higher: '+upper.toLocaleString(),'  First point lower: '+lower.toLocaleString(),'  Equal heights: '+equal.toLocaleString(),'Leading pairs passing current check: '+prefix.toLocaleString(),'Largest X/Z difference: '+number(maxDelta)+' stored units'];
      if(Number.isFinite(scale))lines.push('Largest X/Z difference at current scale: '+number(maxDelta*scale)+' mm');
      function details(title,item){if(!item)return;const i=item.i;lines.push(title+': pair '+(item.pair+1)+' (points '+(item.pair*2+1)+' and '+(item.pair*2+2)+', 1-based)','  A: '+[data[i],data[i+1],data[i+2]].map(number).join(', '),'  B: '+[data[i+3],data[i+4],data[i+5]].map(number).join(', '))}
      details('First failing pair',firstInvalid);
      details('First X/Z mismatch',firstMismatch);
      details('First reversed height pair',firstReversed);
      lines.push('Read-only check. No points reordered, removed or saved.','Copy this report to diagnose compatibility.');
      report.textContent=lines.join('\n');
      if(original)original.call(button,event);
    }catch(error){report.textContent='Diagnostic failed: '+error.message;status.textContent=error.message}
    finally{running=false;button.disabled=false}
  };
})();
