import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {T,v,group,mesh,rod,egg} from './shapes.js';
import {makeFighter,removeFighter,pose} from './models/fighter.js';
import {createMoveFX} from './move-fx.js';
import {moveById} from './gen1-data.js';
import {lookup} from './roster.js';
import {stadium} from './stadium.js';
import {PixelPost} from './lib/post.js';
import {aimYaw,sendOut,smoothstep as sm} from './lib/creature.js';
const pulse=(a,b,c,d,t)=>sm(a,b,t)*(1-sm(c,d,t));
const sin=Math.sin,pi=Math.PI;
export async function buildScene(canvas){
 const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'high-performance'});
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),cam=new T.OrthographicCamera(-10,10,8,-8,.1,120),controls=new OrbitControls(cam,canvas);
 controls.enablePan=false;controls.minPolarAngle=.20;controls.maxPolarAngle=pi*.48;controls.minZoom=.7;controls.maxZoom=2.6;controls.enableDamping=false;
 const hemi=new T.HemisphereLight(0xfff5e1,0xebddc9,2.2);scene.add(hemi);let sun=new T.DirectionalLight(0xffedcf,2.2);sun.position.set(-6,12,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-13,right:13,top:13,bottom:-13});sun.shadow.normalBias=.025;sun.shadow.bias=-.00025;scene.add(sun);
 const post=new PixelPost(renderer,1300,.90),{p}=await stadium(scene);let P,C;const shadows=[0,1].map(()=>{const m=egg(p,'#78997b',0,.092,0,1,.004,1);m.castShadow=false;return m});
 function setPair(a,b){if(P?.mon.id!==a){if(P)removeFighter(P);P=makeFighter(p,lookup(a))}if(C?.mon.id!==b){if(C)removeFighter(C);C=makeFighter(p,lookup(b))}}
 setPair(25,6);
 const floor=.10,homeP=v(-3.1,floor,1.0),homeC=v(2.65,floor,.30),hand=v(5.16,.99,-1.49);
 const bx=group(p);let bot=mesh(bx,new T.SphereGeometry(.20,16,10,0,2*pi,pi/2,pi/2),'#f9f0d8'),lid=mesh(bx,new T.SphereGeometry(.20,16,10,0,2*pi,0,pi/2),'#dd413e');rod(bx,'#222b30',[0,-.017,0],[0,.017,0],.202);egg(bx,'#243138',0,0,.20,.064,.064,.022);egg(bx,'#fff6da',0,0,.222,.035,.035,.016);
 const moves=createMoveFX(scene),fx=group(p),parts=[];
 for(let i=0;i<18;i++){const part=egg(fx,i%2?'#fff6a9':'#ffc35c',0,0,0,1,1,1);part.castShadow=false;parts.push(part);}
 const beam=mesh(fx,new T.CylinderGeometry(1,1,1,12),'#e6464e');
 function link(o,a,b,r){const d=b.clone().sub(a);o.position.copy(a).add(b).multiplyScalar(.5);o.scale.set(r,d.length(),r);o.quaternion.setFromUnitVectors(v(0,1,0),d.normalize());o.visible=true}
 function reset(){controls.target.set(0,1.55,0);cam.position.copy(controls.target).add(v(5.8,9.4,16));cam.zoom=1;cam.updateProjectionMatrix();controls.update()}
 function size(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;let a=w/h;let hh=Math.max(12.5,18.8/a);cam.left=-hh*a/2;cam.right=-cam.left;cam.top=hh/2;cam.bottom=-cam.top;cam.updateProjectionMatrix();post.setSize(w,h)}
 reset();size();new ResizeObserver(size).observe(canvas);
 function sparks(center,radius,n=18){for(let i=0;i<n;i++){let a=i*2.39996,el=(i%7)/7*.95-.25;let o=parts[i];o.visible=true;o.position.copy(center).add(v(Math.cos(a)*radius,el*radius,sin(a)*radius));let s=.04+(.14*(1-i/n));o.scale.set(s*1.5,s,s)}}
 function draw(t,action='idle',u=0,hp={playerHP:100,rivalHP:100}){
 for(const o of fx.children)o.visible=false;
 const foe=action==='flame'||action==='blast',player=['quick','tail','bolt','guard'].includes(action);
 const actor=foe?C:P,target=foe?P:C,move=typeof hp.move==='number'?moveById(hp.move):hp.move;
 P.root.position.copy(homeP);C.root.position.copy(homeC);P.root.rotation.set(0,aimYaw(homeP,homeC,.35,.31),0);C.root.rotation.set(0,aimYaw(homeC,homeP,.35,.42),0);
 for(const f of [P,C]){
  f.root.visible=true;f.root.scale.setScalar(1);f.body.position.set(0,0,0);f.body.rotation.set(0,0,0);f.body.scale.setScalar(1);
 }
 const resting=(actor,dead)=>pose(actor,{t:dead?0:t,u:0,wind:0,strike:0,recoil:0,kind:'idle'});
 if((foe||player)&&move?.id){
  moves.perform({actor,target,move,t,u,from:foe?homeC:homeP,to:foe?homeP:homeC,
   hit:hp.hit!==false,meta:hp.meta||{},reduced:matchMedia('(prefers-reduced-motion: reduce)').matches});
 }else{moves.clear();resting(P,hp.playerHP<=0);resting(C,hp.rivalHP<=0);}
 bx.position.copy(hand);bx.rotation.set(0,0,0);lid.position.set(0,0,0);lid.rotation.set(0,0,0);
 if(action==='send'){const s=sendOut(u,{release:.13,land:.42,open:.47,retStart:.63,retEnd:.92},hand,homeC,1.6);if(!s.held)bx.position.copy(s.pos);bx.rotation.z=s.roll||0;lid.position.y=s.open*.18;lid.rotation.x=-s.open*.8;C.root.visible=u>=.47;C.root.position.y+=.80*pulse(.47,.55,.57,.72,u);if(u>=.47&&u<.67)sparks(homeC.clone().add(v(0,.57,0)),.2+((u-.47)/.2)*1.7)}
 if(action==='switch-player'||action==='switch-rival'){
  const f=action==='switch-player'?P:C,base=f.root.position.clone();
  const k=u<.5?1-sm(.08,.47,u):sm(.5,.87,u);
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
   f.root.scale.setScalar(Math.max(.001,k));f.root.visible=k>.005;
   if(u>.25&&u<.82)sparks(base.add(v(0,.35,0)),.2+.6*pulse(.25,.48,.57,.82,u));
  }
 }
 const czFaint=hp.rivalHP<=0&&(action==='idle'||action==='recall'||u>.55),pkFaint=hp.playerHP<=0&&(action==='idle'||u>.55);
 if(czFaint){let q=action==='idle'||action==='recall'?1:sm(.55,.97,u);C.body.rotation.z=-.65*q;C.body.position.y-=C.height*.06*q}
 if(pkFaint){P.body.rotation.z=1.15;P.body.position.y=-P.height*.06}
 if(action==='recall'){let k=1-sm(.18,.64,u);C.root.scale.setScalar(Math.max(.001,k));C.root.visible=k>.008;if(u>.12&&u<.73)link(beam,hand,homeC.clone().add(v(0,k+.12,0)),.078*pulse(.12,.24,.56,.73,u))}
 for(const [i,f] of [P,C].entries()){const shade=shadows[i];shade.position.set(f.root.position.x,.092,f.root.position.z);shade.rotation.y=f.root.rotation.y;shade.visible=f.root.visible;shade.scale.set(f.size.x*.38*f.root.scale.x,.004,f.size.z*.40*f.root.scale.z)}
 post.render(scene,cam);
 }
 function focus(){const h=Math.max(P.height,C.height);controls.target.set((homeP.x+homeC.x)/2,.12+h*.48,.62);cam.position.copy(controls.target).add(v(3,6.8,15));const gap=homeP.distanceTo(homeC)+(P.size.z+C.size.z)*.6+1.0;cam.zoom=Math.max(1,Math.min(controls.maxZoom,(cam.right-cam.left)/gap,(cam.top-cam.bottom)/(h+1.0)));cam.updateProjectionMatrix();controls.update()}
 return {draw,reset,focus,setPair,controls,THREE:T,renderer,post,scene,camera:cam};
}
