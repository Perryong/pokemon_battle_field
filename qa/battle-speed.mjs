// Two Splash users produce the same two attack animations every turn.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';

const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=metal']});
try {
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'no-preference'});
  await page.addInitScript(()=>{
    const magikarp={id:129,moves:[150]};
    localStorage.setItem('pokemon-battle-field.parties.v2',JSON.stringify([[magikarp],[magikarp]]));
    const raf=window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame=callback=>setTimeout(()=>raf(callback),160);
  });
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4181/');
  await page.waitForFunction(()=>window.__dioramaReady);
  const speed=page.getByRole('combobox',{name:'Speed',exact:true});
  assert.equal(await speed.inputValue(),'1.5');
  await page.locator('#moves button:enabled').first().waitFor();
  for (const [rate,change] of [[1,false],[1.5,false],[2,false],[1,true]]) {
    await speed.selectOption(String(rate));
    const {elapsed,changedAt,entries}=await page.evaluate(change=>new Promise(resolve=>{
      const move=document.querySelector('#moves button');
      const count=document.querySelector('#turnLog').children.length;
      const start=performance.now();
      let changedAt=0;
      const observer=new MutationObserver(()=>{
        if (move.disabled) return;
        observer.disconnect();
        resolve({elapsed:(performance.now()-start)/1000,changedAt,entries:document.querySelector('#turnLog').children.length-count});
      });
      observer.observe(move,{attributes:true,attributeFilter:['disabled']});
      move.click();
      if (change) setTimeout(()=>{
        changedAt=(performance.now()-start)/1000;
        const select=document.querySelector('#replayRate');
        select.value='2';select.dispatchEvent(new Event('change'));
      },700);
    }),change);
    const expected=change ? changedAt+(3.7-changedAt)/2 : 3.7/rate;
    assert.equal(entries,2);assert.ok(Math.abs(expected-elapsed)<.65,`rate ${rate}, expected ${expected}, saw ${elapsed}`);
    console.log((change?'1× → 2×':rate+'×')+' completed both attack animations in '+elapsed.toFixed(2)+' s.');
  }
  await page.locator('#show').click();assert.equal(await speed.inputValue(),'2');
  await page.locator('#play').click();assert.equal(await speed.inputValue(),'2');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
} finally { await browser.close(); }
