import * as T from 'three';
export {T};
const mats=new Map(), geo=new Map();
export const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
export function group(p,x=0,y=0,z=0){const o=new T.Group();p.add(o);o.position.set(x,y,z);return o}
export function mesh(p,g,c,x=0,y=0,z=0){if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.9,flatShading:true,side:T.DoubleSide}));let o=new T.Mesh(g,mats.get(c));o.position.set(x,y,z);p.add(o);o.castShadow=o.receiveShadow=true;return o}
function cached(k,fn){if(!geo.has(k)){const g=fn();g.userData.shared=true;geo.set(k,g)}return geo.get(k)}
export function egg(p,c,x,y,z,a,b,d){let o=mesh(p,cached('orb',()=>new T.SphereGeometry(1,12,9)),c,x,y,z);o.scale.set(a,b,d);return o}
export function box(p,c,x,y,z,a,b,d){let o=mesh(p,cached('box',()=>new T.BoxGeometry()),c,x,y,z);o.scale.set(a,b,d);return o}
export function rod(p,c,a,b,r,s=r,n=9){let A=v(...a),B=v(...b),dir=B.clone().sub(A),g=cached([r,s,n].join(':'),()=>new T.CylinderGeometry(s,r,1,n));let o=mesh(p,g,c,...A.add(B).multiplyScalar(.5).toArray());o.scale.y=dir.length();o.quaternion.setFromUnitVectors(v(0,1,0),dir.normalize());return o}
export function poly(p,c,coords,thick=.08){let s=new T.Shape();coords.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return mesh(p,new T.ExtrudeGeometry(s,{depth:thick,bevelEnabled:false}),c)}
export function patch(p,x,z,rx,rz){let o=egg(p,'#50766c',x,.022,z,rx,.014,rz);o.castShadow=false;return o}
export const ink='#242935',gold='#ffc519',orange='#ec792e',cream='#ffe5a1',teal='#267683';
export function trainer(p,x,z,red){const o=group(p,x,0,z),j=group(o,0,0,0),shirt=red?'#bc4045':'#2b638f';for(const s of [-1,1]){rod(j,ink,[s*.15,.2,0],[s*.14,.79,0],.11);egg(j,'#f4e8ce',s*.15,.13,.06,.145,.13,.21)}
 egg(j,shirt,0,1,0,.37,.41,.23);egg(j,'#de9f70',0,1.57,0,.24,.26,.23);egg(j,ink,0,1.72,-.04,.25,.17,.24);egg(j,red?'#b82639':'#f2f1d7',0,1.79,0,.26,.13,.25);box(j,shirt,0,1.75,.17,.44,.05,.28);
 for(const s of [-1,1]){egg(j,ink,s*.10,1.59,.205,.032,.042,.028);rod(j,shirt,[s*.24,1.22,0],[s*.39,.99,0],.11);rod(j,'#dfa67c',[s*.39,.99,0],[s*.39,.84,.20],.085)}
 const bounds=new T.Box3().setFromObject(j,true);j.scale.setScalar(1.7/(bounds.max.y-bounds.min.y));j.position.y=-bounds.min.y*j.scale.y;
 return o}
