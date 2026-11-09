// Exercise a slow renderer: exhibition playback should still track wall time.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=metal']});
try {
  const page=await browser.newPage({reducedMotion:'reduce'});
  await page.addInitScript(()=>{
    const raf=window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame=callback=>setTimeout(()=>raf(callback),230);
  });
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4181/');
  await page.waitForFunction(()=>window.__dioramaReady);
  await page.locator('#show').click();
  assert.equal(await page.locator('#replayRate').inputValue(),'1.5');
  for (const rate of [1.5,1,2]) {
    await page.locator('#replayRate').selectOption(String(rate));
    await page.locator('#seek').fill('43');
    const result=await page.evaluate(async()=>{
      const start=performance.now(), button=document.querySelector('#pause');
      button.click();await new Promise(r=>setTimeout(r,3400));button.click();
      return {elapsed:(performance.now()-start)/1000,progress:(Number(document.querySelector('#seek').value)+45-43)%45};
    });
    assert.ok(Math.abs(result.elapsed*rate-result.progress)<1,`rate ${rate}: ${JSON.stringify(result)}`);
    console.log(rate+'× advanced '+result.progress.toFixed(2)+' timeline seconds in '+result.elapsed.toFixed(2)+' real seconds.');
    const paused=await page.locator('#seek').inputValue();
    await page.waitForTimeout(400);assert.equal(await page.locator('#seek').inputValue(),paused);
  }
}finally{await browser.close();}
