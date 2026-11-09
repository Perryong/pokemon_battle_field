import test from 'node:test';
import assert from 'node:assert/strict';
import {Group,Box3,Vector3} from 'three';
import {makeKit} from '../src/models/kit.js';
import {bindRig} from '../src/models/rig.js';
import {makeFighter,removeFighter,pose} from '../src/models/fighter.js';
import {roster} from '../src/roster.js';
import {motionFrame} from '../src/motion-frame.js';

test('binding preserves neutral geometry and rotates tagged parts together around an authored joint',()=>{
 const art=new Group(),kit=makeKit(art);kit.tag('arm',()=>{kit.e('#cc5555',1,2,0,.3,.5,.2);kit.eye(1,2.4,.1,.1)});kit.b('#555555',0,1,0,1,2,1);
 const before=new Box3().setFromObject(art,true),rig=bindRig(art),arm=rig.part('arm',[1,1.6,0],r=>r.tag==='arm');
 const neutral=new Box3().setFromObject(art,true);assert.ok(neutral.min.distanceTo(before.min)<1e-9&&neutral.max.distanceTo(before.max)<1e-9);
 arm(.5);assert.ok(art.getObjectByName('arm').children.length===3);arm();assert.deepEqual(new Box3().setFromObject(art,true),neutral);
});
test('attack sampling distinguishes the actor from the target on both sides',()=>{
 for(const [slot,side] of [['bolt','player'],['blast','rival']]){
  const attacker=motionFrame(2,slot,.53,side,'special'),target=motionFrame(2,slot,.53,side==='player'?'rival':'player','special');
  assert.ok(attacker.strike>.9);assert.equal(target.strike,0);assert.ok(target.recoil>.8);assert.equal(attacker.recoil,0);
  assert.equal(motionFrame(2,slot,1,side,'heavy').strike,0);
 }
});
const snapshot=f=>{f.root.updateMatrixWorld(true);const rows=[];f.root.traverse(o=>{if(o.isMesh)rows.push([...o.matrixWorld.elements])});return rows};
const delta=(a,b)=>Math.max(...a.map((row,i)=>Math.max(...row.map((n,j)=>Math.abs(n-b[i][j])))));
test('every species moves visible geometry when idle and attacking, and poses can be sampled out of order',()=>{
 for(const mon of roster){
  const f=makeFighter(new Group(),mon);const sample=(t,u,kind)=>{pose(f,motionFrame(t,kind==='idle'?'idle':'bolt',u,'player',kind));return snapshot(f)};
  const a=sample(.19,0,'idle'),b=sample(.88,0,'idle'),c=sample(1.67,0,'idle');
  assert.ok(Math.max(delta(a,b),delta(b,c))>1e-4,mon.name+' has no idle movement');
  for(const kind of ['light','heavy','special']){
   const peak=sample(.88,.52,kind),wind=sample(.88,.19,kind);
   assert.ok(delta(b,peak)>1e-4 && delta(wind,peak)>1e-4,mon.name+' lacks '+kind+' attack');
   assert.ok([...peak,...wind,...c].every(row=>row.every(Number.isFinite)),mon.name+' has nonfinite pose');
   sample(5,.61,'special');assert.ok(delta(peak,sample(.88,.52,kind))<1e-9,mon.name+' pose depends on history');
   assert.ok(delta(b,sample(.88,1,kind))<1e-6,mon.name+' does not recover from '+kind);
  }
  removeFighter(f);
 }
});
test('adding a whole-body pivot does not displace a child joint at rest',()=>{
 const art=new Group(),kit=makeKit(art),hand=kit.e('#ecaa63',1,1,0,.2,.2,.2);kit.e('#cccccc',0,.6,0,.5,.6,.5);
 const rig=bindRig(art),handPose=rig.part('hand',[.8,.9,0],r=>r.i===0),stance=rig.whole('stance',[0,.55,.1]);
 stance();handPose();assert.ok(hand.getWorldPosition(new Vector3()).distanceTo(new Vector3(1,1,0))<1e-9);
});
