import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { isolate } from "./helpers";

test("Trends: all 140 observations retain source values, actual points, linear visual guides, per-visit bounds and URL selection", async ({ page, request }) => {
  test.setTimeout(120000);
  const external = await isolate(page);
  const participants = await (await request.get("/api/participants")).json();
  const markers = ["glucose", "sodium", "potassium", "creatinine", "calcium"];
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  let checked = 0;
  for (const p of participants) {
    await page.goto(`/health?participant=${p.participant_id}&sample=L-3&marker=glucose`);
    for (const marker of markers) {
      const trend = await (await request.get(`/api/health/trend?participant=${p.participant_id}&marker=${marker}`)).json();
      await page.getByRole("tab", { name: new RegExp(`^${trend.marker_name}`) }).click();
      await expect(page.locator("[data-visit-point]")).toHaveCount(7);
      for (const point of trend.points) {
        const dot = page.locator(`[data-visit-point="${point.visit}"]`);
        await expect(dot).toHaveAttribute("data-value", String(point.value));
        await dot.focus();
        await expect(page.getByRole("tooltip")).toContainText(point.visit_label);
        await dot.press("Enter");
        await expect(page.getByRole("region", {name:"Selected observation"}).locator(".trend-observation-value")).toHaveText(`${point.value}${trend.unit}`);
        await expect(dot).toHaveAttribute("aria-pressed", "true");
        expect(new URL(page.url()).searchParams.get("sample")).toBe(point.visit);
        checked++;
      }
      await expect(page.locator(".trend-plot .recharts-line")).toHaveCount(1);
      await expect(page.locator(".trend-plot .recharts-area")).toHaveCount(0);
      const line = page.locator(".trend-plot .recharts-line-curve");
      const path = await line.getAttribute("d");
      expect(path).not.toMatch(/[CQ]/); // straight SVG segments, never splines
      const summary = page.getByRole("region", {name:"Historical measurement summary"});
      const values = trend.points.map((p:any)=>p.value).filter((v:any)=>v!==null);
      await expect(summary).toContainText(`${Math.min(...values)}–${Math.max(...values)}`);
      await expect(summary).toContainText(`${trend.points.filter((p:any)=>p.needs_review).length} of ${trend.points.length} visits`);
      await expect(page.locator('[data-phase-separator]')).toHaveCount(1);
      if (!trend.bounds_consistent) {
        await expect(page.locator('[data-visit-range]')).toHaveCount(trend.points.length);
        for (const point of trend.points) {
          await expect(page.locator(`[data-visit-range="${point.visit}"]`)).toHaveAttribute("data-low",String(point.range_low));
          await expect(page.locator(`[data-visit-range="${point.visit}"]`)).toHaveAttribute("data-high",String(point.range_high));
        }
      }
      if (!trend.bounds_consistent) await expect(page.locator(".recharts-scatter")).toHaveCount(3); // per-visit low/high caps + observations
    }
  }
  expect(checked).toBe(140); expect(errors).toEqual([]); expect(external).toEqual([]);
});

test("Trends: dark layout, disclosures, keyboard points, evidence baselines and responsive access", async ({ page }) => {
  const external = await isolate(page);
  await page.goto("/health?participant=C001&sample=L-3&marker=creatinine");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Baseline comparison", {exact:false})).toBeHidden();
  await expect(page.locator(".trend-disclosure").first()).not.toHaveAttribute("open");
  const plot = await page.locator('.trend-plot').boundingBox();
  const callout = await page.locator('.trend-observation').boundingBox();
  expect(callout!.y + callout!.height).toBeLessThanOrEqual(plot!.y);
  await expect(page.getByRole('region',{name:'Selected observation'})).toHaveCount(1);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  const dot = page.locator('[data-visit-point="L-3"]');
  await dot.focus(); await dot.press("ArrowRight");
  await expect(page.locator('[data-visit-point="R+1"]')).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-visit-point="R+1"]')).toHaveAttribute("aria-pressed","true");
  await page.getByLabel("Visit (historical sample)").selectOption("L-3");
  await page.getByRole("button",{name:"Inspect Evidence",exact:true}).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toContainText("1.2367 mg/dL (n = 3)");
  await expect(drawer).toContainText("1.17 mg/dL (n = 2)");
  await expect(drawer).toContainText("Data row 1 (file line 2)");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button",{name:"Inspect Evidence",exact:true})).toBeFocused();
  await page.getByText("Baseline & Methodology",{exact:true}).click();
  await expect(page.locator(".baseline-tile.replay")).toContainText("1.17 mg/dL");
  await page.getByText("Baseline & Methodology",{exact:true}).click();
  for (const width of [390,768,1024,1440]) {
    await page.setViewportSize({width,height:900});
    await page.locator(".trend-observation-value").waitFor();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(0);
    const axe = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]).analyze();
    expect(axe.violations.map(v=>`${width}: ${v.id} ${v.nodes[0]?.target}`)).toEqual([]);
    await page.evaluate(() => scrollTo(0,0));
    await page.screenshot({path:`../docs/screenshots/health-trends-analysis-${width}.png`,fullPage:true});
  }
  expect(external).toEqual([]);
});


test('Trends: missing observations break visual guides and hover does not change selection', async ({page})=>{
  await isolate(page);
  await page.route('**/api/health/trend?**', async route=>{
    const response = await route.fetch();const data = await response.json();
    data.points[3].value=null;data.points[3].needs_review=false;data.points[3].range_status='UNKNOWN';
    await route.fulfill({response,json:data});
  });
  await page.goto('/health?participant=C001&sample=L-3&marker=creatinine');
  await expect(page.locator('[data-visit-point]')).toHaveCount(6);
  const path=await page.locator('.trend-plot .recharts-line-curve').getAttribute('d');
  expect(path!.match(/M/g)).toHaveLength(2); // actual missing sample creates two disconnected paths
  await page.locator('[data-visit-point="L-92"]').hover();
  await expect(page.getByRole('tooltip')).toContainText('L-92');
  await expect(page.locator('[data-visit-point="L-3"]')).toHaveAttribute('aria-pressed','true');
  await page.getByRole('heading',{level:1}).hover();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await expect(page.getByRole('region',{name:'Selected observation'})).toContainText('1.37');
});
