import * as T from 'three';
import {smoothstep as sm,clamp} from './lib/creature.js';
import {pose} from './models/fighter.js';
import {moveById} from './gen1-data.js';
import {presentation,selfStyles} from './move-presentation.js';
import {colors,glyph} from './move-glyphs.js';

const PI=Math.PI,TAU=2*PI,sin=Math.sin,cos=Math.cos;
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const up=V(0,1,0),mix=(a,b,t)=>a.clone().lerp(b,t);
const window=(a,b,c,d,t)=>sm(a,b,t)*(1-sm(c,d,t));
const fract=n=>n-Math.floor(n),noise=i=>fract(sin(i*67.138+.453)*43758.52);
const contact=new Set(['blow','slash','clamp','lash','kick','roll','ram','dash','stab','drill','aerial','toss','burrow']);
const multiple=new Set(['blow','slash','kick','stab','dart','lob']);
const passive=new Set(['debuff','gaze','dust','sound','wind','selfcloud','field','mind','coil','seed','shot']);
const chargeMoves=new Set([13,19,76,91,130,143]);
export function presentationDuration(id){
 const p=presentation(id);return p.style==='call'?2750:chargeMoves.has(id)||p.style==='transform'?2180:
  p.n>1&&multiple.has(p.style)?2050:1650;
}
function drawTools(scene){
 const root=new T.Group();root.name='Move artwork';scene.add(root);
 const pools=new Map(),used=new Map();
 const shapes={orb:new T.IcosahedronGeometry(1,1),rod:new T.CylinderGeometry(1,1,1,7),
  ring:new T.TorusGeometry(1,.047,6,40),block:new T.BoxGeometry(1,1,1)};
 function item(kind){
  const pool=pools.get(kind)||[];pools.set(kind,pool);
  const i=used.get(kind)||0;used.set(kind,i+1);
  if(!pool[i]){
   pool[i]=kind==='symbol'?new T.Sprite(new T.SpriteMaterial({transparent:true,depthWrite:false,depthTest:false})):
    new T.Mesh(shapes[kind],new T.MeshBasicMaterial({transparent:true,depthWrite:false}));
   if(kind==='symbol')pool[i].renderOrder=3;root.add(pool[i]);
  }
  const node=pool[i];node.visible=true;node.quaternion.identity();node.material.opacity=1;return node;
 }
 function reset(){for(const [kind,n] of used)for(let i=0;i<n;i++)pools.get(kind)[i].visible=false;used.clear();}
 function symbol(name,pal,p,size,angle=0,alpha=1){
  if(size<=0||alpha<=.005)return;
  const o=item('symbol');o.position.copy(p);o.scale.setScalar(size);o.material.map=glyph(name,pal);
  o.material.rotation=angle;o.material.opacity=alpha;
 }
 function solid(kind,p,scale,color,opacity=1){
  const o=item(kind);o.position.copy(p);o.scale.set(...scale);o.material.color.set(color);o.material.opacity=opacity;return o;
 }
 function link(a,b,r,color,opacity=1){
  const d=V().subVectors(b,a);const o=solid('rod',mix(a,b,.5),[r,d.length(),r],color,opacity);
  if(d.lengthSq()>0)o.quaternion.setFromUnitVectors(up,d.normalize());return o;
 }
 function ring(p,r,color,normal=up,opacity=1){
  const o=solid('ring',p,[r,r,r],color,opacity);o.quaternion.setFromUnitVectors(V(0,0,1),normal);return o;
 }
 return {root,reset,symbol,solid,link,ring};
}
function dollModel(){
 const g=new T.Group(),green=new T.MeshStandardMaterial({color:'#71af82',flatShading:true}),cream=new T.MeshStandardMaterial({color:'#d6e0aa'}),dark=new T.MeshBasicMaterial({color:'#353a43'});
 const ball=new T.SphereGeometry(1,10,8);
 function shape(m,x,y,z,rx,ry,rz){const o=new T.Mesh(ball,m);o.position.set(x,y,z);o.scale.set(rx,ry,rz);g.add(o);}
 shape(green,0,.43,0,.48,.43,.35);shape(cream,0,.38,.22,.32,.29,.19);shape(green,0,.85,.07,.43,.35,.34);
 for(const s of [-1,1]){
  shape(green,s*.27,1.11,.00,.115,.17,.12);shape(dark,s*.15,.86,.378,.035,.043,.018);
  shape(green,s*.29,.14,.12,.19,.13,.19);
 }
 shape(green,0,.36,-.36,.23,.13,.36);return g;
}
export function createMoveFX(scene){
 const draw=drawTools(scene),{symbol,solid,ring,link}=draw;
 const doll=dollModel();draw.root.add(doll);doll.visible=false;
 let copies=[],owner=null,copyType='';
 const matchingNodes=new WeakMap();
 function hide(){draw.reset();doll.visible=false;for(const c of copies)c.visible=false;}
 function ghosts(fighter,count,type){
  if(owner!==fighter||copyType!==type){
   copies.forEach(o=>o.removeFromParent());copies=[];owner=fighter;copyType=type;
  }
  while(copies.length<count){
   const c=fighter.root.clone(true);c.name=type==='transform'?'Transformed body':'Afterimage';
   if(type!=='transform')c.traverse(o=>{if(o.isMesh){
    // Share the translucent paint across the complete silhouette.
    o.material=ghostPaint;o.castShadow=false;o.receiveShadow=false;
   }});
   const origins=[],destinations=[];
   fighter.root.traverse(o=>origins.push(o));c.traverse(o=>destinations.push(o));
   matchingNodes.set(c,origins.slice(1).map((source,i)=>[source,destinations[i+1]]));
   draw.root.add(c);copies.push(c);
  }
  const visible=copies.slice(0,count);
  for(const c of visible)for(const [source,dest] of matchingNodes.get(c)){
   dest.position.copy(source.position);dest.quaternion.copy(source.quaternion);
   dest.scale.copy(source.scale);dest.visible=source.visible;
  }
  return visible;
 }
 const ghostPaint=new T.MeshBasicMaterial({color:'#89bfd0',transparent:true,opacity:.28,depthWrite:false});
 function drawMove(p,frame){
  const {A,B,S,Tgt,across,direction,r,u,t,hit,actor,target,meta}=frame;
  if(u<=.01||u>=.995)return;
  const [color,accent]=colors(p.palette),pal=p.palette,style=p.style,motif=p.motif;
  const phase=sm(.18,.70,u), visible=window(.09,.23,.78,.96,u);
  const targetR=Math.max(r*.75,Math.min(target.size.x,target.height)*.55);
  const position=(base,x,y,z)=>base.clone().addScaledVector(across,x*r).addScaledVector(up,y*r).addScaledVector(direction,z*r);
  const sign=(name,pal,base,x,y,z,size,rot=0,op=visible)=>symbol(name,pal,position(base,x,y,z),size*r,rot,op);
  const aim=meta.missed?position(B,1.7,.2,-.1):B,ground=S.y+Math.max(.012,r*.09);
  const active=window(.24,.40,.66,.87,u), time=u*TAU,progress=clamp((u-.18)/.58);
  const marks=Math.max(1,Math.min(6,Number(meta.hits)||p.n));
  function burst(center,scale=1){
   for(let i=0;i<7;i++){
    const angle=i*TAU/7;
    const base=position(center,cos(angle)*progress*.8*scale,sin(angle)*progress*.8*scale,0);
    symbol('spark',pal,base,r*(.16+.15*(1-progress))*scale,angle,active);
   }
  }
  function track(i,n,start=A,end=aim,lift=0){
   const q=clamp((u-.14-i*.26/Math.max(1,n-1))/.44);
   return mix(start,end,q).addScaledVector(up,sin(q*PI)*lift*r);
  }
  if(meta.phase==='charge'&&chargeMoves.has(p.id)){
   const source=position(S,0,.65,0);ring(source,r*(1.6-.72*phase),color,up,visible);
   for(let i=0;i<6;i++){const a=i*TAU/6+time;sign(motif,pal,source,cos(a)*(1.5-phase),.5+sin(a)*.46,sin(a)*(1.5-phase),.42,a);}
   return;
  }
  switch(style){
  case 'blow':case 'kick':case 'slash':case 'stab':case 'ram':case 'dash':case 'drill':case 'roll':case 'aerial':case 'toss':case 'burrow':{
   if(style==='aerial'||style==='burrow'){
    for(let i=0;i<8;i++){const a=i*TAU/8,spread=.45+phase*1.38;sign(style==='burrow'?'stone':'feather',pal,S,cos(a)*spread,.08+sin(progress*PI)*.38,sin(a)*spread,.38,a);}
   }
   const streak=style==='dash'||style==='drill'||p.id===37;
   if(streak)for(let i=0;i<4;i++){
    const start=position(S,(i-1.5)*.30,.7+(i%2)*.4,0),end=mix(start,aim,phase);
    link(mix(start,end,.24+i*.08),end,r*(.023+i*.008),i%2?accent:color,active*.70);
   }
   const beats=multiple.has(style)?marks:1;
   for(let i=0;i<beats;i++){
    const q=clamp((u-.26-i*.30/Math.max(1,beats-1))/.28),life=sin(q*PI);
    if(life<.015)continue;
    const loc=position(aim,(beats>1?(i%2?1:-1)*.43:0),p.id===67?-.58:(i%3)*.15,hit?-.12:-.4);
    sign(motif,pal,loc,(1-q)*-.62,1-q,0,(style==='slash'?1.95:1.32)*(.68+life*.36),style==='roll'||style==='drill'?q*3.6:(i%2?-.33:.26),life);
    if(p.id===7||p.id===8||p.id===9||p.id===146){
     const extra={7:'flame',8:'crystal',9:'bolt',146:'spiral'}[p.id];
     for(let j=0;j<4;j++){const a=j*PI/2+q;sign(extra,pal,loc,cos(a)*q*.89,sin(a)*q*.89,0,.48,a,life);}
    }
   }
   if(hit)burst(aim,p.id===5||p.id===25?1.35:.80);
   break;
  }
  case 'clamp':{
   const open=.33+(1-active)*.75;
   for(const s of [-1,1])sign(motif,pal,aim,s*open,.07,s*.08,1.26,s*(p.id===12?.85:.52),visible);
   if(hit)burst(aim,.65);break;
  }
  case 'lash':{
   const points=[];for(let i=0;i<11;i++){const f=i/10;points.push(mix(A,mix(A,aim,sm(.2,.46,u)),f)
    .addScaledVector(across,sin(f*PI*2+time)*sin(f*PI)*r*(p.id===122?.4:.72)));}
   for(let i=1;i<points.length;i++)link(points[i-1],points[i],(p.id===122?.14:.055)*r*(1-i*.045),color,visible);
   symbol(motif,pal,points.at(-1),r*.71,time*.4,visible);break;
  }
  case 'shot':case 'dart':case 'lob':case 'return':{
   const n=style==='return'?1:(Number(meta.hits)||p.n),arc=style==='lob'?1.65:p.id===6?.72:.13;
   for(let i=0;i<n;i++){
    const loc=style==='return'?mix(A,aim,sin(progress*PI)).addScaledVector(up,sin(progress*TAU)*r*.33):track(i,n,A,aim,arc);
    if(n>1){loc.addScaledVector(across,sin(i*2.3)*r*.5*sin(progress*PI));loc.y+=sin(i*4.5)*r*.24;}
    const size=style==='lob'?.88:style==='return'?1.02:style==='shot'?.64:.71;
    symbol(motif,pal,loc,size*r,style==='return'?time*2.5:motif==='coin'?time:.28*sin(i),visible);
   }
   if(hit&&p.id!==142)burst(aim,p.id===121?1.44:.66);
   break;
  }
  case 'stream':case 'beam':case 'bolt':{
   const end=mix(A,aim,sm(.17,.49,u));
   const gun=p.id===55||p.id===56,origins=gun&&actor.cannons?actor.cannons.map(c=>c.getWorldPosition(V())):[A];
   for(const start of origins){
    if(style==='bolt'){
     const strands=p.id===85?3:1;
     for(let j=0;j<strands;j++){
      let prev=start;
      for(let i=1;i<=11;i++){
       const f=i/11,node=mix(start,end,f),spread=sin(PI*f)*r;
       node.addScaledVector(across,(noise(i+Math.floor(u*19)*11+j*53)-.5)*spread*.83+j*.10*spread);
       node.y+=(noise(i*3+Math.floor(u*22)*9+j)-.5)*spread*1.03;
       link(prev,node,r*(j?.032:.071),j?accent:color,visible);prev=node;
      }
     }
     if(p.id===86)for(let j=0;j<3;j++)ring(aim,r*(.55+.21*j+.16*sin(time)),accent,up,active);
    }else if(style==='beam'){
     const spread=p.id===63?.18:p.id===76?.15:.082;
     link(start,end,r*spread,color,visible);link(start,end,r*spread*.42,'#fff9dc',visible);
     for(let i=0;i<6;i++){
      const f=(i+.4)/6,pos=mix(start,end,f);
      if([60,62,109].includes(p.id))pos.addScaledVector(across,sin(time*2+i)*r*.17);
      symbol(motif,pal,pos,r*(p.id===63?.54:.38),time+i,visible);
      if(p.id===62)ring(pos,r*.25,['#f09dbb','#fce67f','#8ceada'][i%3],direction,visible);
     }
     if(p.id===76)symbol('sun',pal,start,r*(.65+.32*sin(progress*PI)),time,visible);
    }else{
     let last=start;
     for(let i=0;i<15;i++){
      const f=(i+.3)/15,pos=mix(start,end,f).addScaledVector(across,sin(time*3+i)*r*.15*f);
      pos.y+=sin(time*2+i*1.7)*r*.12*f;
      const w=r*(.045+f*(p.id===56?.21:p.id===53||p.id===126?.34:.19));
      if(motif==='bubble')symbol('bubble',pal,pos,(w*3.5+.05*r),time+i,visible);
      else{link(last,pos,w*.66,i%4===0?accent:color,visible);solid('orb',pos,[w*1.3,w,w],i%3===0?accent:color,visible);}
      last=pos;
     }
     if(p.id===126)symbol('kanji',pal,position(end,0,.52,0),r*2.85,0,active*.88);
     else symbol(motif,pal,end,r*.82,time*.23,active);
    }
   }
   if(hit)burst(aim,p.id===63?1.5:.70);break;
  }
  case 'wind':case 'sound':{
   for(let i=0;i<Math.max(p.n,4);i++){
    const f=fract(progress*1.15-i*.17+1);const loc=mix(A,aim,f);
    if(style==='sound')ring(loc,r*(.32+f*(p.id===46?1.35:.86)),i%2?color:accent,direction,visible);
    else{const a=time*2+i;loc.addScaledVector(across,cos(a)*r*(.40+.39*f));loc.y+=sin(a)*r*(.40+.39*f);}
    if(motif!=='ripple')symbol(motif,pal,loc,r*(style==='sound'?.42:.61),style==='wind'?time+i:sin(i)*.25,visible);
   }break;
  }
  case 'ground':case 'storm':{
   if(style==='storm'){
    for(let i=0;i<p.n;i++){
     const f=fract(progress*1.3+noise(i)*.75),base=position(aim,(noise(i*3)-.5)*2.5,2.55-f*2.8,(noise(i+5)-.5)*1.9);
     if(motif==='bolt'){const top=position(base,0,1.4,0),knee=position(base,.32,.65,.04);
      link(top,knee,r*.075,color,visible);link(knee,base,r*.07,accent,visible);}
     else symbol(motif,pal,base,r*(motif==='stone'?.83:.51),i+f*1.4,visible);
    }
   }else if(motif==='crack'){
    let prev=S.clone();prev.y=ground+r*.012;
    for(let i=1;i<=14;i++){const pt=mix(S,Tgt,i/14*phase);pt.y=ground+r*.017;pt.addScaledVector(across,(noise(i)-.5)*r*.57);
     link(prev,pt,r*.084,'#49393f',visible);if(i%3===0)link(pt,position(pt,(i%2?-.6:.6),0,-.24),r*.032,accent,visible);prev=pt;}
   }else{
    for(let i=0;i<18;i++){
     const x=(i%6-2.5)*.39,row=Math.floor(i/6),front=clamp(phase-row*.095);
     const loc=mix(S,Tgt,front).addScaledVector(across,x*r);loc.y=ground+r*(motif==='fall'?.32+row*.49:.10+sin(front*PI)*.26);
     const h=motif==='stone'?.23+(1-Math.abs(x))*.11:.35+(1-Math.abs(x))*.24;
     solid('orb',loc,[r*.30,r*h,r*.28],i%4===0?accent:color,visible);}
    if(motif==='wave')for(let i=-1;i<=1;i++){const front=mix(S,Tgt,phase);sign('wave',pal,front,i*.8,.46,0,1.62,.10*i,visible);}
    if(motif==='fall')for(let i=0;i<7;i++)link(position(aim,(i-3)*.21,1.5,0),position(aim,(i-3)*.21,-.45,.05),r*.054,i%2?accent:color,active);
   }break;
  }
  case 'coil':{
   if(p.id===81)for(let i=0;i<4;i++)link(A,position(aim,cos(i)*.44,sin(i)*.55,0),r*.023,color,active);
   const turns=p.n,rad=targetR*(.86+(1-active)*.29);let prev=null;
   for(let i=0;i<=turns*10;i++){
    const q=i/(turns*10),a=q*TAU*turns+time,pt=aim.clone().addScaledVector(across,cos(a)*rad).addScaledVector(direction,sin(a)*rad);
    pt.y+=(q-.5)*targetR*1.36;
    if(prev)link(prev,pt,(motif==='thread'?.021:.062)*r,i%3?color:accent,visible);prev=pt;
    if(motif==='flame'&&i%5===0)symbol('flame',pal,pt,r*.48,a*.1,visible);
   }break;
  }
  case 'mind':case 'gaze':case 'debuff':{
   for(let i=0;i<3;i++){const q=fract(progress+i/3);const pos=mix(A,aim,.25+q*.75);
    ring(pos,r*(.32+q*.55),i%2?accent:color,direction,visible*(1-q*.35));}
   if(style==='mind')for(let i=0;i<3;i++){
    const a=time+i*TAU/3;sign(motif,pal,aim,cos(a)*.94,sin(a)*.71,.08,.70,a*.22);
   }else sign(motif,pal,aim,0,.63,0,1.02,.10*sin(time));
   break;
  }
  case 'dust':case 'field':case 'selfcloud':{
   const center=style==='selfcloud'?S:aim;
   const n=p.n>1?p.n:12;
   for(let i=0;i<n;i++){
    const f=fract(progress*.85+noise(i)),a=i*2.4+time*.27;
    const loc=style==='dust'?mix(A,aim,clamp(phase+.29*f-.17)):style==='field'?mix(A,B,f):center.clone();
    const spread=style==='field'?1.9:style==='selfcloud'?1.1:.86;
    loc.addScaledVector(across,cos(a)*r*spread*f).addScaledVector(direction,sin(a)*r*spread*f);
    loc.y+=r*(style==='selfcloud'?(.4+f*1.3):(f-.37)*.78);
    symbol(motif,pal,loc,r*(motif==='cloud'?1.03:motif==='sun'?.8:.46),a*.12,visible*.86);
   }break;
  }
  case 'seed':case 'drain':{
   if(style==='seed'){
    const spot=track(0,1,A,Tgt,1.13);symbol('seed',pal,spot,r*.58,time,visible);
    for(let i=0;i<3;i++)sign('sprout',pal,Tgt,(i-1)*.43,.38,i*.13,.76,0,active);
   }else for(let i=0;i<p.n;i++){
    if(p.id===138&&i<2)sign('sleep','sky',aim,-.32+i*.48,.8+i*.24,0,.55,.10*i);
    const q=fract(progress+i/p.n),pt=mix(aim,A,q).addScaledVector(across,sin(i*2+q*PI)*r*.39);
    pt.y+=sin(q*PI)*r*(.63+i%3*.13);symbol(motif,pal,pt,r*.46,i*.22,visible);
   }break;
  }
  case 'buff':case 'heal':case 'shrink':case 'melt':case 'splash':case 'blink':{
   const center=S.clone();center.y+=actor.height*.44;
   const size=Math.max(r,Math.min(actor.height,actor.size.x)*.55);
   if(style==='splash'){
    for(let i=0;i<9;i++){const a=i*TAU/9;sign('drop',pal,S,cos(a)*(phase+.4),sin(progress*PI)*.65,sin(a)*(phase+.4),.42,a);}
    ring(S.clone().addScaledVector(up,r*.045),size*(.35+phase*1.3),color,up,visible);
   }else if(style==='blink'){
    for(let i=0;i<4;i++){const pos=S.clone().addScaledVector(up,actor.height*(.16+.22*i));ring(pos,size*(.63+.30*sin(time+i)),i%2?accent:color,up,visible);}
   }else{
    const n=p.id===14?3:style==='heal'?7:5;
    for(let i=0;i<n;i++){
     const a=i*TAU/n+time*(style==='heal'?.43:1),y=(fract(progress+i/n)-.30)*actor.height;
     const pt=center.clone().addScaledVector(across,cos(a)*size).addScaledVector(direction,sin(a)*size);
     pt.y+=y;symbol(motif,pal,pt,r*(p.id===14?.94:p.id===135?.78:.53),p.id===14?-.33+sin(a)*.17:.08*sin(a),visible);
    }
    ring(S.clone().addScaledVector(up,r*.06),size*(.72+.39*phase),color,up,visible*.83);
   }break;
  }
  case 'screen':{
   const mid=position(A,0,0,.49),w=Math.max(r,actor.height*.67);
   const orient=V(0,0,1);
   const plane=solid('block',mid,[w*1.52,w*1.49,r*.055],color,.24*visible);
   plane.quaternion.setFromUnitVectors(orient,direction);
   ring(mid,w*.82,accent,direction,visible);
   if(p.id===112){
    for(const s of [-1,0,1]){link(position(mid,s*.49,-.65,0),position(mid,s*.49,.65,0),r*.022,accent,visible);}
   }else if(p.id===113){
    for(const s of [-1,1])link(position(mid,-.56,s*.38,0),position(mid,.56,s*.38,0),r*.033,accent,visible);
   }else{
    for(let i=0;i<3;i++)link(position(mid,-.49+i*.23,-.34,0),position(mid,-.18+i*.23,.46,0),r*.026,'#e5ffff',visible);
   }
   symbol(motif,pal,mid,w*.64,0,visible*.9);break;
  }
  case 'burst':{
   const radius=(p.id===153?2.9:2.15)*r*phase;
   for(let i=0;i<16;i++){
    const a=i*2.399,el=(noise(i)-.27)*1.6,pt=position(A,cos(a)*radius/r,el*radius/r,sin(a)*radius/r);
    const w=(.15+noise(i+3)*.27)*r*(1-.46*phase);solid('orb',pt,[w,w,w],i%3?color:accent,visible);
   }
   symbol('burst',pal,A,r*(1+phase*2.2),time*.16,visible);if(hit)burst(B,1.3);break;
  }
  case 'triad':{
   for(const [i,[g,c]] of [['flame','fire'],['bolt','volt'],['crystal','ice']].entries()){
    const a=i*TAU/3+time,loc=mix(A,aim,phase);loc.addScaledVector(across,cos(a)*r*.55);loc.y+=sin(a)*r*.55;
    symbol(g,c,loc,r*.85,a*.12,visible);
    link(mix(A,loc,.60),loc,r*.032,colors(c)[0],visible);
   }break;
  }
  case 'copy':case 'call':{
   symbol(motif,pal,position(S,0,(actor.height/r)+.44,0),r*1.1,style==='call'?.42*sin(time*3):0,visible);
   for(let i=0;i<3;i++){const a=i*TAU/3+time;sign('star',pal,A,cos(a)*.76,sin(a)*.63,0,.34,a);}
   break;
  }
  case 'echo':case 'transform':{
   const copying=style==='transform',count=copying?1:2;
   const afterimages=ghosts(copying?target:actor,count,copying?'transform':'echo');
   afterimages.forEach((c,i)=>{
    c.visible=copying?u>.35&&u<.84:visible>.12;
    if(!c.visible)return;
    c.position.copy(actor.root.getWorldPosition(V()));
    c.quaternion.copy(actor.root.getWorldQuaternion(new T.Quaternion()));
    if(copying){const scale=.03+.97*window(.34,.48,.75,.85,u);c.scale.setScalar(scale);}
    else{c.position.addScaledVector(across,(i?1:-1)*r*(.52+.48*sin(progress*PI)));c.scale.setScalar(1);}
   });
   for(let i=0;i<5;i++){const a=time+i*TAU/5;sign(motif,pal,A,cos(a)*1.12,sin(a)*.81,0,.39,a);}
   break;
  }
  case 'doll':{
   doll.visible=visible>.09;
   doll.position.copy(S).addScaledVector(direction,r*.81);doll.quaternion.copy(actor.root.getWorldQuaternion(new T.Quaternion()));
   doll.scale.setScalar(Math.min(actor.height*.77,r*2)*window(.15,.40,.80,.97,u));
   for(let i=0;i<7;i++){const a=i*TAU/7;sign('cloud','ivory',S,cos(a)*phase,.40+sin(a)*.35,sin(a)*phase,.64,a,visible*(1-phase*.75));}
   break;
  }
  default:throw new Error('Unimplemented move staging '+style);
  }
 }
 // Both renderers pass the same two staged fighters and their rest positions.
 // Every component is sampled from u so seeking, replay and interruption reset cleanly.
 function perform({actor,target,move,t,u,from,to,hit=true,meta={},reduced=false}){
  hide();
  let p=presentation(move.id),call=p.style==='call';
  const called=Number(meta.calledMoveId??meta.calledMove?.id??meta.calledMove);
  if(call&&u>=.38&&(called||meta.preview)){
   const id=called||(p.id===118?129:60);
   if(id>=1&&id<=165&&id!==p.id){p=presentation(id);move=moveById(id);u=clamp((u-.38)/.62);}
  }else if(call)u=clamp(u/((called||meta.preview)?.38:1));
  if(p.id===117&&(meta.phase==='strike'||(meta.preview&&u>=.43))){
   p={...p,style:'beam',motif:'burst'};if(meta.preview)u=clamp((u-.43)/.57);
  }else if(p.id===117&&meta.preview)u=clamp(u/.43);
  const S=from.clone(),Tgt=to.clone(),direction=V().subVectors(Tgt,S).setY(0).normalize();
  const across=V(direction.z,0,-direction.x),gap=S.distanceTo(Tgt),r=Math.max(.07,Math.min(1.35,Math.max(gap*.085,Math.min(actor.height,target.height)*.40)));
  const self=selfStyles.has(p.style),guard=['screen','buff','heal','doll','melt','shrink'].includes(p.style);
  const wind=window(0,.19,.24,.44,u),strike=window(.22,.47,.55,.91,u);
  const charge=meta.phase==='charge'&&chargeMoves.has(p.id);
  let attack=charge?0:strike;
  if(!charge&&multiple.has(p.style)&&(Number(meta.hits)||p.n)>1){
   const n=Math.min(6,Number(meta.hits)||p.n),beat=sin(clamp((u-.20)/.62)*PI*n)**2;
   attack=strike*(.38+.62*beat);
  }
  const kind=guard?'guard':contact.has(p.style)?(move.power>=75?'heavy':'light'):'special';
  const impacts=hit&&!self&&!charge&&(!passive.has(p.style)||move.category!=='Status');
  const flinch=impacts?window(.43,.52,.68,.92,u):0;
  actor.root.position.copy(from);target.root.position.copy(to);
  for(const f of [actor,target]){f.root.scale.setScalar(1);f.body.position.set(0,0,0);f.body.rotation.set(0,0,0);f.body.scale.setScalar(1);}
  pose(actor,{t:reduced?0:t,u,kind,wind,strike:attack,recoil:0});
  pose(target,{t:reduced?0:t,u,kind:flinch?'hurt':'idle',wind:0,strike:0,recoil:flinch});
  const m=reduced?.40:1,k=attack*m;
  const reach=Math.max(0,gap-(actor.size.z+target.size.z)*.40);
  if(contact.has(p.style)&&p.style!=='lash'&&!charge){
   actor.root.position.addScaledVector(direction,reach*k*(hit?1:.76));
   if(p.style==='kick'||p.style==='roll'||p.style==='dash')actor.root.position.y+=actor.height*.16*sin(k*PI);
   if(p.style==='roll'||p.style==='drill')actor.body.rotation.z=(p.style==='roll'?1.85:2.6)*k;
   if(p.style==='aerial')actor.root.position.y+=Math.max(actor.height*.72,r*1.3)*window(.12,.32,.41,.60,u)*m;
   if(p.style==='burrow'){const burial=window(.10,.29,.34,.49,u);actor.body.scale.y=Math.max(.03,1-burial*.97);actor.body.rotation.x=.42*burial;}
  }
  if(charge){
   if(p.id===19)actor.root.position.y+=actor.height*.88*window(.12,.39,.77,.98,u)*m;
   if(p.id===91)actor.body.scale.y=Math.max(.025,1-.97*window(.12,.39,.77,.98,u));
  }
  if(p.style==='toss')target.root.position.y+=Math.max(r*1.22,target.height*.46)*flinch*m;
  if(p.style==='mind'){target.root.position.y+=target.height*(p.id===94?.36:.16)*flinch*m;target.body.rotation.z=sin(u*PI*5)*flinch*.24*m;}
  if(p.style==='splash'){actor.root.position.y+=actor.height*.53*sin(clamp((u-.10)/.72)*PI)*m;actor.body.rotation.z=.24*sin(u*PI*2)*m;}
  if(p.style==='shrink'||p.style==='melt'){const q=window(.17,.41,.77,.97,u);if(p.style==='shrink')actor.body.scale.setScalar(1-.65*q);
   else actor.body.scale.set(1+.36*q,1-.56*q,1+.28*q);}
  if(p.style==='blink')actor.body.scale.setScalar(1-.97*window(.21,.39,.59,.82,u));
  if(p.style==='transform')actor.body.scale.setScalar(1-.999*window(.25,.40,.78,.92,u));
  if(p.style==='doll')actor.root.position.addScaledVector(direction,-r*.67*strike);
  if(p.id===156){actor.body.rotation.z=-.27*strike;actor.body.scale.y=1-.14*strike;}
  if(p.id===39)actor.body.rotation.y=.76*sin(TAU*u*2)*strike*m;
  if(p.id===111||p.id===110)actor.body.scale.y=1-.23*strike;
  target.root.position.addScaledVector(direction,target.height*.16*flinch*m);target.body.rotation.x-=.17*flinch*m;
  actor.root.updateWorldMatrix(true,true);target.root.updateWorldMatrix(true,true);
  const A=actor.source.getWorldPosition(V()),B=target.root.getWorldPosition(V());B.y+=target.height*.54;
  drawMove(p,{A,B,S,Tgt,across,direction,r,u,t,hit,actor,target,meta});
  if((meta.missed||meta.immune||meta.failed)&&!self&&u>.45&&u<.82){
   const loc=B.clone().addScaledVector(across,r*.76).addScaledVector(up,r*.53);
   symbol('trail','cream',loc,r*.8,-.27,window(.43,.52,.72,.83,u));
  }
  return p;
 }
 return {perform,clear:hide,root:draw.root};
}
