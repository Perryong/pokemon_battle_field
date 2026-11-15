import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL || 'http://127.0.0.1:4181/';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
 args:['--use-angle=metal','--disable-renderer-backgrounding','--disable-background-timer-throttling']});
const errors=[];
async function page(url,party,width=1000){
 const p=await browser.newPage({reducedMotion:'reduce',viewport:{width,height:850}});
 p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(party=>localStorage.setItem('pokemon-battle-field.parties.v2',JSON.stringify([party,party])),party);
 await p.goto(url);await p.waitForFunction(()=>window.__dioramaReady);return p;
}
const team=[{id:150,moves:[94,129]},{id:25,moves:[85]}];
const weak=[{id:129,moves:[150],level:1}];
async function host(mode) {
 const p=await page(base,team,390);await p.locator('#tagOpen').click();
 await p.locator('#tagMode').selectOption(mode);await p.locator('#tagConnect').click();
 await p.locator('#tagLinks [data-side=ally]').waitFor();
 return p;
}
async function join(h,role,party) {
 const p=await page(await h.locator('#tagLinks [data-side='+role+']').inputValue(),party);
 await p.locator('#tagConnect').click();return p;
}
async function started(p) {
 await p.locator('#tagConsole').waitFor();await p.locator('#replayRate').selectOption('2');
 assert.equal(await p.locator('#tagField [data-seat]').count(),4);
 await p.waitForFunction(()=>window.__diorama.scene.getObjectsByProperty('visible',true).filter(o=>o.userData.dex && o.parent && o.parent.visible).length>=4);
}
async function same(pages){
 const sort=rows=>rows.sort((a,b)=>a.seat-b.seat);
 const snapshots=await Promise.all(pages.map(p=>p.locator('#tagField [data-seat]').evaluateAll(cards=>
   cards.map(c=>({seat:c.dataset.seat,id:c.querySelector('b').textContent,hp:c.querySelector('meter').value})))));
 for(const field of snapshots.slice(1))assert.deepEqual(sort(field),sort(snapshots[0]));
}
try{
 const solo=await page(base,team,390);
 await solo.context().setOffline(true);
 await solo.locator('#tagOpen').click();await solo.locator('#tagMode').selectOption('solo');
 await solo.locator('#tagRoster input').last().uncheck();
 // Reproducible CPU parties for a complete offline battle.
 await solo.evaluate(()=>{Math.random=()=>128.5/151;});
 await solo.getByRole('button',{name:'Start solo battle'}).click();await started(solo);
 assert.equal(await solo.locator('#tagHeading').textContent(),'Solo tag');
 assert.match(await solo.locator('#tagField [data-seat="2"]').textContent(),/CPU partner/);
 assert.equal(await solo.locator('#tagLinks input').count(),0);
 await solo.locator('[data-move="94"]').click();await solo.locator('[data-target="3"]').click();
 await solo.waitForFunction(()=>document.querySelector('#tagLog').children.length>0);
 for(let i=0;i<10;i++){
   await solo.waitForFunction(()=>document.querySelector('#tagMoves button:enabled') || document.querySelector('#tagPrompt').textContent.includes('wins!'));
   if((await solo.locator('#tagPrompt').textContent()).includes('wins!')) break;
   await solo.locator('[data-move="129"]').click();
 }
 assert.equal(await solo.locator('#tagPrompt').textContent(),'Blue team wins!');
 await solo.locator('#tagExit').click();assert.ok(await solo.locator('#singlesConsole').isVisible());
 await solo.locator('#tagOpen').click();await solo.locator('#tagConnect').click();await started(solo);
 assert.equal(await solo.locator('#tagRound').textContent(),'Turn 1');await solo.locator('#tagExit').click();
 const libraryKey='pokemon-battle-field.team-library.v1';
 const saved=JSON.stringify([{name:'Training squad',format:'gen1ou',party:[
   ...team,{id:143,moves:[34]},{id:131,moves:[58]},{id:129,name:'Fin',moves:[150]},{id:6,moves:[53]}]},
   {name:'Second squad',format:'gen1ou',party:[{id:25,name:'Scout',moves:[45]},{id:143,moves:[34]}]}]);
 await solo.evaluate(([key,value])=>localStorage.setItem(key,value),[libraryKey,saved]);
 await solo.locator('#tagOpen').click();
 await solo.locator('#tagPartnerSource').selectOption({label:'Training squad'});
 assert.equal(await solo.locator('#tagPartnerLead option').count(),7);
 await solo.locator('#tagPartnerLead').selectOption('1');
 assert.ok(await solo.locator('#tagConnect').isDisabled());
 await solo.locator('#tagPartnerLead').selectOption('4');await solo.locator('#tagPartnerFirst').selectOption('5');
 await solo.locator('#tagPartnerSecond').selectOption('');
 await solo.locator('#tagRoster input').last().uncheck();
 await solo.locator('#tagConnect').click();await started(solo);
 assert.match(await solo.locator('#tagField [data-seat="2"]').textContent(),/Magikarp/);
 await solo.locator('[data-move="94"]').click();await solo.locator('[data-target="1"]').click();
 await solo.waitForFunction(()=>document.querySelector('#tagLog').textContent.includes('Fin used Splash'));
 assert.equal(await solo.evaluate(key=>localStorage.getItem(key),libraryKey),saved);
 await solo.locator('#tagExit').click();await solo.locator('#tagOpen').click();
 await solo.locator('#tagPartnerSource').selectOption('dex');assert.ok(await solo.locator('#tagConnect').isDisabled());
 assert.equal(await solo.locator('#tagPartnerLead option').count(),152);
 await solo.locator('#tagPartnerLead').selectOption({label:'Dragonite'});
 await solo.locator('#tagMode').selectOption('coop');assert.ok(await solo.locator('#tagPartner').isHidden());
 await solo.locator('#tagMode').selectOption('solo');await solo.locator('#tagConnect').click();await started(solo);
 assert.match(await solo.locator('#tagField [data-seat="2"]').textContent(),/Dragonite/);
 assert.equal(await solo.locator('#tagField [data-seat="0"] b').textContent(),'Mewtwo');
 await solo.locator('#tagExit').click();await solo.locator('#tagOpen').click();
 await solo.locator('#tagOpponent1Source').selectOption({label:'Training squad'});
 await solo.locator('#tagOpponent1Lead').selectOption('4');await solo.locator('#tagOpponent1First').selectOption('5');
 await solo.locator('#tagOpponent1Second').selectOption('');
 await solo.locator('#tagOpponent2Source').selectOption('dex');
 assert.ok(await solo.locator('#tagConnect').isDisabled());
 await solo.locator('#tagMode').selectOption('versus');
 assert.ok(await solo.locator('#tagOpponent1').isHidden());assert.ok(await solo.locator('#tagConnect').isEnabled());
 await solo.locator('#tagMode').selectOption('solo');
 await solo.locator('#tagOpponent2Source').selectOption({label:'Second squad'});
 await solo.locator('#tagOpponent2First').selectOption('0');
 assert.ok(await solo.locator('#tagConnect').isDisabled());
 await solo.locator('#tagOpponent2First').selectOption('1');
 assert.equal(await solo.locator('#tagOpponent1Lead').inputValue(),'4');
 await solo.locator('#tagConnect').click();await started(solo);
 assert.equal(await solo.locator('#tagField [data-seat="1"] b').textContent(),'Magikarp');
 assert.equal(await solo.locator('#tagField [data-seat="3"] b').textContent(),'Pikachu');
 await solo.locator('#tagBench button').click();
 await solo.waitForFunction(()=>['Fin used Splash','Scout used Growl'].every(action=>document.querySelector('#tagLog').textContent.includes(action)));
 assert.equal(await solo.evaluate(key=>localStorage.getItem(key),libraryKey),saved);
 await solo.close();
 console.log('Two distinct saved opponents used their equipped moves in an offline solo tag battle.');
 console.log('Selected a saved teammate from six slots and verified its equipped move, then fielded a Pokédex pick offline.');
 console.log('Solo tag: offline start, CPU teammate, manual target, completed match and fresh restart.');
 const h=await host('coop'),a=await join(h,'ally',team);
 await Promise.all([h,a].map(started));
 await a.locator('#tagBench button').click();await h.locator('[data-move="94"]').click();
 await h.locator('[data-target="3"]').click();await h.waitForFunction(()=>document.querySelector('#tagLog').children.length>0);
 await a.waitForFunction(()=>document.querySelector('#tagLog').children.length>0);
 await same([h,a]);assert.match(await h.locator('#tagLog').textContent(),/Blue 2 sent out Pikachu/);
 await a.locator('#tagExit').click();await h.waitForFunction(()=>document.querySelector('#tagPrompt').textContent==='Connection closed.');
 await h.locator('#tagExit').click();assert.ok(await h.locator('#singlesConsole').isVisible());
 console.log('Co-op: two independent browsers, two AI trainers, targeted attack, partner switch and disconnect.');
 await h.close();await a.close();
 const home=await host('versus');
 const foe=await join(home,'foe',weak),partner=await join(home,'ally',team);
 const extra=await join(home,'ally',team);
 await extra.waitForFunction(()=>document.querySelector('#tagLobbyStatus').textContent.includes('full'));await extra.close();
 const last=await join(home,'foe',weak),all=[home,foe,partner,last];
 await Promise.all(all.map(started));
 for(const p of [foe,last]) await p.locator('[data-move="150"]').click();
 await partner.locator('[data-move="94"]').click();await partner.locator('[data-target="3"]').click();
 assert.equal(await home.locator('#tagLog li').count(),0);
 await home.locator('[data-move="129"]').click();
 for(const p of all) await p.waitForFunction(()=>document.querySelector('#tagPrompt').textContent==='Blue team wins!',{},{timeout:45000});
 await same(all);assert.ok(await home.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('Four-human 2v2: role-specific links, occupied-seat rejection, private choices, spread KO and synchronized victory on all four clients.');
}finally{await browser.close();}
