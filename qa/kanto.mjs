import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const base=process.env.BASE_URL||'http://127.0.0.1:4181';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=metal','--enable-webgl']});
try{for(const [width,offline] of [[1280,false],[390,true]]){
 const page=await browser.newPage({viewport:{width,height:width===390?844:800},reducedMotion:'reduce',offline});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(offline?pathToFileURL(resolve('dist/pokemon-battle-field.html')).href:base);await page.waitForFunction(()=>window.__dioramaReady);
 const loc=id=>page.locator('#'+id);
 async function select(id,side){await loc('openDex').click();await loc('dexType').selectOption('');assert.equal(await page.locator('.species').count(),151);await loc('dexSearch').fill('#'+id);await page.locator('[data-dex="'+id+'"]').click();await loc(side).click();await loc('partyBattle').click();}
 await loc('openDex').click();await loc('dexSearch').fill('nidoran f');assert.equal(await page.locator('.species').count(),1);await loc('dexSearch').fill('not-a-pokemon');assert.equal(await page.locator('.species').count(),0);await loc('dexSearch').fill('');await loc('dexType').selectOption('Rock');assert.ok(await page.locator('.species').count()>0 && await page.locator('.species').count()<151);
 await loc('dexSearch').fill('Onix');await page.locator('[data-dex="95"]').click();assert.equal(await loc('dexSize').innerText(),'8.8 m');assert.equal(await loc('measureLabel').innerText(),'Pokédex length');await loc('trainerCompare').uncheck();await loc('trainerCompare').check();
 await page.screenshot({path:'qa/kanto-'+width+'.png'});const preview=await loc('modelView').boundingBox();assert.ok(preview.width>100&&preview.height>100);
 const direction=()=>page.evaluate(()=>__diorama.dex.studio.camera.position.toArray());let before=await direction();await page.mouse.move(preview.x+60,preview.y+60);await page.mouse.down();await page.mouse.move(preview.x+100,preview.y+63);await page.mouse.up();assert.notDeepEqual(before,await direction());await page.locator('#rivalEditor summary').click();await loc('asRival').click();assert.equal(await loc('cname').innerText(),'Onix');
 await select(50,'asPlayer');assert.equal(await loc('pname').innerText(),'Diglett');
 await loc('focus').click();await loc('reset').click();await page.locator('#moves button:enabled').first().click();await page.waitForFunction(()=>document.querySelector('#turnLog').children.length);
 await loc('show').click();await loc('seek').fill('35.5');assert.ok(!(await loc('message').innerText()).includes('Pikachu'));await loc('play').click();
 await select(151,'asPlayer');assert.equal(await loc('php').innerText(),(await loc('php').getAttribute('title')).split(' / ')[1].split(' ')[0]);const rival=await loc('cname').innerText();await page.reload();await page.waitForFunction(()=>window.__dioramaReady);assert.equal(await loc('pname').innerText(),'Mew');assert.equal(await loc('cname').innerText(),rival);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);console.log(width+'px: 151 entries; filter/search; solid preview/orbit; length, trainer, selection, combat, exhibition, reset and persistence passed'+(offline?' with network disabled':''));
 await page.close();
}}finally{await browser.close()}
