// Bind once while the model is in its original coordinate frame. No geometry
// copies: even a many-piece wing rotates as a single rigid joint.
import {Group,Box3,Vector3} from 'three';
export function bindRig(art){
 const records=[],claimed=new Set(),names=new Set(),rests=new WeakMap();let innerWhole;
 art.updateWorldMatrix(true,true);
 art.traverse(mesh=>{if(mesh.isMesh){
  const box=new Box3().setFromObject(mesh,true),{x,y,z}=art.worldToLocal(box.getCenter(new Vector3()));
  records.push({mesh,i:records.length,x,y,z,color:'#'+mesh.material.color.getHexString(),tag:mesh.userData.motionTag??''});
 }});
 function joint(name,pivot,objects,whole=false){
  if(!objects.length)throw Error('Empty animation joint: '+name);
  if(names.has(name))throw Error('Duplicate animation joint: '+name);names.add(name);
  const node=new Group();node.name=name;node.position.fromArray(pivot);art.add(node);
  for(const object of objects){node.attach(object);rests.get(object)?.copy(object.position)}
  if(!whole&&innerWhole)innerWhole.attach(node);
  if(whole&&!innerWhole)innerWhole=node;
  const rest=node.position.clone();rests.set(node,rest);
  return (rx=0,ry=0,rz=0,dx=0,dy=0,dz=0,sx=1,sy=1,sz=1)=>{
   node.rotation.set(rx,ry,rz);node.position.set(rest.x+dx,rest.y+dy,rest.z+dz);node.scale.set(sx,sy,sz);
  };
 }
 return {
  part(name,pivot,test){const list=records.filter(r=>!claimed.has(r)&&test(r));list.forEach(r=>claimed.add(r));return joint(name,pivot,list.map(r=>r.mesh))},
  whole(name,pivot){return joint(name,pivot,[...art.children],true)},
  anchor(point){let best=null,dist=Infinity;for(const r of records){const d=(r.x-point.x)**2+(r.y-point.y)**2+(r.z-point.z)**2;if(d<dist){dist=d;best=r}}
   const o=new Group();o.name='Emission point';art.add(o);o.position.copy(point);best?.mesh.parent.attach(o);return o}
 };
}
