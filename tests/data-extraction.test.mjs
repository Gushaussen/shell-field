import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const code=fs.readFileSync(new URL('../data-extraction-lab.js',import.meta.url),'utf8').split('// Lab binding')[0];const {labOutlineMetrics,labQuantizedPalette,labWidthProfile}=vm.runInNewContext(code+';({labOutlineMetrics,labQuantizedPalette,labWidthProfile})');
const rect=[[0,0],[1,0],[1,1],[0,1]],hole=[[.25,.25],[.75,.25],[.75,.75],[.25,.75]];
test('pixel rectangle measurements',()=>{const a=labOutlineMetrics([rect],100,50);assert.equal(a.area,5000);assert.equal(a.boundary,300);assert.equal(a.unit,'px')});
test('hole subtraction and physical scaling',()=>{const b=labOutlineMetrics([rect,hole],100,50,.1);assert.ok(Math.abs(b.area-37.5)<1e-9);assert.equal(b.holes,1);assert.equal(b.width,10)});
test('masked palette coverage',()=>{const rgba=new Uint8ClampedArray([255,0,0,255,0,255,0,255,255,0,0,255,0,0,255,255]),p=labQuantizedPalette(rgba,[1,1,1,0]);assert.equal(p.total,3);assert.equal(p.colors[0].coverage,2/3);assert.equal(p.colors[0].hex,'#ff0000');assert.equal(p.colors.reduce((s,c)=>s+c.coverage,0),1)});
test('empty mask',()=>assert.equal(labQuantizedPalette(new Uint8Array(4),[0]).total,0));
test('image vertical profile',()=>{const p=labWidthProfile([rect],100,50);assert.equal(p.length,50);assert.ok(p.every(v=>v.width===100))});
