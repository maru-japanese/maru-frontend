import { test, expect } from "@playwright/test";
import { NAVIGATION, RESOURCES, PRACTICE_TOOLS } from "../../frontend/assets/js/core/navigation.js";

test("visible destinations lead to every resource and show its navigation context", async ({ page }) => {
  await page.goto("/#/home");
  await expect(page.locator('.sidebar nav .nav-link')).toHaveCount(NAVIGATION.length);
  await expect(page.locator('.sidebar nav .nav-link')).toHaveText(NAVIGATION.map(item => item.title), { useInnerText: true });
  for (const item of [...PRACTICE_TOOLS, ...RESOURCES]) {
    const hub = PRACTICE_TOOLS.includes(item) ? "practice" : "explore";
    await page.goto("/#/" + hub);
    await page.locator("main").getByRole("link", { name: item.title, exact: true }).click();
    await expect(page).toHaveURL(new RegExp("/#/" + item.route + "$"));
    await expect(page.locator('main h1')).toBeVisible();
    const section = NAVIGATION.some(nav => nav.route === item.route) ? item.route : hub;
    await expect(page.locator('.sidebar nav .is-active')).toHaveAttribute("data-nav", section);
    if (section === hub) {
      await expect(page.locator('#current-parent')).toHaveAttribute("href", "#/" + hub);
      await page.locator('#current-parent').click();
      await expect(page).toHaveURL(new RegExp("/#/" + hub + "$"));
    }
  }
});

test("home shows the learning, practice and printable paths", async ({ page }) => {
  await page.goto('/#/home');
  await expect(page.locator('.discovery-map-card')).toHaveCount(3);
  await expect(page.locator('.discovery-map-link')).toHaveCount(14);
  await expect(page.getByRole('link', { name: 'Livro 1 completo' })).toHaveAttribute('href', '#/worksheets/book');
  await expect(page.getByRole('link', { name: 'Para professores', exact: true }).last()).toHaveAttribute('href', '#/teacher');
});

test("resource search combines categories, ignores accents and keeps its state on return", async ({ page }) => {
  await page.goto("/#/explore");
  await expect(page.locator('.hub-card')).toHaveCount(10);
  await page.getByRole('button', { name: 'Materiais de apoio', exact: true }).click();
  await page.locator('#resource-search').fill('impressao');
  await expect(page.locator('.hub-card')).toHaveCount(1);
  await page.getByRole('link', { name: 'Atividades para imprimir', exact: true }).click();
  await expect(page.locator('.paper-row')).toHaveCount(20);
  await page.goBack();
  await expect(page.locator('#resource-search')).toHaveValue('impressao');
  await expect(page.getByRole('button', { name: 'Materiais de apoio', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#resource-search').fill('nada-com-este-nome');
  await expect(page.locator('.hub-empty')).toBeVisible();
  await page.getByRole('button', { name: 'Limpar filtros', exact: false }).click();
  await expect(page.locator('.hub-card')).toHaveCount(10);
  await expect(page.locator('#resource-search')).toBeFocused();
  await page.locator('#resource-search').fill('girias');
  await expect(page.locator('.hub-card')).toHaveCount(1);
  await expect(page.locator('.hub-card')).toContainText('Expressões e gírias');
});

test("teachers can share a public curated path and its printable book", async ({ page }) => {
  await page.goto('/#/teacher');
  await expect.poll(()=>page.locator('.teacher-art').evaluate(image=>image.complete && image.naturalWidth>0)).toBe(true);
  await expect(page.locator('.teacher-art')).toHaveCSS('mix-blend-mode','normal');
  await expect(page.locator('.illustration-credit')).toContainText('Irasutoya');
  await expect(page.locator('#teacher-link')).toHaveValue(/#\/package\/module-start$/);
  await page.locator('#teacher-topic').selectOption('theme-travel');
  await expect(page.locator('#teacher-preview .teacher-lesson-list li')).toHaveCount(3);
  const link = await page.locator('#teacher-link').inputValue();
  await page.goto(link);
  await expect(page.locator('main h1')).toHaveText('Uma viagem, um encontro de cada vez');
  await expect(page.getByRole('link',{name:/Abrir o conteúdo/})).toHaveAttribute('href','#/themes/travel');
  await page.getByRole('link',{name:/Imprimir o Livro 1/}).click();
  await expect(page.locator('#worksheet-kind')).toHaveValue('book');
});

test("hubs fit both modes; the mobile drawer fits and traps keyboard focus", async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  for (const theme of ['dojo', 'arcade', 'heisei']) {
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 740 });
      for (const route of ['home', 'practice', 'explore']) {
        await page.goto('/#/' + route);
        await page.locator('main h1').waitFor();
        await page.evaluate(theme => document.querySelector('[data-theme-choice="' + theme + '"]').click(), theme);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        if (width <= 820) {
          await page.locator('#menu-button').click();
          await expect(page.locator('.sidebar .nav-link.is-active')).toBeFocused();
          await expect(page.locator('.app-body')).toHaveAttribute('inert', '');
          expect(await page.locator('.sidebar').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
          await page.locator('.profile-link').focus();
          await page.keyboard.press('Tab');
          await expect(page.locator('.sidebar .brand')).toBeFocused();
          await page.keyboard.press('Shift+Tab');
          await expect(page.locator('.profile-link')).toBeFocused();
          await page.locator('#menu-close').click();
          await expect(page.locator('#menu-button')).toBeFocused();
          await expect(page.locator('.sidebar')).toHaveAttribute('inert', '');
        }
      }
    }
  }
  expect(errors).toEqual([]);
});

test("the Dojo is light, illustrations move and reduced motion disables decoration", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#/home');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(248, 247, 243)');
  await expect(page.locator('.art-main')).toHaveCSS('animation-name', 'ink-float');
  await expect(page.locator('.art-sun')).toHaveCSS('animation-name', 'ink-breathe');
  await page.goto('/#/placement');
  await page.getByRole('button', { name: 'Encontrar meu começo', exact: false }).click();
  await page.locator('input[name="answer"]').first().check();
  const headingTop = await page.locator('.session-heading').evaluate(el => el.getBoundingClientRect().top);
  await page.getByRole('button', { name: 'Registrar resposta', exact: true }).click();
  expect(await page.locator('.session-heading').evaluate(el => el.getBoundingClientRect().top)).toBeCloseTo(headingTop, 0);
  await page.goto('/#/home');
  for (const theme of ['dojo', 'arcade']) {
    await page.evaluate(theme => document.querySelector('[data-theme-choice="' + theme + '"]').click(), theme);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.art-main')).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.art-sun')).toHaveCSS('animation-name', 'none');
    await page.goto('/#/practice');
    await expect(page.locator('.hub-card').first()).toHaveCSS('animation-name', 'none');
    await page.goto('/#/home');
  }
});
