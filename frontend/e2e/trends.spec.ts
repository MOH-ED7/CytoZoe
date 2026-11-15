import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { isolate } from "./helpers";

test("Trends: all 140 observations retain source values, independent points, bounds and URL selection", async ({ page, request }) => {
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
      await expect(page.locator(".trend-plot .recharts-line, .trend-plot .recharts-area")).toHaveCount(0);
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
    await page.screenshot({path:`../docs/screenshots/health-trends-dark-${width}.png`,fullPage:true});
  }
  expect(external).toEqual([]);
});
