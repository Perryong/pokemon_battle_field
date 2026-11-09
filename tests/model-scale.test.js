import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Vector3,Group} from 'three';
import {roster} from '../src/roster.js';
import {makeFighter} from '../src/models/fighter.js';
test('all 151 neutral miniatures have solid depth, grounded feet, and the listed size',()=>{
 const signatures=new Set();
 for(const mon of roster){const f=makeFighter(new Group(),mon),box=new Box3().setFromObject(f.root,true),ext=box.getSize(new Vector3());
  assert.ok(ext.x>.01 && ext.z>.01 && ext.y>.01,mon.name+' needs a solid');
  assert.ok(Math.abs(box.min.y)<.00001,mon.name+' is not grounded');
  const measure=f.path?f.path.slice(1).reduce((sum,p,i)=>sum+p.distanceTo(f.path[i]),0):ext.y;
  assert.ok(Math.abs(measure-mon.metres)<.00001,mon.name+' has the wrong scale');
  let shape=[];f.root.traverse(o=>{if(o.isMesh)shape.push([o.geometry.type,...o.position.toArray(),...o.scale.toArray(),o.material.color?.getHexString()])});
  assert.ok(shape.length>=2,mon.name+' lacks distinguishing geometry');const key=JSON.stringify(shape);assert.ok(!signatures.has(key),'Duplicated model: '+mon.name);signatures.add(key);
  if([95,130,147,148].includes(mon.id))assert.ok(f.path && ext.y<mon.metres,mon.name+' must be measured along its body');
 }
});

import {trainer} from '../src/shapes.js';
test('the comparison trainer provides a real 1.7-metre reference',()=>{
 const person=trainer(new Group(),0,0,false);
 const b=new Box3().setFromObject(person,true);
 assert.ok(Math.abs(b.min.y)<1e-6 && Math.abs(b.max.y-1.7)<1e-6);
});
