import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const base=process.env.BASE_URL||'http://127.0.0.1:4180',browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=metal','--enable-webgl']});
try{
for(const width of [1280,390]){
const p=await browser.newPage({viewport:{width,height:width===390?844:800},reducedMotion:'reduce'}),errors=[],external=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await p.route('**/*',r=>{if(r.request().url().startsWith('http')&&!r.request().url().startsWith(base)){external.push(r.request().url());return r.abort()}return r.continue()});
await p.goto(base);await p.waitForFunction(()=>window.__dioramaReady);assert.equal(await p.locator('#play').getAttribute('aria-pressed'),'true');
await p.screenshot({path:'qa/'+(width===390?'phone':'wide')+'-battle.png',fullPage:true});
assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
const c=p.locator('#field'),bounds=await c.boundingBox(),center={x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2},camera=()=>p.evaluate(()=>__diorama.camera.position.toArray());let home=await camera();await p.mouse.move(center.x,center.y);await p.mouse.down();await p.mouse.move(center.x+50,center.y+12);await p.mouse.up();assert.notDeepEqual(home,await camera());await p.locator('#reset').click();
let restored=await camera();assert.ok(home.every((x,i)=>Math.abs(restored[i]-x)<1e-5));
const startingHP=await p.locator('#php').innerText();
for(let i=0;i<15;i++){if(await p.locator('#again').isVisible())break;
 const move=p.locator('#moves button:enabled').first();await move.click();
 await p.waitForFunction(()=>document.querySelector('#moves button:enabled')||!document.querySelector('#again').hidden);
}
assert.ok(await p.locator('#again').isVisible());assert.match(await p.locator('#prompt').innerText(),/wins|draw/i);
await p.locator('#again').click();assert.equal(await p.locator('#php').innerText(),startingHP);
await p.locator('#show').click();await p.locator('#seek').fill('35.5');assert.ok(await p.locator('#prompt').innerText());await p.locator('#pause').click();await p.waitForFunction(()=>document.querySelector('#clock').textContent.startsWith('00:36'));await p.locator('#pause').click();
async function freeze(n){await p.evaluate(t=>__diorama.freeze(t),n);return await c.screenshot()}let a=await freeze(26.8),b=await freeze(12),again=await freeze(26.8);assert.ok(!a.equals(b));assert.ok(a.equals(again),'freeze did not reproduce frame');
await p.locator('#play').click();assert.equal(await p.locator('#prompt').innerText(),'Choose a move.');assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log(width+': battle result, rematch, orbit/reset, replay controls, repeatable frames, local-only resources passed');await p.close();
}
}finally{await browser.close()}
