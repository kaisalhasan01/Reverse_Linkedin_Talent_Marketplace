import { expect, test } from "@playwright/test";
import { newSession, signIn } from "./helpers";

test("search ranks the best match first and never shows employed candidates", async ({ page }) => {
  await signIn(page, "hr@nordicsoft.se");
  await page.goto("/company/search?q=react+postgres");
  const names = page.locator("main p.font-semibold");
  await expect(names.first()).toHaveText("Anna Lindqvist");

  await page.goto("/company/search");
  await expect(page.getByText("9 candidates available")).toBeVisible();
  for (const employed of ["Lisa Öberg", "Karl Axelsson", "Gustav Lund"]) {
    await expect(page.getByText(employed)).toHaveCount(0);
  }
});

test("switching to Employed hides the candidate from companies at once", async ({ page, browser }) => {
  await signIn(page, "hr@nordicsoft.se");
  await page.goto("/company/search?q=react+postgres");
  await page.getByRole("link", { name: "View profile" }).first().click();
  await expect(page.getByRole("heading", { name: "Anna Lindqvist" })).toBeVisible();
  const profileUrl = page.url();

  const anna = await newSession(browser, "anna@demo.se");
  await anna.goto("/candidate/profile");
  await anna.getByRole("button", { name: "Switch to Employed" }).click();
  await expect(anna.getByText("You are hidden from company search.")).toBeVisible();

  try {
    await page.goto(profileUrl);
    await expect(page.getByRole("heading", { name: "This profile isn't available" })).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/employed|Anna/i); // reveals nothing
    await page.goto("/company/search?q=react+postgres");
    await expect(page.getByText("Anna Lindqvist")).toHaveCount(0);
  } finally {
    await anna.getByRole("button", { name: "Switch to Looking for work" }).click();
    await expect(anna.getByText("Companies can find and message you.")).toBeVisible();
  }
});

test("an invalid offer explains why and keeps the recruiter's text", async ({ page }) => {
  await signIn(page, "hr@nordicsoft.se");
  await page.goto("/company/search?q=react+postgres");
  await page.getByRole("link", { name: "View profile" }).first().click();

  await page.getByLabel("Message").fill("Hi Anna, a concrete offer inside!");
  await page.getByLabel("Role title").fill("Staff Engineer");
  await page.getByLabel("Salary min (SEK/mo)").fill("90000");
  await page.getByLabel("Salary max (SEK/mo)").fill("60000");
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.locator("form [role=alert]")).toHaveText(/Minimum salary can't be above the maximum/);
  await expect(page.getByLabel("Message")).toHaveValue("Hi Anna, a concrete offer inside!");
});

test("an ended trial locks search and hides candidate names", async ({ page }) => {
  await signIn(page, "talent@oldtown.example");
  await expect(page.getByText("Trial ended").first()).toBeVisible();
  await expect(page.locator("main")).toContainText("Your free trial has ended");
  await expect(page.getByText("Anna Lindqvist")).toHaveCount(0);

  await page.goto("/company/search?q=react");
  await expect(page).toHaveURL(/\/company\/billing\?locked=1$/);
  await expect(page.getByRole("status")).toContainText("Your free trial has ended");
});
