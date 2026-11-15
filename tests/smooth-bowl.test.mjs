import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../smooth-bowl.js',import.meta.url),'utf8').split('// Studio binding')[0];
const {solveSmoothBowl,sampleSmoothBowl}=vm.runInNewContext(source+';({solveSmoothBowl,sampleSmoothBowl})');
for(const shape of ['square','circle','notched'])test('smooth field: '+shape,()=>{
  const n=65,mask=new Uint8Array(n*n),forcing=new Float64Array(n*n).fill(1),dx=1/(n-1);
  for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){const xx=(x-32)/30,yy=(y-32)/30;mask[y*n+x]=shape==='square'?1:shape==='circle'?(xx*xx+yy*yy<1?1:0):(xx*xx+yy*yy<1&&!(x>39&&y<27)?1:0)}
  const field=solveSmoothBowl(mask,n,n,forcing,dx,dx);
  assert.ok(field.residual<.01);
  for(let i=0;i<mask.length;i++){assert.ok(Number.isFinite(field.values[i]));assert.ok(field.values[i]>=-1e-9&&field.values[i]<=1+1e-9);if(!mask[i])assert.equal(field.values[i],0)}
  if(shape!=='notched'){
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)assert.ok(Math.abs(field.values[y*n+x]-field.values[y*n+n-1-x])<1e-4);
    const h=.001,slope=(sampleSmoothBowl(field,32+h,32)-sampleSmoothBowl(field,32-h,32))/(2*h);
    assert.ok(Math.abs(slope)<1e-5);
  }
});
