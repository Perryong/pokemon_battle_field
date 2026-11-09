import {T,group,v} from '../shapes.js';
import {pikachu,charizard} from '../actors.js';
import {early} from './early.js';
import {middle} from './middle.js';
import {late} from './late.js';
import {makeKit} from './kit.js';
import {bindRig} from './rig.js';
import {earlyMotion} from './early-motion.js';
import {middleMotion} from './middle-motion.js';
import {lateMotion} from './late-motion.js';
import {nativeMotion} from './native-motion.js';

const lengthOf=path=>path.slice(1).reduce((sum,p,i)=>sum+p.distanceTo(path[i]),0);
export function makeFighter(parent,mon){
 // Measure in a detached neutral frame: the pitch, camera and previous fighter cannot affect the result.
 const root=new T.Group(),motion=group(root),unit=group(motion),art=group(unit);
 const kit=makeKit(art);let native;
 if(mon.id===25)native=pikachu(art);
 else if(mon.id===6)native=charizard(art);
 else (mon.id<=50?early:mon.id<=101?middle:late)(mon.id,kit);
 art.updateMatrixWorld(true);
 const raw=new T.Box3().setFromObject(art,true),center=raw.getCenter(v());
 const path=kit.lengthPath?.map(p=>v(...p)),span=path?lengthOf(path):raw.max.y-raw.min.y;
 if(!Number.isFinite(span)||span<=0)throw Error('Invalid body dimensions for '+mon.name);
 const rig=native?null:bindRig(art);
 const animate=native?nativeMotion(mon.id,native):(mon.id<=50?earlyMotion:mon.id<=101?middleMotion:lateMotion)(mon.id,rig);
 const source=native?.source||rig.anchor(v(center.x,raw.min.y+.63*(raw.max.y-raw.min.y),raw.max.z));
 // Blastoise's muzzle caps are part of the animated cannon joints.
 const cannons=mon.id===9?[-1,1].map(side=>rig.anchor(v(side*.644,2.114,.082))):null;
 const scale=mon.metres/span,offset=v(-center.x,-raw.min.y,-center.z);
 art.position.copy(offset);unit.scale.setScalar(scale);
 const box=new T.Box3().setFromObject(root,true),size=box.getSize(v());
 parent.add(root);root.name=mon.name;root.userData.dex=mon.id;
 return {mon,root,body:motion,native,animate,source,cannons,height:size.y,size,path:path?.map(p=>p.clone().add(offset).multiplyScalar(scale)),measure:path?'length':'height'};
}
export function removeFighter(f){
 f.root.removeFromParent();f.root.traverse(o=>{if(o.geometry&&!o.geometry.userData?.shared)o.geometry.dispose()});
}
export function pose(f,sample){f.animate(sample)}
