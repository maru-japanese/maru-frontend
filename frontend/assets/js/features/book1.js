import { MODULES, LESSONS } from "/shared/curriculum.js";
import { esc, jpHTML } from "../core/ui.js";

const bookHeader = title => `<header class="paper-header"><strong>maru.</strong><span>LIVRO 1 · FUNDAMENTOS<br>${esc(title)}</span></header>`;
const cover = `<div class="paper-book-cover"><p class="eyebrow">MARU · LIVRO 1</p><h2>Japonês,<br>passo a passo.</h2><p>Do primeiro som às primeiras conversas: 8 etapas, ${LESSONS.length} lições e atividades para fazer no papel.</p><figure class="paper-book-cover-art"><img src="/assets/img/irasutoya-study-nihongo.png" alt="Pessoa lendo um livro para estudar japonês" width="762" height="800"><figcaption class="paper-art-credit">Ilustração: Mifune Takashi / Irasutoya · www.irasutoya.com</figcaption></figure><p>Nome: __________________________________________</p><small>Esta trilha é introdutória. Não é um curso preparatório oficial nem certificação JLPT. O livro complementa o estudo no site; revisão espaçada, áudio e progresso continuam online.</small></div>`;
const contents = bookHeader("Sumário") + '<h2>Seu caminho neste livro</h2><p class="paper-instructions">Siga as etapas na ordem sugerida ou volte às que quiser revisar. Cada lição tem leitura, exemplos e uma atividade com gabarito ao final.</p>' +
  `<div class="paper-book-toc">${MODULES.map(module=>`<div><strong>${module.number} · ${esc(module.title)}</strong><span>${module.lessons.length} lições · ${esc(module.subtitle)}</span></div>`).join("")}</div>`;
// Keep each lesson's reading and practice together when they fit; the A4
// renderer moves whole sections/questions to a labelled continuation otherwise.
const lessonSheet = (lesson,module) => bookHeader(`${module.number} · ${module.title}`) +
  `<p class="eyebrow">ETAPA ${module.number} · LEITURA E PRÁTICA</p><h2>${esc(lesson.title)}</h2><p class="paper-book-goal">${esc(lesson.goal)}</p>` +
  lesson.sections.map((section,index)=>`<section class="paper-book-section" data-book-section="${lesson.id}:${index}"><h3>${esc(section.title)}</h3><p>${esc(section.body)}</p>${section.examples.map(example=>`<p class="paper-book-example"><span lang="ja">${jpHTML(example.jp,example.reading)}</span><small>${esc(example.romaji)} · ${esc(example.pt)}${example.note ? ` · ${esc(example.note)}` : ""}</small></p>`).join("")}${section.tip ? `<p class="paper-book-tip">${esc(section.tip)}</p>` : ""}</section>`).join("") +
  lesson.quiz.map((question,index)=>`<section class="paper-book-question" data-book-question="${lesson.id}:${index}">${index===0 ? '<h3 class="paper-book-practice-title">Agora é sua vez</h3>' : ""}<strong>${index+1}. ${esc(question.prompt)}</strong><div class="paper-book-choices">${question.choices.map((choice,i)=>`<span>${String.fromCharCode(65+i)}) ${esc(choice)}</span>`).join("")}</div><div class="paper-practice-line"></div></section>`).join("");
const answers = (lessons, start) => bookHeader("Gabarito · lições") + `<h2>Confira suas respostas.</h2>${lessons.map((lesson,index)=>`<section class="paper-book-answers"><h3>${start+index+1}. ${esc(lesson.title)}</h3>${lesson.quiz.map((question,i)=>`<p><strong>${i+1}. ${String.fromCharCode(65+question.answer)} · ${esc(question.choices[question.answer])}</strong> ${esc(question.explanation)}</p>`).join("")}</section>`).join("")}`;

export function book1Pages() {
  const pages = [cover, contents];
  for(const module of MODULES)for(const lesson of module.lessons){pages.push(lessonSheet(lesson,module));}
  const answerPages = [answers(LESSONS,0)];
  return { pages, answerPages };
}
