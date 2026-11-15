import test from 'node:test';
import assert from 'node:assert/strict';
import {createShellForm,longitudinalPosition,normalizeForm} from '../src/shell-form.mjs';
const sample={depth:.4,u:.35,estimatedHeight:.12,rimHeight:0};
test('neutral controls preserve the estimated surface',()=>{
  const height=createShellForm();
  for(const depth of [.001,.1,.4,.8,1])for(const u of [0,.2,.5,.8,1]){
    const actual=height({...sample,depth,u});
    assert.ok(Math.abs(actual-.12)<1e-12);
  }
});
test('the traced boundary stays on the rim',()=>{
  for(const dome of [0,40,100])assert.equal(createShellForm({dome})({...sample,depth:0,rimHeight:.03}),.03);
});
test('each shape control changes an interior sample',()=>{
  const baseline=createShellForm()(sample);
  for(const [key,value] of Object.entries({dome:70,rimround:80,deeppos:35,tiplean:40,crossround:90}))
    assert.notEqual(createShellForm({[key]:value})(sample),baseline,key);
});
test('profile influence blends only an explicitly supplied reviewed height',()=>{
  assert.equal(createShellForm({profile:100})({...sample,profileHeight:-.2}),-.2);
  assert.equal(createShellForm({profile:0})({...sample,profileHeight:-.2}),.12);
  assert.equal(createShellForm({profile:100})(sample),.12);
});
test('control extremes produce finite heights throughout the surface',()=>{
  for(const v of [0,50,100]){
    const height=createShellForm({dome:v,rimround:v,deeppos:v-50,tiplean:v-50,crossround:v,profile:v});
    for(const depth of [0,1e-9,.01,.5,1])for(const u of [0,.1,.5,.9,1])
      assert.ok(Number.isFinite(height({...sample,depth,u})));
  }
});
test('axis projection follows calibrated endpoints rather than image X',()=>{
  assert.equal(longitudinalPosition(0,5,[0,0],[0,10]),.5);
  assert.equal(longitudinalPosition(5,0,[10,0],[0,0]),.5);
  assert.throws(()=>longitudinalPosition(0,0,[0,0],[0,0]));
});
test('invalid input fails explicitly',()=>{
  assert.throws(()=>normalizeForm({dome:NaN}));
  assert.throws(()=>createShellForm()({...sample,depth:Infinity}));
});
