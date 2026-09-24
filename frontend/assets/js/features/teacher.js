import { MODULES } from "/shared/curriculum.js";
import { THEMATIC_PATHS } from "/shared/discovery.js";
import { esc, icon, pageHeading, routeLink } from "../core/ui.js";

const packageFor = key => {
  if(key.startsWith("module-")){
    const module = MODULES.find(item=>item.id===key.slice(7));
    return module && { title:module.title, description:module.subtitle, lessons:module.lessons, route:`journey/${module.id}`, type:"Etapa da trilha" };
  }
  if(key.startsWith("theme-")){
    const theme = THEMATIC_PATHS.find(item=>item.id===key.slice(6));
    return theme && { title:theme.title, description:theme.description, lessons:theme.lessonIds.map(id=>MODULES.flatMap(module=>module.lessons).find(lesson=>lesson.id===id)), route:`themes/${theme.id}`, type:"Trilha temática" };
  }
  return null;
};
const choices = [
  ...MODULES.map(item=>({key:`module-${item.id}`,label:`Etapa ${item.number} · ${item.title}`})),
  ...THEMATIC_PATHS.map(item=>({key:`theme-${item.id}`,label:`Tema · ${item.title}`}))
];
const packageContent = item => `<span class="pill">${item.type}</span><h2>${esc(item.title)}</h2><p>${esc(item.description)}</p><ol class="teacher-lesson-list">${item.lessons.map(lesson=>`<li>${esc(lesson.title)}</li>`).join("")}</ol><div class="teacher-package-actions">${routeLink(item.route,"Abrir o conteúdo "+icon("arrow"),"btn btn-primary")}${routeLink("worksheets/book","Imprimir o Livro 1 "+icon("pen"),"btn btn-ghost")}</div><p class="small muted">O Livro 1 reúne todas as 8 etapas; o link da trilha acima leva diretamente ao recorte escolhido. Ninguém precisa criar conta para abrir o pacote.</p>`;

export function renderTeacher(ctx, key = "") {
  const selected = packageFor(key);
  if(selected){
    ctx.main.innerHTML = pageHeading("PACOTE DE ESTUDO · MARU",selected.title,selected.description,routeLink("teacher","Montar outro pacote","btn btn-ghost"))+
      `<section class="panel teacher-package">${packageContent(selected)}</section>`;
    return;
  }
  const controller = new AbortController();
  ctx.main.innerHTML = pageHeading("PARA QUEM ENSINA", "Sua aula, seu caminho.", "Escolha uma etapa ou um tema, compartilhe um link com a turma e use o Livro 1 como material de apoio. Sem turma cadastrada, notas ou acesso ao progresso individual.")+
    `<div class="teacher-builder"><div class="panel teacher-builder-controls"><figure class="teacher-illustration"><img class="teacher-art" src="/assets/img/irasutoya-teacher.png" alt="Professora acompanhando um estudante enquanto ele escreve" width="1090" height="1044"><figcaption class="illustration-credit">Ilustração: <a href="https://www.irasutoya.com/2020/06/blog-post_798.html" target="_blank" rel="noopener noreferrer">Irasutoya</a></figcaption></figure><label class="input-label" for="teacher-topic">O que a turma vai estudar?</label><select class="text-input" id="teacher-topic">${choices.map(item=>`<option value="${item.key}">${esc(item.label)}</option>`).join("")}</select><label class="input-label" for="teacher-link">Link do pacote</label><div class="teacher-share"><input class="text-input" id="teacher-link" type="text" readonly aria-label="Link para compartilhar com a turma"><button class="btn btn-ghost" id="teacher-copy" type="button">Copiar link</button></div><p class="small muted">Qualquer pessoa com o link pode acessar. O pacote não guarda dados dos alunos.</p></div><section class="panel teacher-package" id="teacher-preview" aria-live="polite"></section></div>`;
  const select = ctx.main.querySelector("#teacher-topic");
  const link = ctx.main.querySelector("#teacher-link");
  const update = () => {
    const item = packageFor(select.value);
    link.value = `${location.origin}${location.pathname}#/package/${select.value}`;
    ctx.main.querySelector("#teacher-preview").innerHTML = packageContent(item);
  };
  select.addEventListener("change",update,{signal:controller.signal});
  ctx.main.querySelector("#teacher-copy").addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText(link.value);ctx.toast("Link copiado. Você já pode enviá-lo à turma.");}
    catch{link.select();ctx.toast("Selecione e copie o link acima para compartilhar.");}
  },{signal:controller.signal});
  update();
  return ()=>controller.abort();
}
