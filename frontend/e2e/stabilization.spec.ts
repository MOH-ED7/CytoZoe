import { expect, test } from '@playwright/test';
import { isolate } from './helpers';

test('Release stabilization: canonical click selection, transient previews, evidence and saved follow-up',async({page,request})=>{
  const external=await isolate(page);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('/health?participant=C001&sample=L-3&marker=creatinine');
  const selected=page.getByRole('region',{name:'Selected observation'});
  await expect(selected).toHaveCount(1);await expect(selected.locator('.trend-observation-value')).toHaveText('1.37mg/dL');
  await expect(selected).toContainText('Outside supplied range · above upper bound');
  const summary=await page.getByRole('region',{name:'Historical measurement summary'}).textContent();
  const plot=await page.locator('.trend-plot').boundingBox();
  await page.locator('[data-visit-point="R+1"]').click();
  const r1=await (await request.get('/api/health?participant=C001&sample=R%2B1')).json();
  const measurement=r1.cards.find((c:any)=>c.measurement.marker==='creatinine').measurement;
  await expect(selected.locator('.trend-observation-value')).toHaveText(`${measurement.value}${measurement.unit}`);
  await page.getByRole('heading',{level:1}).hover();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await expect(page.getByLabel('Visit (historical sample)')).toHaveValue('R+1');
  await expect(page).toHaveURL(/sample=R%2B1/);
  await expect(page.locator('[data-visit-point="R+1"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-visit-point="L-3"]').hover();
  await expect(page.getByRole('tooltip')).toContainText('TEMPORARY PREVIEW · NOT SELECTED');
  await expect(page.getByRole('tooltip')).toContainText('1.37');
  await expect(selected).toContainText('R+1 · Postflight');
  await expect(page.getByLabel('Visit (historical sample)')).toHaveValue('R+1');
  await expect(page).toHaveURL(/sample=R%2B1/);
  await selected.getByRole('button',{name:'Inspect Evidence',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Creatinine · C001 · R+1');
  await expect(page.getByRole('dialog')).toContainText(`${measurement.value} ${measurement.unit}`);
  await page.keyboard.press('Escape');
  await page.locator('[data-visit-point="L-3"]').click();
  await expect(selected.locator('.trend-observation-value')).toHaveText('1.37mg/dL');
  await expect(page.getByLabel('Visit (historical sample)')).toHaveValue('L-3');
  await expect(page).toHaveURL(/sample=L-3/);
  expect(await page.getByRole('region',{name:'Historical measurement summary'}).textContent()).toBe(summary);
  expect(Math.abs((await page.locator('.trend-plot').boundingBox())!.y-plot!.y)).toBeLessThanOrEqual(1);
  await selected.getByRole('button',{name:'Inspect Evidence',exact:true}).click();
  const drawer=page.getByRole('dialog');
  await expect(drawer).toHaveAccessibleName('Creatinine · C001 · L-3');
  await expect(drawer).toContainText('1.2367 mg/dL (n = 3)');await expect(drawer).toContainText('1.17 mg/dL (n = 2)');
  await drawer.getByLabel(/Reviewer note/).fill('Stabilization QA: selected L-3 evidence verified.');
  await drawer.getByRole('button',{name:/^Save (follow-up|changes)$/}).click();await expect(drawer.getByText(/Saved locally/)).toBeVisible();
  await page.keyboard.press('Escape');await expect(selected.getByRole('button',{name:'Update follow-up'})).toBeVisible();
  const other=page.locator('[data-visit-point="L-44"]');await other.focus();
  await expect(page.getByRole('tooltip')).toContainText('L-44');await expect(page.getByLabel('Visit (historical sample)')).toHaveValue('L-3');
  await other.press('Space');await expect(page.getByLabel('Visit (historical sample)')).toHaveValue('L-44');
  await page.getByRole('tab',{name:/^Sodium/}).click();await page.getByLabel('Participant (anonymised)').selectOption('C003');
  const expected=await (await request.get('/api/health?participant=C003&sample=L-44')).json();
  const sodium=expected.cards.find((c:any)=>c.measurement.marker==='sodium').measurement;
  await expect(selected).toContainText('C003');await expect(selected.locator('.trend-observation-value')).toHaveText(`${sodium.value}${sodium.unit}`);
  await page.goto('/health?participant=C001&sample=L-3&marker=creatinine');
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000});await expect(selected.locator('.trend-observation-value')).toHaveText('1.37mg/dL');
    await page.getByRole('heading',{level:1}).click();await page.evaluate(()=>scrollTo(0,0));
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(0);
    await page.screenshot({path:`../docs/screenshots/release-trends-${width}.png`,fullPage:true});
  }
  expect(errors).toEqual([]);expect(external).toEqual([]);
});

test('Release stabilization: factual compact Overview empty state and real flagged findings',async({page,request})=>{
  await isolate(page);await page.setViewportSize({width:1440,height:900});
  const participants=await (await request.get('/api/participants')).json();let empty:any;
  for(const p of participants){for(const sample of p.samples){const data=await (await request.get(`/api/health?participant=${p.participant_id}&sample=${encodeURIComponent(sample.visit)}`)).json();if(data.cards.every((c:any)=>!c.measurement.needs_review)){empty=data;break;}}if(empty)break;}
  expect(empty).toBeTruthy();await page.goto(`/overview?participant=${empty.participant_id}&sample=${encodeURIComponent(empty.visit)}`);
  const section=page.getByRole('region',{name:'Results Requiring Review'});
  await expect(section).toContainText(`0 of ${empty.cards.length} measurements outside supplied ranges. This does not assess overall health.`);
  await expect(section).toContainText(empty.participant_id);await expect(section).toContainText(empty.visit_label);
  await expect(section.locator('.empty')).toHaveCount(0);expect((await section.boundingBox())!.height).toBeLessThan(190);
  await page.screenshot({path:'../docs/screenshots/release-overview-empty-1440.png',fullPage:true});
  await page.goto('/overview?participant=C001&sample=L-3');await expect(section).toContainText('1 of 5 outside supplied range');
  await expect(section.getByRole('button',{name:'Inspect result: Creatinine'})).toBeVisible();
});
