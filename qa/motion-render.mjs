// Inspect the actual rendered poses, independent of the numerical transform tests.
// BASE_URL must point to Vite's dev server. The optional reel needs Python/OpenCV.
import {chromium} from 'playwright-core';
import {writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
const fps=20,seconds=5;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=metal','--enable-webgl']});
try{
 const page=await browser.newPage();await page.goto(process.env.BASE_URL||'http://127.0.0.1:4180');await page.waitForFunction(()=>window.__dioramaReady);
 const report=await page.evaluate(async()=>{
  const {T,v}=await import('/src/shapes.js'),{makeFighter,removeFighter,pose}=await import('/src/models/fighter.js'),{roster,lookup}=await import('/src/roster.js'),{moveById}=await import('/src/gen1-data.js'),{motionFrame,attackKind}=await import('/src/motion-frame.js');
  const gl=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});gl.setClearColor(0xf5f4ea,1);gl.setSize(160,160);
  const scene=new T.Scene(),cam=new T.OrthographicCamera(-1,1,1,-1,.01,100);scene.add(new T.HemisphereLight(0xfffaea,0xb7c6bd,2));const sun=new T.DirectionalLight(0xffefc9,2.4);sun.position.set(-3,5,4);scene.add(sun);
  const tmp=document.createElement('canvas');tmp.width=tmp.height=160;const ctx=tmp.getContext('2d',{willReadFrequently:true});
  const fit=(f,aspect=1)=>{const center=v(0,f.height*.50,0);cam.position.copy(center).addScaledVector(v(.65,.26,1.4).normalize(),Math.max(4,f.size.length()*2));cam.lookAt(center);
   const half=Math.max(f.size.y+f.size.z*.2,(f.size.x+f.size.z*.5)/aspect)*.63;cam.left=-half*aspect;cam.right=half*aspect;cam.top=half;cam.bottom=-half;cam.updateProjectionMatrix()};
  const pixels=(f,sample)=>{pose(f,sample);gl.render(scene,cam);ctx.drawImage(gl.domElement,0,0);return ctx.getImageData(0,0,160,160).data};
  function changed(a,b){let n=0;for(let i=0;i<a.length;i+=4)if(Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]))>10)n++;return n}
  const report=[];for(const mon of roster){const f=makeFighter(scene,mon);fit(f);
   const idle=t=>pixels(f,motionFrame(t,'idle',0,'player','idle')),a=idle(.17),b=idle(.97),c=idle(1.85);
   const moves=mon.defaultMoves.map(id=>{const move=moveById(id),slot=move.category==='Status'?'guard':move.delivery==='contact'?'tail':'bolt';return changed(b,pixels(f,motionFrame(.97,slot,.51,'player',attackKind(slot,move.delivery))))});
   report.push({id:mon.id,name:mon.name,idlePixels:Math.max(changed(a,b),changed(b,c)),attackPixels:moves});removeFighter(f);
  }
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=872;const g=canvas.getContext('2d');
  gl.setSize(300,200);
  const subjects=[12,9,51,68,95,105,106,129,150].map(id=>{const f=makeFighter(scene,lookup(id));f.root.visible=false;return f});
  window.reelFrame=t=>{
   const phase=t<1.7?'IDLE':t<3.2?'ATTACK':'RECOVERY';
   g.fillStyle='#f4f4eb';g.fillRect(0,0,960,872);g.fillStyle='#163638';g.fillRect(0,0,960,77);
   g.fillStyle='#ffe379';g.font='bold 27px Arial';g.fillText('KANTO IN MOTION',22,37);g.fillStyle='#d6e5d8';g.font='13px monospace';g.fillText('POKÉMON BATTLE FIELD   /   ANIMATION STUDIES',23,59);g.textAlign='right';g.fillStyle='#fff5cc';g.fillText(phase,932,42);g.textAlign='left';
   for(const [i,f] of subjects.entries()){const x=12+(i%3)*314,y=87+Math.floor(i/3)*249;
    f.root.visible=true;fit(f,1.5);
    const m=moveById(f.mon.defaultMoves[0]),slot=m.category==='Status'?'guard':m.delivery==='contact'?'tail':'bolt',u=(t-1.7)/1.5;pose(f,motionFrame(t,u<0||u>1?'idle':slot,Math.max(0,Math.min(1,u)),'player',attackKind(slot,m.delivery)));gl.render(scene,cam);
    g.fillStyle='#fffef5';g.fillRect(x,y,308,239);g.drawImage(gl.domElement,x+4,y+4,300,200);g.fillStyle='#263c35';g.font='bold 17px Arial';g.fillText(f.mon.name,x+9,y+226);g.textAlign='right';g.fillStyle='#526954';g.font='12px monospace';g.fillText(phase==='ATTACK'?m.name:'#'+String(f.mon.id).padStart(3,'0'),x+299,y+225);g.textAlign='left';f.root.visible=false;
   }
   g.fillStyle='#475e50';g.font='12px monospace';g.fillText('Individual close-ups. In the arena, all species share the same metre scale.',22,855);
   return canvas.toDataURL('image/jpeg',.94).split(',')[1];
  };
  return report;
 });
 writeFileSync('qa/motion-coverage.json',JSON.stringify(report,null,2)+'\n');
 const failed=report.filter(r=>r.idlePixels<4||Math.min(...r.attackPixels)<4);if(failed.length)throw Error('Visually static at 160 px: '+JSON.stringify(failed));
 console.log('All '+report.length+' visible from the test camera: idle min '+Math.min(...report.map(r=>r.idlePixels))+' changed pixels; attack min '+Math.min(...report.flatMap(r=>r.attackPixels))+'.');
 if(!process.env.SKIP_REEL){
 const encoder=spawn('python3',['-c',`import cv2,numpy as np,sys,struct
w=cv2.VideoWriter('captures/kanto-motion.mp4',cv2.VideoWriter_fourcc(*'avc1'),${fps},(960,872))
assert w.isOpened()
while (h:=sys.stdin.buffer.read(4)):
 n=struct.unpack('>I',h)[0];w.write(cv2.imdecode(np.frombuffer(sys.stdin.buffer.read(n),np.uint8),cv2.IMREAD_COLOR))
w.release()`],{stdio:['pipe','inherit','inherit']});const done=once(encoder,'exit');
 for(let i=0;i<fps*seconds;i++){const data=Buffer.from(await page.evaluate(t=>reelFrame(t),i/fps),'base64'),h=Buffer.alloc(4);h.writeUInt32BE(data.length);encoder.stdin.write(h);if(!encoder.stdin.write(data))await once(encoder.stdin,'drain')}
 encoder.stdin.end();const [status]=await done;if(status)throw Error('Video export failed');
 }
}finally{await browser.close()}
