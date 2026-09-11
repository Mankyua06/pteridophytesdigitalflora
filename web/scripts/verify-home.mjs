import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
const browser=await chromium.launch();
const page=await browser.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
 for (const width of [1440, 768, 390]) {
  await page.setViewportSize({width,height:900});
  await page.goto('http://127.0.0.1:3100/');
  await page.waitForFunction(()=>{const img=document.querySelector('.hero-photo img');return img?.complete && img.naturalWidth>0;});
  const title = await page.locator('.hero h1').boundingBox();
  const photo = await page.locator('.hero-photo').boundingBox();
  if(!title || !photo || photo.x <= title.x || photo.y >= title.y+title.height)throw Error('Cover must sit right of title at '+width);
  if(await page.locator('.taxon-row').count())throw Error('Unexpected initial results');
  if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw Error('Horizontal overflow at '+width);
  await page.getByRole('link',{name:'Contributors',exact:true}).waitFor({state:'visible'});
  await page.screenshot({path:`/tmp/fern-home-${width}.png`,fullPage:true});
 }
 await page.getByRole('link',{name:'Contributors',exact:true}).click();
 await page.getByText('Contributor information is being prepared.',{exact:true}).waitFor();
 if(errors.length)throw Error(errors.join('\n'));
 const report={cover_loaded:true,initial_results_hidden:true,widths_checked:[1440,768,390],contributors_empty_state:true,browser_errors:errors};
 await fs.mkdir('../reports/home-contributors',{recursive:true});
 await fs.writeFile('../reports/home-contributors/browser.json',JSON.stringify(report,null,2));
 console.log(report);
} finally {await browser.close();}
