import {T,egg,box,rod,mesh} from '../shapes.js';
export function makeKit(root){
 const e=(c,x,y,z,rx,ry,rz)=>egg(root,c,x,y,z,rx,ry,rz);
 return {root,e,tag(name,build){
  const start=root.children.length,result=build();
  for(let i=start;i<root.children.length;i++)root.children[i].traverse(o=>{if(o.isMesh)o.userData.motionTag??=name});
  return result;
 },b:(...a)=>box(root,...a),r:(...a)=>rod(root,...a),tri(c,a,b,d){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([...a,...b,...d],3));g.computeVertexNormals();return mesh(root,g,c)
 },eye(x,y,z,s){const m=e('#20242a',x,y,z,s,s*1.13,s*.7);e('#fff9e3',x-s*.2,y+s*.32,z+s*.62,s*.32,s*.32,s*.25);return m}};
}
