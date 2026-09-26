import { expect, test } from "@playwright/test";
import { newSession, rightmostEdge, signIn } from "./helpers";

test("a candidate accepts an offer and the company sees the answer", async ({ page, browser }) => {
  await signIn(page, "anna@demo.se");
  await page.goto("/candidate/messages");
  const thread = page.locator("section");
  await expect(thread.getByText("Senior Fullstack Engineer — Checkout Platform")).toBeVisible();

  await thread.getByRole("button", { name: "Accept offer" }).click();
  await expect(thread.getByText("Accepted", { exact: true })).toBeVisible();
  await expect(thread.getByText(/Accepted your offer/)).toBeVisible();
  await expect(thread.getByRole("button", { name: "Accept offer" })).toHaveCount(0);

  const company = await newSession(browser, "talent@acme.se");
  await expect(company.getByText("1 accepted")).toBeVisible();
  await company.goto("/company/messages");
  await expect(company.locator("section").getByText("Accepted", { exact: true })).toBeVisible();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("the landing page and the app fit the screen, and Sign out is reachable", async ({ page }) => {
    await page.goto("/");
    expect(await rightmostEdge(page)).toBeLessThanOrEqual(390);

    await signIn(page, "anna@demo.se");
    await expect(page.getByRole("button", { name: "Sign out" })).toBeInViewport();
    await expect(page.getByRole("link", { name: "Messages" })).toBeInViewport();
    expect(await rightmostEdge(page)).toBeLessThanOrEqual(390);
  });
});

test("profile: an end date before the start date is caught at the field", async ({ page }) => {
  await signIn(page, "erik@demo.se");
  await page.goto("/candidate/profile");
  await page.getByText("+ Add experience").click();
  const form = page.locator("form", { has: page.getByLabel("Start date") });

  await form.getByLabel("Title").fill("Time Traveller");
  await form.getByLabel("Company").fill("Acme");
  await form.getByLabel("Start date").fill("2024-01-01");
  await form.getByLabel("End date").fill("2020-01-01");
  await form.getByRole("button", { name: "Add" }).click();
  expect(await form.getByLabel("End date").evaluate((el: HTMLInputElement) => el.validity.rangeUnderflow)).toBe(true);
  await expect(page.getByText("Time Traveller · Acme")).toHaveCount(0);

  await form.getByLabel("End date").fill("2025-06-30");
  await form.getByRole("button", { name: "Add" }).click();
  const item = page.getByText("Time Traveller · Acme");
  await expect(item).toBeVisible();

  // clean up: remove exactly this entry (its row = the title's grandparent)
  await item.locator("xpath=../..").getByRole("button", { name: "Remove" }).click();
  await expect(item).toHaveCount(0);
});
