// Render a deterministic 45-second H.264 capture. Requires Python + OpenCV.
import {chromium} from 'playwright-core';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
const fps=24,width=896,height=608;
const encode=spawn('python3',['-c',`
import sys,struct,cv2,numpy as np
w=cv2.VideoWriter('captures/indigo-exhibition.mp4',cv2.VideoWriter_fourcc(*'avc1'),${fps},(${width},${height}))
assert w.isOpened()
while (header:=sys.stdin.buffer.read(4)):
 n=struct.unpack('>I',header)[0]; a=np.frombuffer(sys.stdin.buffer.read(n),np.uint8); w.write(cv2.imdecode(a,cv2.IMREAD_COLOR))
w.release()`],{stdio:['pipe','inherit','inherit']});const finished=once(encode,'exit');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=metal','--enable-webgl']});
try{const p=await browser.newPage({viewport:{width:1280,height:850}});await p.goto(process.env.BASE_URL||'http://127.0.0.1:4181');await p.waitForFunction(()=>window.__dioramaReady);await p.addStyleTag({content:'.stage{width:896px!important;height:608px!important;flex:none!important}'});await p.waitForFunction(()=>__diorama.renderer.domElement.clientWidth===896);await p.evaluate(()=>{window.movie=document.createElement('canvas');movie.width=896;movie.height=608});
 for(let i=0;i<fps*45;i++){let jpg=await p.evaluate(t=>{__diorama.freeze(t);const ctx=movie.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(__diorama.renderer.domElement,0,0,movie.width,movie.height);return movie.toDataURL('image/jpeg',.95).split(',')[1]},i/fps);let b=Buffer.from(jpg,'base64'),h=Buffer.alloc(4);h.writeUInt32BE(b.length);encode.stdin.write(h);if(!encode.stdin.write(b))await once(encode.stdin,'drain')}
}finally{encode.stdin.end();await browser.close()}
const [status]=await finished;if(status)throw Error('Encoder failed');
