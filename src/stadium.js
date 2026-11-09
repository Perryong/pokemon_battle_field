import {T,v,group,mesh,box,rod,egg,trainer} from './shapes.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const standURL=new URL('../assets/grandstand.glb',import.meta.url),lightURL=new URL('../assets/floodlight.glb',import.meta.url);
function disc(p,c,x,y,z,r,h,n=64){return mesh(p,new T.CylinderGeometry(r,r,h,n),c,x,y,z)}
function ring(p,c,x,y,z,inr,outr){const m=mesh(p,new T.RingGeometry(inr,outr,64),c,x,y,z);m.rotation.x=-Math.PI/2;return m}
function sign(p,txt,x,y,z,w,h,bg,fg){
 let c=document.createElement('canvas');c.width=768;c.height=128;let ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,768,128);ctx.font='bold 70px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=fg;ctx.fillText(txt,384,67);
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}));p.add(m);m.position.set(x,y,z);
}
export async function stadium(scene){
 let p=group(scene);p.name='Indigo Plateau';box(p,'#284742',0,-.30,0,15.6,.44,10.4);box(p,'#8daf75',0,-.056,0,15.5,.12,10.3);
 box(p,'#477b71',0,.025,.72,13.3,.044,6.9);box(p,'#a1c5aa',0,.053,.72,12.96,.04,6.56);
 for(let s of [-1,1]){box(p,'#f5efd5',s*6.18,.087,.72,.055,.018,6);box(p,'#f5efd5',0,.087,.72+s*3,12.4,.019,.055);for(let i=0;i<8;i++)box(p,i%2?'#f0d49b':'#577c71',s*7.22,.02,-1.15+i*.76,.69,.045,.62)}
 box(p,'#f5efd5',0,.09,.72,.055,.02,6);
 disc(p,'#efe6c7',0,.095,.72,1.63,.02);disc(p,'#90b8a0',0,.11,.72,1.53,.02);ring(p,'#eee7c9',0,.13,.72,.43,.50);box(p,'#eee7c9',0,.125,.72,3.02,.014,.095);
 for(let s of [-1,1]){ring(p,'#eff1d7',s*3.1,.089,.72,1.3,1.37)}
 for(let i=0;i<8;i++){const x=-6.2+i*1.78;box(p,'#2c454b',x,-.28,5.21,1.73,.27,.035);for(let a of [-.73,.73])egg(p,'#d8c6a6',x+a,-.27,5.24,.035,.035,.02)}
 sign(p,'I N D I G O   /   0 1',0,-.245,5.25,3.6,.30,'#29474b','#fff0bc');
 const load=new GLTFLoader();const [stands,lights]=await Promise.all([load.loadAsync(standURL.href),load.loadAsync(lightURL.href)]);
 function place(gltf,name,x,z,size,axis,rot=0){const g=gltf.scene.clone(true);g.rotation.y=rot;g.updateMatrixWorld(true);let b=new T.Box3().setFromObject(g),ext=b.getSize(v());g.scale.setScalar(size/ext[axis]);g.updateMatrixWorld(true);b.setFromObject(g);const c=b.getCenter(v());g.position.set(x-c.x,-b.min.y,z-c.z);g.name=name;p.add(g);g.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true}});return g}
 // The kit's grandstand is one narrow column of tiered seats, facing +Z.
 // Tile it across the back line. Instance the columns to share geometry and draws.
 const rows=group(p);rows.name='Polyfork • grandstands';stands.scene.updateMatrixWorld(true);
 stands.scene.traverse(o=>{if(!o.isMesh)return;const batch=new T.InstancedMesh(o.geometry,o.material,18);batch.castShadow=batch.receiveShadow=true;
 for(let i=0;i<18;i++){let m=new T.Matrix4().makeScale(.66,.37,.34);m.setPosition((i-8.5)*.68+(i<9?-.12:.12),.006,-3.62);batch.setMatrixAt(i,m.multiply(o.matrixWorld))}rows.add(batch)});
 for(let i=0;i<18;i++){if(i%4===0)continue;const x=(i-8.5)*.68+(i<9?-.12:.12), z=-4.26+(i%3)*.33, y=1.43-(i%3)*.23;
 let c=['#557389','#cf613d','#f3bd45','#3f8874'][i%4];egg(p,c,x,y,z,.15,.21,.13);egg(p,i%2?'#cd9066':'#ecc69b',x,y+.27,z,.115,.13,.11);egg(p,'#504842',x,y+.35,z-.025,.12,.07,.11)}
 for(let s of [-1,1]){place(lights,'Polyfork • floodlight '+s,s*6.86,-3.8,4.8,'y',s*.33);
 let pole=s*6.85;rod(p,'#eef0d5',[pole,0,3.65],[pole,1.69,3.65],.048);let flag=box(p,s<0?'#f2b82b':'#d5583c',pole-s*.28,1.43,3.65,.57,.37,.035);
 }
 const left=trainer(p,-5.25,2.63,false),right=trainer(p,5.56,-1.51,true);left.rotation.y=1.6;right.rotation.y=-1.16;
 return {p,left,right};
}
