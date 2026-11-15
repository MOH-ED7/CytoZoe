import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { isolate } from "./helpers";

test("Orbital landing: responsive local images, real navigation, mobile menu and offline workspace handoff", async ({ page }) => {
  const external = await isolate(page);
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("CytoZoeSpace HealthIntelligence.");
    await page.locator("footer").scrollIntoViewIfNeeded();
    const images = page.locator(".landing img");
    await expect(images).toHaveCount(4);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(el => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `../docs/screenshots/orbital-landing-${width}.png`, fullPage: true });
    const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(accessibility.violations.map(v=>`${width}: ${v.id}`)).toEqual([]);
    if (width === 390) {
      await page.getByRole("button", {name:"Open landing navigation"}).click();
      await expect(page.getByRole("navigation", {name:"Landing navigation"})).toBeVisible();
      await page.getByRole("navigation").getByRole("link",{name:"The science",exact:true}).click();
      await expect(page).toHaveURL(/#science$/);
      await expect(page.getByRole("button",{name:"Open landing navigation"})).toHaveAttribute("aria-expanded","false");
      await page.getByRole("button",{name:"Open landing navigation"}).click();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button",{name:"Open landing navigation"})).toBeFocused();
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("link", {name:"Explore the Science", exact:true}).click();
  await expect(page.getByRole("heading", {name:/Two real research cases/})).toBeInViewport();
  await page.getByRole("link", {name:"Enter CytoZoe Workspace"}).click();
  await expect(page.getByRole("heading", {name:"Health Overview",level:1})).toBeVisible();
  await expect(page.getByRole("article", {name:"Creatinine"})).toContainText("1.37");
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
