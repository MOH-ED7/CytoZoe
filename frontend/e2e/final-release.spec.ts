import { expect, test } from "@playwright/test";
import { isolate } from "./helpers";

test("Final overview: progressive disclosure, visit navigation, drawer and export error recovery", async ({ page }) => {
  const external = await isolate(page);
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/overview?participant=C001&sample=L-3");
  await expect(page.locator(".metric")).toHaveCount(5);
  await expect(page.locator(".brief")).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Historical visits" }).getByRole("button")).toHaveCount(7);
  await page.screenshot({ path: "../docs/screenshots/final-overview.png", fullPage: true });
  await page.getByRole("button", { name: "Inspect Creatinine evidence" }).click();
  await expect(page.getByRole("dialog")).toContainText("1.2367 mg/dL (n = 3)");
  await page.screenshot({ path: "../docs/screenshots/final-evidence.png", fullPage: true });
  await page.keyboard.press("Escape");
  await page.getByRole("navigation", { name: "Historical visits" }).getByRole("button", { name: "R+1", exact: true }).click();
  await expect(page).toHaveURL(/sample=R%2B1/);
  await page.goto("/reviews");
  await page.route("**/api/export?format=html", r => r.fulfill({ status: 503, body: "Unavailable" }));
  await page.getByRole("button", { name: "Download HTML" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Download failed" })).toBeVisible();
  await page.unroute("**/api/export?format=html");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download HTML" }).click();
  expect((await download).suggestedFilename()).toBe("cytozoe-review-packet.html");
  await expect(page.getByRole("status").filter({ hasText: "HTML packet prepared" })).toBeVisible();
  await page.screenshot({ path: "../docs/screenshots/final-export.png", fullPage: true });
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const path of ["/overview", "/health", "/environment", "/reviews"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
