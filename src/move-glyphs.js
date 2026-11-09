// Original, camera-facing battle symbols. Ink and a pale rim keep them legible
// over both the green pitch and the light Pokédex grid.
import {CanvasTexture,SRGBColorSpace} from 'three';
const palettes={
 cream:['#fff2c8','#cf944d'],ivory:['#fff4d8','#ac8f6e'],tan:['#dbac76','#92634b'],
 gold:['#ffe465','#ec9e2f'],orange:['#ffb45e','#d35935'],red:['#ff8a73','#bd394a'],rust:['#df845c','#983d40'],
 fire:['#ff802e','#ffce4e'],ice:['#a0edff','#6499d3'],volt:['#ffdf38','#fff6ad'],steel:['#d7e1eb','#7794a6'],
 leaf:['#a7da62','#538e46'],mint:['#92e5ba','#579f90'],sky:['#a3e0ff','#758fce'],sand:['#e3c98b','#a58059'],
 pink:['#ffaccb','#c96492'],venom:['#c390e0','#8554a1'],acid:['#c3ed68','#80b644'],water:['#6bc9f3','#c8f9fc'],
 violet:['#ba93ef','#7d65b8'],psy:['#f8a0d5','#9c79ce'],aurora:['#a4efea','#ea91c7'],solar:['#ffe88c','#ffc049'],
 dragon:['#ac9bfa','#5e81c2'],earth:['#b69b7f','#806749'],ghost:['#a99bda','#655a88'],smoke:['#a09dab','#6b6877'],
};
export const colors=name=>palettes[name];
const cache=new Map();
export function glyph(name,palette){
 const key=name+palette;if(cache.has(key))return cache.get(key);
 const c=document.createElement('canvas');c.width=c.height=96;const ctx=c.getContext('2d');ctx.scale(1.5,1.5);
 const [main,shade]=colors(palette),ink='#3b3644';ctx.lineJoin='round';ctx.lineCap='round';
 function path(points,fill=main,close=true,stroke=ink,width=2.2){
  ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));if(close)ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
 }
 function dot(x,y,rx,ry,fill=main,stroke=ink){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
  ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2.2;ctx.stroke();}}
 function line(points,color=ink,w=2.1){path(points,null,false,color,w);}
 function star(n,inner,outer,fill=main){path(Array.from({length:n*2},(_,i)=>{
  const a=i*Math.PI/n-Math.PI/2,r=i%2?inner:outer;return [32+Math.cos(a)*r,32+Math.sin(a)*r];
 }),fill);}
 function spiral(){const pts=[];for(let i=0;i<58;i++){const a=i*.18,r=2+i*.37;pts.push([32+Math.cos(a)*r,32+Math.sin(a)*r]);}line(pts,ink,7);line(pts,main,4);}
 switch(name){
 case 'fist':case 'palm':case 'finger':
  if(name==='fist'){path([[9,35],[10,25],[17,20],[20,15],[27,15],[31,12],[39,15],[45,16],[49,24],[54,27],[54,36],[45,44],[40,53],[22,52],[18,43]],main);
   for(const x of [20,28,36])line([[x,21],[x+2,28]],shade,3);line([[17,35],[28,37],[37,28],[48,27]],ink,2);}
  else{path(name==='finger'?[[16,42],[16,31],[22,27],[26,30],[26,12],[30,7],[35,10],[35,29],[39,26],[43,29],[47,29],[51,34],[47,46],[40,54],[23,53]]:
    [[13,37],[9,26],[13,22],[23,31],[19,15],[23,12],[29,28],[28,10],[33,8],[36,27],[38,12],[43,13],[42,29],[48,20],[52,23],[47,43],[38,54],[23,52]]);}
  break;
 case 'foot':path([[25,9],[41,12],[36,29],[38,35],[51,37],[56,44],[52,49],[29,50],[14,43],[12,37],[21,27]]);line([[16,40],[32,46],[51,44]],shade,3);break;
 case 'claw':case 'chop':case 'blade':case 'sword':
  if(name==='claw'){for(let i=0;i<3;i++)path([[8+i*8,52-i*3],[31+i*8,18-i*3],[42+i*6,10-i*2],[31+i*8,29-i*2]],main);}
  else {path([[14,48],[21,38],[16,32],[21,29],[25,33],[49,9],[55,6],[53,17],[32,39],[36,43],[32,47],[27,42],[19,52]]);line([[26,35],[49,14]],'#fff9d9',2);}
  break;
 case 'coin':case 'halo':case 'sun':case 'shield':case 'plate':case 'mirror':case 'wall':case 'pane':
  if(name==='sun')star(9,17,27);
  if(['shield','plate','wall','pane','mirror'].includes(name)){
   path([[12,16],[31,8],[52,16],[50,35],[43,47],[32,54],[18,46],[12,34]],main);
   path([[18,20],[31,14],[46,20],[44,33],[38,44],[32,47],[23,41],[18,32]],shade,null);
   line([[23,34],[37,20]],'#fff9e8',3);
  }else{dot(32,32,19,19,main);dot(32,32,14,14,shade);if(name==='coin')line([[35,23],[28,23],[25,29],[37,34],[34,40],[26,40]],main,3);}
  break;
 case 'fang':case 'horn':case 'needle':case 'spike':case 'beak':
  path(name==='fang'?[[17,12],[49,15],[41,33],[26,53],[25,32]]:[[10,49],[21,34],[46,13],[56,8],[47,25],[29,45],[16,54]]);
  line([[20,45],[45,19]],'#fff9e8',2);break;
 case 'band':case 'thread':case 'spiral':case 'ripple':case 'dream':case 'tail':spiral();break;
 case 'leaf':case 'feather':case 'petal':case 'sprout':case 'seed':
  if(name==='sprout'){line([[32,56],[33,26]],shade,5);path([[32,37],[20,34],[12,20],[27,22],[34,31]]);path([[33,30],[39,17],[54,13],[49,27],[39,32]]);}
  else{path([[10,53],[14,31],[24,18],[42,12],[56,9],[52,29],[40,44],[25,49]]);line([[11,54],[27,38],[48,18]],shade,2.5);
   if(name==='feather')for(let i=0;i<3;i++)line([[22+i*6,44-i*7],[21+i*6,35-i*7]],shade);}
  break;
 case 'drop':case 'jet':case 'flame':
  path(name==='flame'?[[13,45],[14,32],[22,22],[21,31],[34,7],[36,26],[46,19],[49,33],[51,42],[44,52],[28,56]]:
   [[13,42],[16,31],[28,20],[40,8],[47,24],[50,38],[46,49],[36,55],[23,53]]);
  if(name==='flame')path([[24,48],[26,37],[31,39],[36,26],[41,43],[37,50],[31,52]],shade);
  else dot(25,36,4,7,'#ecfcff',null);break;
 case 'bolt':case 'spark':path([[35,5],[12,36],[28,34],[21,58],[53,23],[36,27],[45,8]]);break;
 case 'stone':case 'cube':path([[13,27],[24,12],[43,14],[55,27],[49,46],[33,53],[15,45]]);path([[24,13],[32,30],[53,27],[42,15]],shade);line([[32,30],[32,51]],ink);break;
 case 'crystal':path([[32,6],[48,24],[43,45],[32,56],[20,46],[16,24]]);line([[32,8],[30,32],[32,54]],'#f7fcff');line([[17,24],[30,32],[47,24]],shade);break;
 case 'snow':for(let j=0;j<3;j++){ctx.save();ctx.translate(32,32);ctx.rotate(j*Math.PI/3);line([[0,-23],[0,23]],shade,5);for(const s of [-1,1])line([[-6,s*17],[0,s*12],[6,s*17]],main,3);ctx.restore();}break;
 case 'bubble':case 'spore':dot(32,32,21,21,main);dot(25,23,5,5,'#fff9eb',null);if(name==='spore')for(const [x,y] of [[38,32],[26,39],[39,42]])dot(x,y,3,3,shade,null);break;
 case 'note':line([[23,43],[23,17],[46,12],[46,37]],ink,6);line([[23,42],[23,17],[46,12],[46,37]],main,3);dot(18,44,9,6);dot(41,39,9,6);break;
 case 'eye':case 'mask':path([[6,33],[18,20],[31,17],[46,20],[58,31],[47,42],[33,46],[18,42]]);dot(32,32,8,10,shade);dot(33,32,4,6,ink,null);dot(30,29,2,2,'#fff',null);break;
 case 'cross':path([[25,9],[39,9],[39,24],[54,24],[54,39],[39,39],[39,54],[25,54],[25,39],[10,39],[10,24],[25,24]]);break;
 case 'sleep':line([[15,19],[47,19],[16,45],[49,45]],ink,8);line([[15,19],[47,19],[16,45],[49,45]],main,5);break;
 case 'skull':case 'ghost':path([[11,36],[12,24],[18,15],[30,10],[44,15],[51,24],[52,38],[46,40],[43,51],[35,47],[29,52],[23,46],[17,50],[17,40]]);dot(23,31,5,6,ink,null);dot(39,31,5,6,ink,null);break;
 case 'egg':dot(32,32,17,23,main);line([[19,34],[26,29],[32,34],[40,28],[48,32]],shade,2);break;
 case 'bone':line([[17,47],[46,18]],ink,12);line([[17,47],[46,18]],main,8);
  for(const [x,y] of [[13,43],[21,51],[42,13],[50,20]])dot(x,y,6,6,main);break;
 case 'heart':path([[32,53],[14,37],[9,25],[14,15],[23,14],[32,22],[40,14],[50,15],[55,24],[52,34]]);break;
 case 'cloud':dot(21,36,13,11);dot(32,28,14,14);dot(44,36,13,12);dot(32,38,14,11,main,null);break;
 case 'pincer':case 'shell':path([[9,29],[18,12],[27,10],[22,28],[32,34],[43,25],[47,11],[53,17],[54,32],[45,43],[37,48],[28,54],[18,49],[23,41]]);break;
 case 'spoon':line([[18,53],[37,31]],ink,7);line([[18,53],[37,31]],main,4);dot(42,22,9,12,main);break;
 case 'question':line([[20,22],[26,15],[37,14],[45,21],[44,28],[33,35],[31,41]],main,6);dot(30,49,3,3,main);break;
 case 'tongue':path([[17,17],[32,17],[48,34],[49,45],[43,51],[35,50],[27,43],[24,31]]);line([[25,25],[40,44]],shade,2);break;
 case 'kanji':line([[32,13],[32,29],[11,27],[32,29],[54,25]],shade,7);line([[32,28],[26,40],[13,53]],main,8);line([[31,30],[43,44],[53,50]],main,8);line([[32,9],[32,29],[13,27],[32,29],[52,25]],main,5);break;
 case 'zigzag':case 'trail':line([[6,43],[21,24],[28,36],[42,19],[49,31],[58,21]],shade,6);break;
 case 'doll':path([[11,48],[14,29],[14,12],[26,17],[34,15],[48,10],[48,24],[53,34],[51,46],[40,53],[24,53]]);dot(24,33,3,4,ink);dot(41,31,3,4,ink);break;
 case 'wave':case 'fall':path([[7,48],[14,35],[25,20],[40,15],[50,19],[55,28],[47,24],[40,28],[41,37],[52,48]]);break;
 case 'ribbon':line([[7,45],[20,23],[35,37],[53,16]],shade,9);line([[7,43],[20,21],[35,35],[53,14]],main,5);break;
 case 'crack':path([[37,6],[24,24],[34,25],[19,42],[28,42],[22,58],[45,35],[35,34],[44,17],[34,21]]);break;
 case 'clone':case 'blast':case 'burst':case 'star':star(name==='star'?5:8,name==='star'?11:12,26);break;
 default:throw new RangeError('Missing move glyph '+name);
 }
 const tex=new CanvasTexture(c);tex.colorSpace=SRGBColorSpace;cache.set(key,tex);return tex;
}
