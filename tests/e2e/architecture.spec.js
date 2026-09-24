import { test, expect } from "@playwright/test";
import { PLACEMENT_QUESTIONS } from "../../shared/placement.js";
import { normalizeSnapshot } from "../../shared/progress.js";

const saved = page => page.evaluate(()=>JSON.parse(localStorage.getItem("maru-learning-v2")));
async function answer(page, question, correct=true) {
  if (correct) {
    await page.locator('input[name="answer"][value="'+question.answer+'"]').check();
    await page.getByRole("button",{name:"Registrar resposta",exact:true}).click();
  } else await page.getByRole("button",{name:"Ainda não sei",exact:true}).click();
  const next=page.locator('[data-placement="next"]');
  if(await next.count())await next.click();
}
test("placement resumes, preserves XP, accepts a suggestion and can be reset",async({page})=>{
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/home");
  await page.locator("#welcome-goal").selectOption("10");
  await page.reload();
  await expect(page.locator("#welcome-goal")).toHaveValue("10");
  await expect(page.locator(".goal-ring")).toContainText("/10");
  await page.getByRole("link",{name:"Já sei um pouco",exact:false}).click();
  await page.getByRole("button",{name:"Encontrar meu começo",exact:false}).click();
  await answer(page,PLACEMENT_QUESTIONS[0]);
  await answer(page,PLACEMENT_QUESTIONS[1]);
  await page.reload();
  await expect(page.locator(".session-heading")).toContainText("3 / 15");
  for(const question of PLACEMENT_QUESTIONS.slice(2))await answer(page,question);
  await expect(page.locator(".placement-result")).toContainText("Japonês no dia a dia");
  const p=await saved(page);
  expect(p.xp.total).toBe(0);expect(p.lessons).toEqual({});expect(p.activity).toEqual({});expect(p.reviews).toEqual({});
  await page.getByRole("button",{name:"Começar pela etapa sugerida",exact:false}).click();
  await expect(page.locator(".journey-module[open]")).toContainText("Sugerido para você");
  await expect(page.locator(".journey-module[open]")).toContainText("Japonês no dia a dia");
  await expect(page.locator(".journey-summary")).toContainText("0 de 37");
  await page.goto("/#/settings");
  await page.getByRole("link",{name:"Refazer diagnóstico",exact:true}).click();
  await page.getByRole("button",{name:"Refazer diagnóstico",exact:true}).click();
  await expect(page.locator(".session-heading")).toContainText("1 / 15");
  expect((await saved(page)).placement.acceptedModule).toBe("everyday");
  expect((await saved(page)).xp.total).toBe(0);
});

test("not knowing is a useful answer and manually choosing a stage remains reversible",async({page})=>{
  await page.goto("/#/placement");
  await page.getByRole("button",{name:"Encontrar meu começo",exact:false}).click();
  for(const question of PLACEMENT_QUESTIONS)await answer(page,question,false);
  await expect(page.locator(".placement-result")).toContainText("Primeiros passos");
  await page.locator("#placement-module").selectOption("katakana");
  await page.getByRole("button",{name:"Usar esta etapa",exact:true}).click();
  await expect(page.locator(".journey-module[open]")).toContainText("Explore katakana");
  expect((await saved(page)).lessons).toEqual({});
  await page.goto("/#/lesson/welcome");
  await expect(page.locator(".lesson-content")).toBeVisible();
});

test("thematic sentence links open the correct exercise; lesson capsules are explained",async({page})=>{
  await page.goto("/#/themes/travel");
  await page.locator('a[href="#/sentences/station"]').click();
  await expect(page.locator(".sentence-prompt")).toContainText("Onde fica a estação");
  await page.goto("/#/lesson/daily-order");
  for(let i=0;i<8 && !(await page.locator(".culture-capsule").count());i++)await page.locator('[data-lesson="next"]').click();
  await expect(page.locator(".culture-capsule")).toContainText("いただきます");
  await expect(page.locator(".culture-capsule")).toContainText("Não é uma tradução literal");
});

test("home and account have no financial support links or configuration request",async({page})=>{
  const requests=[];
  page.on("request",request=>{if(request.url().endsWith("/api/config"))requests.push(request.url());});
  for(const route of ["home","settings"]){
    await page.goto("/#/"+route);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.getByRole("link",{name:/Apoie|Apoiar/})).toHaveCount(0);
    await expect(page.locator('a[href="#/support"]')).toHaveCount(0);
  }
  expect(requests).toEqual([]);
});

test("the new routes and full hero seal fit both modes, including 320px phones",async({page})=>{
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  for(const theme of ["dojo","arcade"]){
    for(const width of [1440,768,390,320]){
      await page.setViewportSize({width,height:1000});
      await page.goto("/#/home");
      await page.evaluate(theme=>document.querySelector('[data-theme-choice="'+theme+'"]').click(),theme);
      if(width<=820)await expect.poll(()=>page.locator(".sidebar").evaluate(el=>el.getBoundingClientRect().right),{message:"Closed mobile menu stays outside the page"}).toBeLessThanOrEqual(0);
      const contained=await page.evaluate(()=>{
        const hero=document.querySelector(".welcome-card").getBoundingClientRect();
        const seal=document.querySelector(".art-sun").getBoundingClientRect();
        const char=document.querySelector(".art-main").getBoundingClientRect();
        return [seal,char].every(r=>r.left>=hero.left && r.right<=hero.right && r.top>=hero.top && r.bottom<=hero.bottom);
      });
      expect(contained,theme+" seal at "+width).toBe(true);
      for(const route of ["placement","themes","themes/travel","settings","journey"]){
        await page.goto("/#/"+route);
        await expect(page.locator("main h1")).toBeVisible();
        expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),theme+" "+route+" at "+width).toBe(false);
      }
    }
  }
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/#/home");
  await page.evaluate(()=>document.querySelector('[data-theme-choice="arcade"]').click());
  expect(await page.evaluate(()=>getComputedStyle(document.body,"::before").display)).toBe("none");
  expect(errors).toEqual([]);
});

test("account migration and sign-out keep guest and account caches separate",async({page})=>{
  const id="a1234567-1234-1234-1234-123456789abc";
  let signed=true;
  let remote=normalizeSnapshot({xp:{total:90},lessons:{sounds:{completedAt:20}},updatedAt:20});
  await page.addInitScript(()=>{
    if(!localStorage.getItem("maru-learning-v2"))localStorage.setItem("maru-learning-v2",JSON.stringify({xp:{total:30},lessons:{welcome:{completedAt:10}},updatedAt:10}));
  });
  await page.route("**/api/account",route=>route.fulfill({json:{user:signed?{id,name:"Pessoa",email:"pessoa@example.test"}:null,googleEnabled:false,emailEnabled:true}}));
  await page.route("**/api/progress",async route=>{
    if(route.request().method()==="PUT")remote=route.request().postDataJSON();
    await route.fulfill({json:signed?remote:normalizeSnapshot({xp:{total:30},lessons:{welcome:{completedAt:10}},updatedAt:10})});
  });
  await page.route("**/api/auth/logout",async route=>{signed=false;await route.fulfill({json:{ok:true}});});
  await page.goto("/#/settings/login-success");
  await expect(page.locator(".account-panel")).toContainText("Pessoa");
  await expect(page.locator("#save-status")).toHaveText("Progresso salvo");
  await expect.poll(async()=>page.evaluate(id=>JSON.parse(localStorage.getItem("maru-account-"+id+"-v2"))?.xp.total,id)).toBe(90);
  const account=await page.evaluate(id=>JSON.parse(localStorage.getItem("maru-account-"+id+"-v2")),id);
  expect(account.lessons.welcome.completedAt).toBe(10);
  expect(account.lessons.sounds.completedAt).toBe(20);
  expect((await saved(page)).xp.total).toBe(30);
  // A different tab changing identity stops synchronization, while this tab's work stays local.
  await page.evaluate(()=>{
    localStorage.removeItem("maru-active-account");
    window.dispatchEvent(new StorageEvent("storage",{key:"maru-active-account"}));
  });
  await expect(page.locator("#save-status")).toHaveText("Conta alterada · recarregue");
  await page.locator('input[name="daily-goal"][value="10"]').check();
  await expect(page.locator("#save-status")).toHaveText("Conta alterada · recarregue");
  expect(await page.evaluate(id=>JSON.parse(localStorage.getItem("maru-account-"+id+"-v2")).preferences.dailyGoal,id)).toBe(10);
  await page.getByRole("button",{name:"Sair desta conta",exact:true}).click();
  await expect(page.locator("#email-account-form")).toBeVisible();
  await expect(page.locator("#xp-total")).toHaveText("30 XP");
});
