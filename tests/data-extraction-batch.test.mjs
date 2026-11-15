import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const code=fs.readFileSync(new URL('../data-extraction-batch.js',import.meta.url),'utf8').split('// Batch binding')[0];const {labBatchCalibration,labBatchJobs,labBatchCsvCell}=vm.runInNewContext(code+';({labBatchCalibration,labBatchJobs,labBatchCsvCell})');
const data={units:'mm',parameters:{length:100},ends:[[0,0],[1,0]]};
test('interior calibration',()=>assert.equal(labBatchCalibration(data,0,1000,500),.1));
test('exterior remains uncalibrated',()=>assert.equal(labBatchCalibration(data,1,1000,500),null));
test('overlapping endpoints rejected',()=>assert.equal(labBatchCalibration({...data,ends:[[0,0],[0,0]]},0,1000,500),null));
test('invalid length rejected',()=>assert.equal(labBatchCalibration({...data,parameters:{length:'bad'}},0,1000,500),null));
test('independent per-side result ledger',()=>{const records=[{id:'a',name:'A'},{id:'b',species:'oyster'}],jobs=labBatchJobs(records,[0,1]);assert.equal(jobs.length,4);jobs[0].status='error';assert.equal(jobs[1].status,'pending');assert.equal(records[0].status,undefined)});
test('CSV quoting and formula neutralization',()=>{assert.equal(labBatchCsvCell('=SUM(A1)'),"\"'=SUM(A1)\"");assert.equal(labBatchCsvCell(-2),'"-2"');assert.equal(labBatchCsvCell('a"b'),'"a""b"')});
