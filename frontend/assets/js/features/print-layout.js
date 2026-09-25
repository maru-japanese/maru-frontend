// Measure at physical A4 size. Preview scaling never changes the typesetting.
const INTRO = '.paper-header, .paper-name, h2, .paper-instructions, .paper-book-goal, .eyebrow';

function createPage(preview, heading, continuation) {
  const frame = document.createElement('div');
  frame.className = 'paper-preview-page';
  const page = document.createElement('article');
  page.className = 'print-sheet';
  const head = document.createElement('div');
  head.className = 'paper-heading';
  heading.forEach(node => head.append(node.cloneNode(true)));
  if (continuation) {
    const label = document.createElement('p');
    label.className = 'paper-continuation';
    label.textContent = 'Continuação';
    head.append(label);
  }
  const body = document.createElement('div');
  body.className = 'paper-body';
  const footer = document.createElement('footer');
  footer.className = 'paper-footer';
  footer.innerHTML = '<span>maru. · Japonês, passo a passo</span><span class="paper-page-number"></span>';
  page.append(head, body, footer);
  frame.append(page);
  preview.append(frame);
  return { page, body, footer };
}

const fits = body => body.scrollHeight <= body.clientHeight + 1;
const usedHeight = body => [...body.children].reduce((sum,node) => {
  const style = getComputedStyle(node);
  return sum + node.offsetHeight + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
}, 0);

function balancePages(pages) {
  for (let index = pages.length - 1; index > 0; index--) {
    const before = pages[index - 1].body, after = pages[index].body;
    while (before.childElementCount > 1) {
      const node = before.lastElementChild;
      const difference = usedHeight(before) - usedHeight(after);
      const size = node.offsetHeight + parseFloat(getComputedStyle(node).marginBlockStart) + parseFloat(getComputedStyle(node).marginBlockEnd);
      if (difference <= size * 1.1) break;
      after.prepend(node);
      if (!fits(after)) { before.append(node); break; }
    }
  }
}

// A measured source may span several pages, but questions and kana families
// remain atomic. Never shrink the whole page or silently clip overflowing text.
export async function renderPrintPages(preview, sheets, isCurrent) {
  preview.style.setProperty('--paper-scale', '1');
  preview.dataset.ready = 'false';
  preview.innerHTML = sheets.map(html => `<div class="paper-source">${html}</div>`).join('');
  await document.fonts.ready;
  await Promise.all([...preview.querySelectorAll('img')].map(image => image.decode()));
  if (!isCurrent()) return null;
  const sources = [...preview.children].map(source => [...source.children]);
  preview.replaceChildren();
  const pages = [];
  for (const nodes of sources) {
    const heading = [];
    while (nodes[0]?.matches(INTRO)) heading.push(nodes.shift());
    let current = createPage(preview, heading, false);
    const sectionPages = [current];
    pages.push(current);
    for (const node of nodes) {
      current.body.append(node);
      if (!fits(current.body)) {
        node.remove();
        if (!current.body.childElementCount) throw new Error('Um bloco de conteúdo excede a área A4.');
        current = createPage(preview, heading, true);
        sectionPages.push(current);
        pages.push(current);
        current.body.append(node);
        if (!fits(current.body)) throw new Error('Um bloco de conteúdo excede a área A4.');
      }
    }
    balancePages(sectionPages);
  }
  for (const [index, { page, body, footer }] of pages.entries()) {
    // Writing exercises use spare space for answers, not oversized type.
    if (body.querySelector(':scope > .paper-question, :scope > .paper-book-question')) body.classList.add('paper-body-practice');
    if (body.querySelector('.paper-kana-family')) body.classList.add('paper-body-kana');
    if (body.querySelector('.paper-book-cover')) body.classList.add('paper-body-cover');
    if (body.querySelector('.model svg')) footer.firstElementChild.innerHTML += '<small>Traços: KanjiVG · Ulrich Apel e colaboradores · CC BY-SA 3.0</small>';
    footer.querySelector('.paper-page-number').textContent = `${index + 1} / ${pages.length}`;
    page.setAttribute('aria-label', `Folha ${index + 1} de ${pages.length}`);
    if (!fits(body)) throw new Error('Não foi possível ajustar esta folha ao A4.');
  }
  preview.dataset.ready = 'true';
  return pages.length;
}

export function scalePrintPreview(preview) {
  const resize = () => {
    const paper = preview.querySelector('.print-sheet');
    if (!paper) return;
    const width = paper.offsetWidth;
    preview.style.setProperty('--paper-scale', String(Math.min(1, preview.clientWidth / width)));
  };
  const observer = new ResizeObserver(resize);
  observer.observe(preview);
  return { resize, disconnect: () => observer.disconnect() };
}
