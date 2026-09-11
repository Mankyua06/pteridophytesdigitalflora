import { chromium } from '@playwright/test';
const browser=await chromium.launch();
const page=await browser.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
  for(const language of ['en','ko']) {
    await page.context().addCookies([{name:'fern-language',value:language,url:'http://127.0.0.1:3100/'}]);
    for(const width of [1440,768,390]) {
      await page.setViewportSize({width,height:900});
      await page.goto('http://127.0.0.1:3100/');
      await page.waitForFunction(()=>{const img=document.querySelector('.hero-photo img');return img?.complete && img.naturalWidth>0;});
      if(await page.locator('html').getAttribute('lang')!==language)throw Error('Wrong language');
      const title=await page.locator('.hero h1').boundingBox(),photo=await page.locator('.hero-photo').boundingBox();
      if(!title||!photo||photo.x<=title.x||photo.y>=title.y+title.height)throw Error('Cover position');
      if(await page.locator('.taxon-row,.stats').count())throw Error('Homepage lists/totals visible');
      if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw Error('Homepage overflow');
      await page.screenshot({path:`/tmp/fern-bilingual-home-${language}-${width}.png`,fullPage:true});
      await page.goto('http://127.0.0.1:3100/statistics');
      if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw Error('Statistics overflow');
      if(await page.locator('[data-rank="taxa"] .coverage-donut span').textContent()!=='1 / 400')throw Error('Unexpected live coverage');
      await page.screenshot({path:`/tmp/fern-bilingual-statistics-${language}-${width}.png`,fullPage:true});
      await page.goto('http://127.0.0.1:3100/contributors');
      const leads=await page.locator('section[aria-labelledby="lead-researchers"] .contributor-card h3').allTextContents();
      const researchers=await page.locator('section[aria-labelledby="researchers"] .contributor-card h3').allTextContents();
      if(JSON.stringify(leads)!==JSON.stringify(['김형태','김정성'])||JSON.stringify(researchers)!==JSON.stringify(['박상희']))throw Error('Researcher groups incorrect');
      if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw Error('Contributors overflow');
      await page.screenshot({path:`/tmp/pteridophyte-contributors-${language}-${width}.png`,fullPage:true});
    }
  }
  await page.goto('http://127.0.0.1:3100/gallery');
  await page.getByLabel('사진 분류군',{exact:true}).selectOption('TX000365');
  await page.locator('.photo-button').first().waitFor();
  await page.getByRole('button',{name:'영어로 전환'}).click();
  await page.getByRole('button',{name:'Switch to Korean'}).waitFor();
  if(await page.getByLabel('Photo taxon',{exact:true}).inputValue()!=='TX000365')throw Error('Taxon selection lost');
  if(await page.locator('.photo-button').count()!==58)throw Error('Expected 58 photos');
  if(errors.length)throw Error(errors.join('\n'));
  console.log(JSON.stringify({languages:['en','ko'],widths:[1440,768,390],cover_right_of_title:true,no_overflow:true,covered_taxa:'1/400',gallery_selection_preserved:true,photos:58,browser_errors:errors}));
} finally {await browser.close();}
