import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test("a candidate signs in and lands in the candidate app", async ({ page }) => {
  await signIn(page, "anna@demo.se");
  await expect(page).toHaveURL(/\/candidate\/feed$/);
});

test("a company signs in and sees its trial status", async ({ page }) => {
  await signIn(page, "talent@acme.se");
  await expect(page).toHaveURL(/\/company\/dashboard$/);
  await expect(page.getByText(/Trial · \d+d left/)).toBeVisible();
});

test("each role is kept out of the other app", async ({ page }) => {
  await signIn(page, "anna@demo.se");
  await page.goto("/company/search");
  await expect(page).toHaveURL(/\/candidate\/feed$/);

  await page.getByRole("button", { name: "Sign out" }).click();
  await signIn(page, "talent@acme.se");
  await page.goto("/candidate/feed");
  await expect(page).toHaveURL(/\/company\/dashboard$/);
});

test("signed-out visitors are sent to sign-in", async ({ page }) => {
  await page.goto("/company/dashboard");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("the 11th wrong password in a row is rate limited", async ({ page }) => {
  const email = `brute-${Date.now()}@example.se`;
  for (let attempt = 1; attempt <= 11; attempt++) {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(`wrong-${attempt}`);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("form [role=alert]")).toHaveText(
      attempt <= 10 ? "Invalid email or password" : /Too many sign-in attempts/,
    );
  }
});
