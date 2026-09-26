import { expect, test, type Browser, type Page } from "@playwright/test";

export const PASSWORD = "Passw0rd!";

/** Sign in through the real form and wait for the signed-in app shell. */
export async function signIn(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  // A real session renders the shell — exactly what the UntrustedHost bug broke.
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}

/** A second, independent browser session (own cookies) for two-sided flows. */
export async function newSession(browser: Browser, email: string) {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  const page = await context.newPage();
  await signIn(page, email);
  return page;
}

/** Rightmost edge of anything inside <main> — must stay within the viewport. */
export function rightmostEdge(page: Page) {
  return page.evaluate(() =>
    Math.max(...[...document.querySelectorAll("main *")].map((el) => el.getBoundingClientRect().right)),
  );
}
