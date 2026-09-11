// Explicit manual test for the user-provided local test release. Not a CI fixture.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from '@playwright/test';

const base=process.env.FERN_TEST_URL||'http://127.0.0.1:3100';
const expected=JSON.parse(await fs.readFile('public/data/taxa/TX000365.json','utf8'));
if(expected.images.length!==58)throw Error('This manual test expects the 58-photo TX000365 release.');
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
const report={taxon_id:'TX000365',release_id:expected.release_id,photos:58,variants_checked:0,loaded_thumbnails:0};
try{
  await page.goto(base+'/taxa');
  await page.getByRole('button',{name:'Browse taxonomy',exact:true}).click();
  await page.getByLabel('Order',{exact:true}).selectOption('Equisetales');
  const catalog = JSON.parse(await fs.readFile('public/data/catalog.json','utf8'));
  const taxa = Array.isArray(catalog) ? catalog : catalog.taxa;
  const scope = taxa.filter(t=>t.order==='Equisetales');
  const families = await page.getByLabel('Family',{exact:true}).locator('option').evaluateAll(els=>els.map(e=>e.value).filter(Boolean));
  if(JSON.stringify(families)!==JSON.stringify([...new Set(scope.map(t=>t.family).filter(Boolean))].sort()))throw Error('Family cascade mismatch');
  await page.getByLabel('Family',{exact:true}).selectOption(families[0]);
  const genera = await page.getByLabel('Genus',{exact:true}).locator('option').evaluateAll(els=>els.map(e=>e.value).filter(Boolean));
  if(JSON.stringify(genera)!==JSON.stringify([...new Set(scope.filter(t=>t.family===families[0]).map(t=>t.genus).filter(Boolean))].sort()))throw Error('Genus cascade mismatch');
  await page.getByLabel('Genus',{exact:true}).selectOption(genera[0]);
  await page.getByLabel('Order',{exact:true}).selectOption('Polypodiales');
  if(await page.getByLabel('Family',{exact:true}).inputValue() || await page.getByLabel('Genus',{exact:true}).inputValue())throw Error('Child filters did not reset');
  await page.getByLabel('Order',{exact:true}).selectOption('Equisetales');
  await page.getByRole('button',{name:'Search by name',exact:true}).click();
  report.cascading_filters=true;

  await page.getByLabel('Scientific name, Korean name, or synonym').fill('일엽초');
  const result=page.locator('a[href="/taxa/TX000365"]');
  if(!await result.isVisible())throw Error('Search result missing');
  await result.click();
  await page.waitForURL('**/taxa/TX000365');
  report.independent_name_search=true;
  if(await page.locator('.photo-button').count()!==0)throw Error('Basic page must not contain photos');
  await page.getByRole('link',{name:'Photos',exact:true}).click();
  await page.waitForURL('**/taxa/TX000365/photos');
  await page.waitForFunction(()=>document.querySelectorAll('.photo-button').length===58);
  if(await page.locator('.photo-button').count()!==58)throw Error('Not all 58 photos rendered');
  for(let index=0;index<58;index++){
    const button=page.locator('.photo-button').nth(index);
    await button.scrollIntoViewIfNeeded();
    await button.locator('img').waitFor();
    await page.waitForFunction(el=>el.complete && el.naturalWidth>0,await button.locator('img').elementHandle());
    report.loaded_thumbnails++;
  }
  for(const photo of expected.images){
    for(const [size,info] of Object.entries(photo.variants)){
      const response=await page.request.get(`${base}/local-images/${size}/${photo.image_id}`);
      if(response.status()!==200)throw Error('Local image failed: '+photo.image_id+'/'+size);
      if(createHash('sha256').update(await response.body()).digest('hex')!==info.sha256)throw Error('Image hash mismatch');
      report.variants_checked++;
    }
  }
  await page.getByRole('button',{name:'View photo IM000001',exact:true}).click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button',{name:'Large size',exact:true}).click();
  await page.waitForFunction(()=>{const im=document.querySelector('dialog img');return im?.complete&&im.naturalWidth>0;});
  await page.keyboard.press('ArrowLeft');
  if(!(await page.getByRole('dialog').innerText()).includes('58/58'))throw Error('Viewer did not wrap to last image');
  await page.keyboard.press('Escape');
  report.viewer_keyboard=true;
  await page.getByRole('heading',{name:'Photos',exact:true}).scrollIntoViewIfNeeded();
  const directory=path.resolve('../reports/TX000365-local-demo');
  await fs.mkdir(directory,{recursive:true});
  await page.screenshot({path:directory+'/photos-desktop.png'});
  await page.goto(base+'/taxa/TX000365/morphology');
  await page.locator('a[href="/taxa/TX000365/photos?node=MO0001&include=false"]').click();
  await page.getByRole('button',{name:'View photo IM000001',exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelectorAll('.photo-button').length===1);
  report.direct_node_photo_count=await page.locator('.photo-button').count();
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'/taxa/TX000365/photos');
  await page.getByRole('heading',{name:'Photos',exact:true}).scrollIntoViewIfNeeded();
  const firstMobileImage=page.locator('.photo-button img').first();
  await firstMobileImage.scrollIntoViewIfNeeded();
  await page.waitForFunction(el=>el.complete && el.naturalWidth>0,await firstMobileImage.elementHandle());
  report.mobile_thumbnail_loaded=true;
  if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw Error('Mobile horizontal overflow');
  await page.screenshot({path:directory+'/photos-mobile.png'});
  report.unknown_image_status=(await page.request.get(base+'/local-images/thumb/IM_UNKNOWN')).status();
  if(report.unknown_image_status!==404)throw Error('Unknown image must be unavailable');
  if(errors.length)throw Error(errors.join('\n'));
  report.browser_errors=errors;
  report.success=true;
  await fs.writeFile(directory+'/browser.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
