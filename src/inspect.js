import {T,v,trainer} from './shapes.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {effectiveness,moveById} from './gen1-data.js';
import {lookup} from './roster.js';
import {createMoveFX,presentationDuration} from './move-fx.js';
import {makeFighter,removeFighter,pose} from './models/fighter.js';

function sparringPartner(fighter,move){
 const preferred=fighter.height<.7?35:fighter.height<1.55?54:115;
 const candidates=[...(move.ohko?[79]:[]),preferred,54,35,115,61,143];
 const accepts=(attack,mon)=>attack.target==='self'||attack.ignoreImmunity||
  effectiveness(attack.type,mon.types)>0;
 for(const id of candidates){
  const mon=lookup(id);
  if(id===fighter.mon.id||!accepts(move,mon))continue;
  if(['psn','tox'].includes(move.status)&&mon.types.includes('Poison'))continue;
  const called=move.id===118?129:move.id===119?mon.defaultMoves.find(n=>{
   const m=moveById(n);return m.category!=='Status'&&accepts(m,mon);
  }):null;
  if(move.id===119&&!called)continue;
  if(called&&!accepts(moveById(called),mon))continue;
  return {mon,called};
 }
 throw new Error('No compatible preview target for '+move.name);
}
export function inspector(canvas){
 const gl=new T.WebGLRenderer({canvas,antialias:true,alpha:true});gl.setPixelRatio(Math.min(2,devicePixelRatio));gl.setClearColor(0x000000,0);gl.shadowMap.enabled=true;gl.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,.01,100),orbit=new OrbitControls(camera,canvas);
 orbit.enablePan=false;orbit.minPolarAngle=.07;orbit.maxPolarAngle=Math.PI*.53;orbit.minZoom=.65;orbit.maxZoom=8;
 scene.add(new T.HemisphereLight(0xfff9ed,0xb8c1bc,2.15));const sun=new T.DirectionalLight(0xfff2d2,2);sun.position.set(-3,6,4);scene.add(sun);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.0004;sun.shadow.normalBias=.008;
 const ground=new T.Mesh(new T.PlaneGeometry(24,24),new T.ShadowMaterial({opacity:.18}));ground.rotation.x=-Math.PI/2;ground.position.y=-.006;ground.receiveShadow=true;scene.add(ground);
 const cluster=new T.Group();scene.add(cluster);const person=trainer(cluster,0,0,0,false);person.rotation.y=.25;
 const grid=new T.GridHelper(20,40,0x8aa49a,0xc1cfc5);grid.position.y=-.004;scene.add(grid);
 const marker=new T.Mesh(new T.RingGeometry(.91,1,40),new T.MeshBasicMaterial({color:'#cf795e',transparent:true,opacity:.64,side:T.DoubleSide}));
 marker.rotation.x=-Math.PI/2;marker.visible=false;scene.add(marker);
 const effects=createMoveFX(scene),from=v(),to=v();
 const caption=canvas.closest('.studio')?.querySelector('small'),restCaption=caption?.textContent;
 let fighter=null,partner=null,compare=true,frame=0,epoch=0,preview=null,savedView=null,timer=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),paint=()=>gl.render(scene,camera);orbit.addEventListener('change',paint);
 function rest(f,t=0){
  f.root.scale.setScalar(1);f.body.position.set(0,0,0);f.body.rotation.set(0,0,0);f.body.scale.setScalar(1);
  pose(f,{t,u:0,kind:'idle',wind:0,strike:0,recoil:0});
 }
 function layout(){
  if(preview){
   person.visible=false;partner.root.visible=true;
   const gap=(fighter.size.z+partner.size.z)*.52+Math.max(.52,Math.max(fighter.height,partner.height)*.78);
   from.set(-gap*.50,0,.06*gap);to.set(gap*.50,0,-.06*gap);
   fighter.root.position.copy(from);partner.root.position.copy(to);
   fighter.root.rotation.y=1.24;partner.root.rotation.y=-1.16;
   marker.position.copy(to);marker.position.y=.008;marker.scale.setScalar(Math.max(partner.size.x,partner.size.z)*.64);
   marker.visible=true;
  }else{
   person.visible=compare;marker.visible=false;if(partner)partner.root.visible=false;
   fighter.root.rotation.set(0,0,0);fighter.root.position.set(compare?-(.45+fighter.size.x*.08):0,0,0);
   person.position.x=fighter.root.position.x+fighter.size.x*.5+.62;person.position.z=-.06;
  }
 }
 function fit(){
  if(!fighter||!canvas.clientWidth||!canvas.clientHeight)return;
  const w=canvas.clientWidth,h=canvas.clientHeight;gl.setSize(w,h,false);
  layout();
  let bounds;
  if(preview){
   if(!preview.bounds){
    bounds=new T.Box3();
    // Fit the full path, including the strike pose and any substitute or copied body.
    // Sampling in world space keeps the same coverage at portrait aspect ratios.
    for(let i=0;i<=16;i++){
     applyPreview(i/16);bounds.expandByObject(fighter.root);bounds.expandByObject(partner.root);
     for(const o of effects.root.children)if(o.visible)bounds.expandByObject(o);
    }
    const margin=Math.max(fighter.height,partner.height)*.075;bounds.expandByScalar(margin);
    preview.bounds=bounds;
   }else bounds=preview.bounds;
  }else{
   bounds=new T.Box3().setFromObject(fighter.root,true);
   if(compare)bounds.expandByObject(person,true);
  }
  const target=bounds.getCenter(v()),combined=bounds.getSize(v()),a=w/h;
  const direction=preview?v(.26,.37,1.50).normalize():v(.72,.32,1.5).normalize();
  camera.position.copy(target).addScaledVector(direction,Math.max(4,combined.length()*1.7));orbit.target.copy(target);camera.lookAt(target);camera.updateMatrixWorld(true);
  const right=v(1,0,0).applyQuaternion(camera.quaternion),up=v(0,1,0).applyQuaternion(camera.quaternion);
  const span=axis=>Math.abs(axis.x)*combined.x+Math.abs(axis.y)*combined.y+Math.abs(axis.z)*combined.z;
  const half=Math.max(.10,span(up)/2,span(right)/(2*a))*1.14;
  camera.left=-half*a;camera.right=half*a;camera.top=half;camera.bottom=-half;camera.zoom=1;camera.updateProjectionMatrix();orbit.update();
  if(preview)renderPreview(preview.frozen??preview.last??0);else paint();
 }
 function prepare(move){
  if(!fighter||!move)throw new RangeError('Select a Pokémon and a valid move to preview.');
  clearTimeout(timer);
  if(!preview)savedView={p:camera.position.clone(),target:orbit.target.clone(),zoom:camera.zoom,
   planes:[camera.left,camera.right,camera.top,camera.bottom],w:canvas.clientWidth,h:canvas.clientHeight};
  const {mon,called}=sparringPartner(fighter,move);
  if(partner?.mon.id!==mon.id){if(partner)removeFighter(partner);partner=makeFighter(cluster,mon);}
  if(caption){
   const who=move.id===114?'field':move.target==='self'&&!called?'user '+fighter.mon.name:'target '+mon.name;
   caption.textContent=move.name+(called?' → '+moveById(called).name:'')+' · '+who+(move.id===138?' (asleep)':'');
  }
  rest(fighter);rest(partner);effects.clear();
  preview={move,called,start:performance.now(),duration:presentationDuration(move.id),frozen:null};fit();
  preview.start=performance.now();
 }
 function applyPreview(u){
  const {move,duration}=preview;
  effects.perform({actor:fighter,target:partner,move,t:u*duration/1000,u,from,to,
   hit:true,meta:{preview:true,calledMoveId:preview.called},reduced:reduced.matches});
 }
 function renderPreview(u){preview.last=u;applyPreview(u);paint();}
 function cancelPreview(){
  clearTimeout(timer);
  if(!preview)return;
  preview=null;effects.clear();rest(fighter);layout();if(caption)caption.textContent=restCaption;
  if(savedView&&savedView.w===canvas.clientWidth&&savedView.h===canvas.clientHeight){
   camera.position.copy(savedView.p);orbit.target.copy(savedView.target);camera.zoom=savedView.zoom;
   [camera.left,camera.right,camera.top,camera.bottom]=savedView.planes;
   camera.updateProjectionMatrix();orbit.update();paint();
  }else fit();
  savedView=null;
  if(!reduced.matches&&canvas.closest('dialog')?.open)start();
 }
 function tick(now){
  frame=0;if(!fighter||!canvas.closest('dialog')?.open||document.hidden)return;
  if(preview){
   if(preview.frozen!=null)return;
   const u=Math.min(1,Math.max(0,(now-preview.start)/preview.duration));
   if(u>=1)cancelPreview();else renderPreview(u);
  }else{rest(fighter,reduced.matches?0:Math.max(0,(now-epoch)/1000));paint();}
  if(preview||!reduced.matches)start();
 }
 function start(){if(!frame)frame=requestAnimationFrame(tick);}
 function stop(){cancelPreview();cancelAnimationFrame(frame);frame=0;}
 function set(mon,withTrainer=compare){
  if(preview)cancelPreview();
  compare=withTrainer;
  if(fighter?.mon.id!==mon.id){if(fighter)removeFighter(fighter);fighter=makeFighter(cluster,mon);epoch=performance.now();}
  fit();start();return fighter;
 }
 function perform(id){
  prepare(moveById(Number(id)));
  if(reduced.matches){
   preview.frozen=.53;renderPreview(preview.frozen);
   timer=setTimeout(()=>{cancelPreview();start();},1000);
  }else{renderPreview(0);start();}
 }
 function sample(id,u){
  const move=moveById(Number(id));if(!move)throw new RangeError('Unknown preview move '+id);
  if(preview?.move.id!==move.id)prepare(move);
  clearTimeout(timer);preview.frozen=Math.max(0,Math.min(1,u));renderPreview(preview.frozen);
 }
 const resize=new ResizeObserver(fit);resize.observe(canvas);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&canvas.closest('dialog')?.open)start()});
 return {set,fit,perform,sample,cancelPreview,stop,get fighter(){return fighter},orbit,camera,gl};
}
