// Runs before the application module initializes; preserves legacy control contracts.
let dep=.18,th=.02;
{
  const get=id=>document.getElementById(id);
  const buildSection=get('build').closest('section');
  const scaleSection=document.createElement('section');
  scaleSection.innerHTML='<h2>02 / LIVE PHYSICAL SCALING</h2>';
  for(const node of [get('measure'),get('length').closest('label'),get('calibration')])scaleSection.append(node);
  buildSection.before(scaleSection);
  const controls=[['depth','BOWL DEPTH / % OF BASE–TIP',0,45,1,18],['thick','WALL THICKNESS / %',.5,10,.5,2],['relief','IMAGE RELIEF / %',0,8,.1,1.8]];
  for(const [id,title,min,max,step,value] of controls){
    if(get(id))continue;
    const label=document.createElement('label');
    label.append(document.createTextNode(title));
    const output=document.createElement('output');output.id=id+'val';output.textContent=value+'%';
    const input=document.createElement('input');Object.assign(input,{id,type:'range',min,max,step,value});
    input.oninput=()=>{output.textContent=input.value+'%';dep=Number(get('depth').value)/100;th=Number(get('thick').value)/100;mark()};
    label.append(output,input);buildSection.insertBefore(label,get('density').closest('label'));
  }
  get('build').addEventListener('click',()=>{dep=Number(get('depth').value)/100;th=Number(get('thick').value)/100},{capture:true});
}
