// Bake portraits from the actual orbitable models. No external sprite assets.
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=metal']});
try{
 const page=await b.newPage();await page.goto(process.env.BASE_URL||'http://127.0.0.1:4180');
 const atlases=await page.evaluate(async()=>{
  const {makeFighter,removeFighter}=await import('/src/models/fighter.js'),{T,v}=await import('/src/shapes.js'),{roster}=await import('/src/roster.js');
  const tile=96,gl=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});gl.setSize(tile,tile);gl.setClearColor(0,0);
  const cam=new T.OrthographicCamera(-1,1,1,-1,.01,100),scene=new T.Scene();scene.add(new T.HemisphereLight(0xfff8e9,0xc2cad3,2.2));const sun=new T.DirectionalLight(0xfff3de,2.4);sun.position.set(-2,5,4);scene.add(sun);
  let outputs=[];for(const yaw of [.5,3.7]){
   const sheet=document.createElement('canvas');sheet.width=16*tile;sheet.height=10*tile;const ctx=sheet.getContext('2d');
   for(const mon of roster){const f=makeFighter(scene,mon),center=v(0,f.height/2,0);
    cam.position.copy(center).addScaledVector(v(Math.sin(yaw),.22,Math.cos(yaw)).normalize(),Math.max(4,f.size.length()*1.8));cam.lookAt(center);cam.updateMatrixWorld(true);
    // Actual visible vertex bounds avoid shrinking models with long wings or curled tails.
    let xmin=Infinity,xmax=-Infinity,ymin=Infinity,ymax=-Infinity;f.root.updateMatrixWorld(true);
    f.root.traverse(o=>{if(!o.isMesh)return;const pos=o.geometry.getAttribute('position'),m=new T.Matrix4().multiplyMatrices(cam.matrixWorldInverse,o.matrixWorld),pt=v();for(let i=0;i<pos.count;i++){pt.fromBufferAttribute(pos,i).applyMatrix4(m);xmin=Math.min(xmin,pt.x);xmax=Math.max(xmax,pt.x);ymin=Math.min(ymin,pt.y);ymax=Math.max(ymax,pt.y)}});
    let hh=Math.max(xmax-xmin,ymax-ymin)*.56,mx=(xmin+xmax)/2,my=(ymin+ymax)/2;
    cam.left=mx-hh;cam.right=mx+hh;cam.top=my+hh;cam.bottom=my-hh;cam.updateProjectionMatrix();gl.render(scene,cam);ctx.drawImage(gl.domElement,((mon.id-1)%16)*tile,Math.floor((mon.id-1)/16)*tile);removeFighter(f)}
   outputs.push(sheet.toDataURL(yaw===.5?'image/webp':'image/png',.92).split(',')[1])
  }gl.dispose();return outputs;
 });
 for(const [i,file] of ['assets/kanto-atlas.webp','qa/kanto-back.png'].entries())writeFileSync(file,Buffer.from(atlases[i],'base64'));
}finally{await b.close()}
