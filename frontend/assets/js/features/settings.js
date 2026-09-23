import { accountHTML } from "./account.js";
import { moduleSeals } from "/shared/learningPath.js";
import { LESSONS } from "/shared/curriculum.js";
import { currentStreak } from "/shared/progress.js";
import { ACHIEVEMENTS, playerLevel } from "/shared/gamification.js";
import { THEMES } from "../core/theme.js";
import { pageHeading, icon, routeLink, audioButton } from "../core/ui.js";
import { signUpWithEmail, signInWithEmail, recoverEmail, changeEmailPassword } from "../api.js";

export function renderSettings(ctx, status = "") {
  const controller = new AbortController(), p = ctx.progress;
  const level = playerLevel(p.xp.total);
  ctx.main.innerHTML = pageHeading("DO SEU JEITO", "Um ritmo que combina com você.", "Escolha o seu espaço, ajuste os sons e encontre uma meta que cabe no seu dia.") +
    accountHTML(ctx, status) + `<section class="panel settings-panel"><h2>Três estilos. O mesmo aprendizado.</h2><p class="muted">Troque quando quiser. Suas lições, escrita e revisões continuam de onde você parou.</p><div class="theme-options" role="group" aria-label="Escolha seu modo visual">${THEMES.map(theme=>`<button class="theme-card" data-theme-choice="${theme.id}" aria-pressed="${p.preferences.theme===theme.id}"><span class="theme-preview ${theme.id}"><span lang="ja">${theme.symbol}</span><small>${theme.id==="dojo"?"UM PASSO DE CADA VEZ":theme.id==="arcade"?"PRESS START · LV. "+level.level:"KIRA KIRA · キラキラ"}</small></span><strong>${theme.title} · ${theme.subtitle}</strong><small>${theme.description}</small></button>`).join("")}</div></section>
    <div class="settings-layout"><section class="panel settings-panel"><h2>Seu aprendizado</h2><div class="setting-row"><div><h3>Seu ponto de partida</h3><p>Refaça a orientação quando quiser. Sua trilha fica aberta e nenhuma lição é concluída automaticamente.</p></div>${routeLink("placement", "Refazer diagnóstico", "btn btn-ghost")}</div><div class="setting-row"><div><h3>Espaço para uma pausa</h3><p>Uma pausa de um dia por semana não quebra sua constância. Ao voltar, ela é registrada sem ganhar atividades ou XP. A semana vai de segunda a domingo.</p></div><span class="hanko small-hanko" aria-hidden="true">休</span></div><div class="setting-row"><div><h3>Leitura de apoio em romaji</h3><p>Mostra a leitura em letras latinas junto dos exemplos. Use no começo e experimente esconder quando reconhecer os kana.</p></div><label class="switch"><input id="setting-romaji" type="checkbox" ${p.preferences.romaji?"checked":""}><span aria-hidden="true"></span><span class="sr-only">Mostrar romaji</span></label></div>
    <div class="setting-row vertical"><div><h3>Sua meta diária</h3><p>Uma atividade é uma resposta de prática, uma lição concluída ou um registro de escrita.</p></div><div class="goal-options">${[[5,"Um começo leve"],[10,"Criando o hábito"],[15,"Um pouco mais"]].map(([goal,label])=>`<label class="goal-option"><input type="radio" name="daily-goal" value="${goal}" ${p.preferences.dailyGoal===goal?"checked":""}><strong>${goal} atividades</strong><span>${label}</span></label>`).join("")}</div></div>
    <div class="setting-row"><div><h3>Velocidade da pronúncia</h3><p>Ouça mais devagar e depois tente no ritmo de estudo.</p></div><select id="setting-audio-rate" class="text-input" aria-label="Velocidade da pronúncia">${[[.75,"Mais devagar · 0,75×"],[1,"Ritmo de estudo · 1×"],[1.15,"Um pouco mais rápido · 1,15×"]].map(([rate,label])=>`<option value="${rate}" ${p.preferences.audioRate===rate?"selected":""}>${label}</option>`).join("")}</select></div>
    <div class="setting-row"><div><h3>Experimente o áudio</h3><p><span lang="ja">こんにちは</span> · konnichiwa · olá</p></div>${audioButton("こんにちは","Testar pronúncia japonesa")}</div>
    <div class="setting-row"><div><h3>Efeitos de jogo no Arcade</h3><p>Sons curtos ao acertar, errar e concluir. A pronúncia continua disponível com esta opção desligada.</p></div><label class="switch"><input id="setting-effects" type="checkbox" ${p.preferences.soundEffects?"checked":""}><span aria-hidden="true"></span><span class="sr-only">Efeitos de jogo</span></label></div>
    <p class="audio-status-note">As pronúncias são consultadas na API TTS Quest e reproduzidas diretamente no navegador, sem exportar arquivos. Voz: VOICEVOX:ずんだもん. É necessária conexão com a internet. Toque uma vez para ouvir e novamente para interromper. Na primeira consulta, a voz pode levar alguns segundos para ficar pronta. Para escutar falantes em conversas reais, explore os recursos da biblioteca.</p><div class="setting-note">${icon("check")} As preferências são salvas automaticamente.</div></section>
    <aside class="panel progress-overview"><span class="jp" lang="ja">歩</span><h2>Cada passo fica.</h2><dl><div><dt>Lições concluídas</dt><dd>${LESSONS.filter(lesson=>p.lessons[lesson.id]?.completedAt).length} / ${LESSONS.length}</dd></div><div><dt>Experiência acumulada</dt><dd>${p.xp.total} XP</dd></div><div><dt>Nível de experiência</dt><dd>${level.level}</dd></div><div><dt>Dias de constância</dt><dd>${currentStreak(p)}</dd></div><div><dt>Frases acertadas</dt><dd>${p.stats.sentencesWritten}</dd></div><div><dt>Práticas de escrita</dt><dd>${p.stats.writingSessions}</dd></div></dl><p class="small muted">O nível acompanha sua prática no Maru; não é uma avaliação de proficiência.</p>${routeLink("journey","Continuar minha trilha "+icon("arrow"),"text-link")}</aside></div>
    <section class="panel settings-panel about-panel"><h2>Pequenas conquistas, progresso real.</h2><p class="muted">Cada conquista acompanha uma atividade feita por você. Elas valem nos três estilos.</p><div class="achievement-grid">${ACHIEVEMENTS.map(item=>{const earned=item.test(p);return `<article class="achievement ${earned?"is-earned":""}"><span class="badge-symbol jp" lang="ja">${item.symbol}</span><h3>${item.title}</h3><p>${item.description}</p><small>${earned?"✓ Conquistada":"Em construção"}</small></article>`;}).join("")}</div></section>
    <section class="panel settings-panel about-panel"><h2>Os selos do seu caminho.</h2><p class="muted">Cada selo reúne uma etapa realmente concluída. Diagnóstico e escolha de nível não concedem selos.</p><div class="stage-seals">${moduleSeals(p).map(module => `<article class="stage-seal ${module.earned ? "is-earned" : ""}"><span class="hanko jp" lang="ja">${module.symbol}</span><h3>${module.title}</h3><p>${module.done} / ${module.lessons.length} lições</p><small>${module.earned ? "Etapa concluída" : "Um traço de cada vez"}</small></article>`).join("")}</div></section><section class="panel settings-panel about-panel"><h2>Sobre este espaço</h2><p>Maru é um ponto de partida para quem começa japonês do zero. A trilha introduz leitura, escrita, gramática e situações de comunicação. Você pode estudar nos estilos Dojo, Arcade ou Heisei Girly e levar atividades para o papel.</p><p>Sem conta, cada navegador tem seu próprio perfil. Com uma conta, seu progresso é sincronizado entre os aparelhos em que você entrar. Sair da conta devolve este navegador ao perfil anônimo, sem misturar contas.</p>${routeLink("library","Conhecer os recursos e as referências "+icon("external"),"text-link")}</section>`;
  ctx.main.addEventListener("click", async event => {
    const logout = event.target.closest("#account-logout");
    if (logout) {
      logout.disabled = true;
      try { await ctx.logout(); } catch { logout.disabled = false; ctx.toast("Não foi possível sair agora. Confira a conexão e tente novamente."); }
    }
    const tab = event.target.closest("#email-mode-login, #email-mode-signup");
    if (tab) {
      const signup = tab.id === "email-mode-signup";
      ctx.main.querySelectorAll(".account-tabs button").forEach(button => button.setAttribute("aria-pressed", String(button === tab)));
      ctx.main.querySelector("#account-password").autocomplete = signup ? "new-password" : "current-password";
      ctx.main.querySelector("#email-submit").textContent = signup ? "Criar conta por e-mail" : "Entrar com e-mail";
      ctx.main.querySelector("#account-feedback").textContent = "";
    }
    if (event.target.closest("#email-recover-toggle")) {
      const form = ctx.main.querySelector("#email-recover-form");
      form.hidden = !form.hidden;
      if (!form.hidden) { form.elements.email.value = ctx.main.querySelector("#account-email").value; form.elements.email.focus(); }
    }
  }, { signal: controller.signal });
  ctx.main.addEventListener("submit", async event => {
    const form = event.target;
    if (!["email-account-form", "email-recover-form", "password-change-form"].includes(form.id)) return;
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const feedback = ctx.main.querySelector("#account-feedback");
    button.disabled = true;
    feedback.textContent = "Aguarde…";
    try {
      if (form.id === "email-account-form") {
        const signup = ctx.main.querySelector("#email-mode-signup").getAttribute("aria-pressed") === "true";
        const email = form.elements.email.value.trim();
        const password = form.elements.password.value;
        if (signup) {
          const result = await signUpWithEmail(email, password);
          feedback.textContent = result.message;
          form.elements.password.value = "";
        } else {
          await ctx.flush();
          await signInWithEmail(email, password);
          location.replace("/#/settings/login-success");
          location.reload();
        }
      } else if (form.id === "email-recover-form") {
        const result = await recoverEmail(form.elements.email.value.trim());
        feedback.textContent = result.message;
      } else {
        await changeEmailPassword(form.elements.password.value);
        feedback.textContent = "Senha alterada. Guarde-a em um lugar seguro.";
        form.elements.password.value = "";
      }
    } catch (error) { feedback.textContent = error.message || "Não foi possível concluir. Tente novamente."; }
    finally { button.disabled = false; }
  }, { signal: controller.signal });
  ctx.main.addEventListener("change",event=>{
    if(event.target.id==="setting-romaji")p.preferences.romaji=event.target.checked;
    if(event.target.name==="daily-goal")p.preferences.dailyGoal=Number(event.target.value);
    if(event.target.id==="setting-effects")p.preferences.soundEffects=event.target.checked;
    if(event.target.id==="setting-audio-rate"){p.preferences.audioRate=Number(event.target.value);ctx.audio.stop();}
    ctx.save();ctx.toast("Preferências salvas.");
  },{signal:controller.signal});
  return ()=>controller.abort();
}
