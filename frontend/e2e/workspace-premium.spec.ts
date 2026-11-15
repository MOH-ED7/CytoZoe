import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { isolate } from "./helpers";

test('Premium overview retains all 140 source-backed values and seven categorical visits', async ({page,request})=>{
  test.setTimeout(120000);
  const external=await isolate(page);
  const participants=await (await request.get('/api/participants')).json();
  let count=0;
  for(const p of participants){
    await page.goto(`/overview?participant=${p.participant_id}&sample=${encodeURIComponent(p.samples[0].visit)}`);
    await expect(page.getByRole('navigation',{name:'Historical visits'}).getByRole('button')).toHaveCount(p.samples.length);
    for(const sample of p.samples){
      await page.getByLabel('Visit (historical sample)').selectOption(sample.visit);
      const data=await (await request.get(`/api/health?participant=${p.participant_id}&sample=${encodeURIComponent(sample.visit)}`)).json();
      for(const ev of data.cards){
        const card=page.getByRole('article',{name:ev.measurement.marker_name,exact:true});
        await expect(card.locator('.metric-value')).toHaveText(String(ev.measurement.value));
        await expect(card).toContainText(ev.measurement.unit);
        await expect(card).toHaveClass(new RegExp(ev.measurement.needs_review?'is-flagged':'is-changed'));
        count++;
      }
      await expect(page.getByRole('region',{name:'Results Requiring Review'})).toContainText(`${data.cards.filter((c:any)=>c.measurement.needs_review).length} of 5 outside supplied range`);
    }
  }
  expect(count).toBe(140); expect(external).toEqual([]);
});

test('Premium pages: responsive, accessible, source totals, scale modes and final screenshots',async({page})=>{
  test.setTimeout(120000); const external=await isolate(page); const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  for(const width of [390,768,1024,1440]){
    await page.setViewportSize({width,height:900});
    for(const [name,path,ready] of [
      ['overview','/overview?participant=C001&sample=L-3','.metric-value'],
      ['radiation','/environment','.quality-strip'],
      ['reviews','/reviews','.export-count']]){
      await page.goto(path); await page.locator(ready).first().waitFor();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),`${name} ${width}`).toBeLessThanOrEqual(0);
      const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
      expect(axe.violations.map(v=>`${name} ${width}: ${v.id} ${v.nodes[0]?.target}`)).toEqual([]);
      await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`../docs/screenshots/premium-${name}-${width}.png`,fullPage:true});
    }
  }
  await page.goto('/environment');const strip=page.getByRole('region',{name:'Data quality summary'});
  for(const value of ['1,202','1,194','8','4 conflict groups','296.04','99.04%'])await expect(strip).toContainText(value);
  for(const scale of ['Linear scale','Log scale']){await page.getByRole('button',{name:scale,exact:true}).click();await expect(page.getByRole('button',{name:scale,exact:true})).toHaveAttribute('aria-pressed','true');}
  expect(errors).toEqual([]);expect(external).toEqual([]);
});
