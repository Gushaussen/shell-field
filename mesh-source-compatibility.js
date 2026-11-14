function meshTranslatorSelectPairedSource(){
  const data=raw,model=cloud;
  if(!data||!model||dirty||!data.length)throw Error('Build or open an up-to-date Studio cloud first.');
  if(data.length%3)throw Error('Source point coordinates are incomplete.');
  if(!Number.isFinite(model.scale.x)||model.scale.x<=0)throw Error('Invalid physical scale.');
  const epsilon=1e-6,totalPoints=data.length/3,totalPairs=Math.floor(totalPoints/2);
  let leadingPairs=0,tailStarted=false,matchingAfterTail=0;
  for(let pair=0;pair<totalPairs;pair++){
    const i=pair*6;
    for(let j=0;j<6;j++)if(!Number.isFinite(data[i+j]))throw Error('Source contains non-finite coordinates; partial transfer is not allowed.');
    const matching=Math.abs(data[i]-data[i+3])<=epsilon&&Math.abs(data[i+2]-data[i+5])<=epsilon;
    if(!tailStarted&&matching){
      if(data[i+1]<data[i+4])throw Error('A paired surface has reversed height order. This compatibility option does not reorder surfaces.');
      leadingPairs++;
    }else{
      tailStarted=true;
      if(matching)matchingAfterTail++;
    }
  }
  for(let i=totalPairs*6;i<data.length;i++)if(!Number.isFinite(data[i]))throw Error('Source contains non-finite trailing coordinates.');
  const usedPoints=leadingPairs*2,excluded=totalPoints-usedPoints;
  if(!excluded)return{points:data,excluded:0};
  if(leadingPairs<100||excluded/totalPoints>.01||matchingAfterTail>0)throw Error('No supported small unpaired suffix was found. Transfer refused; inspect the pairing diagnostic.');
  const message=usedPoints.toLocaleString()+' paired surface points are available. '+excluded.toLocaleString()+' trailing points are incompatible with this meshing method.\n\nUse paired surfaces only?\n\nThe trailing points will be excluded only from the translator copy. Their purpose has not been established; inspect the resulting brim. Studio and the saved specimen will not be changed.';
  if(!window.confirm(message))throw Error('Transfer cancelled. No points were changed.');
  if(raw!==data||cloud!==model||dirty)throw Error('Studio changed during confirmation. Transfer cancelled.');
  return{points:data.subarray(0,leadingPairs*6),excluded};
}
