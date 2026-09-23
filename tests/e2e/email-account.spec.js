import { test, expect } from "@playwright/test";

test("email signup, recovery and login are visible without Google", async ({ page }) => {
  let signed = false;
  const requests = [];
  await page.route("**/api/account", route => route.fulfill({ json: {
    user: signed ? { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Estudante", email: "pessoa@example.test" } : null,
    googleEnabled: false, emailEnabled: true
  } }));
  await page.route("**/api/progress", route => route.fulfill({ json: {} }));
  await page.route("**/api/auth/email/**", route => {
    requests.push({ path: new URL(route.request().url()).pathname, body: route.request().postDataJSON() });
    if (route.request().url().endsWith("/login")) signed = true;
    return route.fulfill({ json: route.request().url().endsWith("/signup") ? { message: "Confirme seu e-mail." } : { message: "Se houver uma conta, enviaremos um link." } });
  });
  await page.goto("/#/settings");
  await expect(page.locator("#email-account-form")).toBeVisible();
  await expect(page.locator("#google-login")).toHaveCount(0);
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await page.locator("#account-email").fill("pessoa@example.test");
  await page.locator("#account-password").fill("password123");
  await page.locator("#email-submit").click();
  await expect(page.locator("#account-feedback")).toContainText("Confirme seu e-mail");
  expect(requests.at(-1)).toEqual({ path: "/api/auth/email/signup", body: { email: "pessoa@example.test", password: "password123" } });
  await page.locator("#email-recover-toggle").click();
  await page.locator("#email-recover-form button").click();
  await expect(page.locator("#account-feedback")).toContainText("enviaremos um link");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.locator("#account-password").fill("password123");
  await page.locator("#email-submit").click();
  await expect(page.locator(".account-panel")).toContainText("Estudante");
  expect(requests.at(-1).path).toBe("/api/auth/email/login");
});

test("confirmation links clear tokens from the URL before opening the account", async ({ page }) => {
  let signed = false;
  await page.route("**/api/account", route => route.fulfill({ json: {
    user: signed ? { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Estudante", email: "pessoa@example.test" } : null,
    emailEnabled: true, googleEnabled: false
  } }));
  await page.route("**/api/progress", route => route.fulfill({ json: {} }));
  await page.route("**/api/auth/email/complete", route => {
    expect(route.request().postDataJSON().refreshToken).toBe("r".repeat(40));
    signed = true;
    return route.fulfill({ json: { user: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" } } });
  });
  await page.goto("/#access_token=aaa.bbb.ccc&refresh_token=" + "r".repeat(40) + "&type=signup");
  await expect(page).toHaveURL(/#\/settings\/email-confirmed$/);
  await expect(page.locator(".account-panel")).toContainText("E-mail confirmado");
  expect(page.url()).not.toContain("access_token");
});
