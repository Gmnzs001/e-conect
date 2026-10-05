/* =========================================================
   E-Conect Consultoria — scripts globais
   Compartilhado por todas as páginas.
   ========================================================= */

/* ---------------------------------------------------------
   CONTATO CENTRAL
   A CONFIRMAR ANTES DA PUBLICAÇÃO: número de WhatsApp
   informado no site atual (+55 62 99836-6257).
   --------------------------------------------------------- */
const WHATSAPP_NUMBER = '5562998366257';
const WHATSAPP_DEFAULT_MSG = 'Olá, gostaria de conhecer as soluções da E-Conect.';

function waLink(message = WHATSAPP_DEFAULT_MSG) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/* Links de WhatsApp: qualquer elemento com data-wa recebe o link.
   data-wa="" usa a mensagem padrão; data-wa="texto" usa a mensagem própria. */
document.querySelectorAll('[data-wa]').forEach(el => {
  el.href = waLink(el.dataset.wa || undefined);
  el.target = '_blank';
  el.rel = 'noopener';
});

/* ---------------------------------------------------------
   MENU
   --------------------------------------------------------- */
const toggle = document.querySelector('.nav__toggle');
const nav = document.getElementById('menu');
const isMobile = () => window.matchMedia('(max-width: 960px)').matches;

function setMenu(open) {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  nav.classList.toggle('is-open', open);
  document.documentElement.classList.toggle('menu-open', open);
  if (open && dropItem) setDrop(true);   // no celular, as soluções já aparecem abertas
}

/* Painel "Soluções" */
const dropItem = document.querySelector('.nav__item--menu');
const dropBtn = dropItem && dropItem.querySelector('.nav__trigger');
function setDrop(open) {
  dropItem.classList.toggle('is-open', open);
  dropBtn.setAttribute('aria-expanded', String(open));
}

if (dropItem) {
  const canHover = () => window.matchMedia('(hover: hover)').matches && !isMobile();
  let hoverTimer;
  dropBtn.addEventListener('click', e => {
    // com mouse no desktop o painel já abre no hover: o clique não deve fechá-lo
    const byMouseOnDesktop = e.detail > 0 && canHover();
    setDrop(byMouseOnDesktop ? true : !dropItem.classList.contains('is-open'));
  });
  dropItem.addEventListener('mouseenter', () => { if (canHover()) { clearTimeout(hoverTimer); setDrop(true); } });
  dropItem.addEventListener('mouseleave', () => { if (canHover()) hoverTimer = setTimeout(() => setDrop(false), 120); });
  dropItem.addEventListener('focusout', e => { if (!isMobile() && !dropItem.contains(e.relatedTarget)) setDrop(false); });
  document.addEventListener('click', e => { if (!isMobile() && !dropItem.contains(e.target)) setDrop(false); });
}

if (toggle && nav) {
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { if (isMobile()) setMenu(false); }));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (dropItem && dropItem.classList.contains('is-open') && !isMobile()) { setDrop(false); dropBtn.focus(); return; }
    if (nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  // se a tela mudar de celular para desktop com o menu aberto
  window.matchMedia('(max-width: 960px)').addEventListener('change', () => { setMenu(false); if (dropItem) setDrop(false); });
}

/* Marca no menu a página atual (e destaca "Soluções" se for uma das soluções) */
const currentPage = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav__list a').forEach(a => {
  if (a.getAttribute('href') === currentPage) a.setAttribute('aria-current', 'page');
});
if (dropBtn && dropItem.querySelector('[aria-current="page"]')) dropBtn.classList.add('is-current');

/* ---------------------------------------------------------
   CARROSSEL (depoimentos)
   Avança sozinho; pausa com mouse/foco ou no botão "Pausar".
   Não avança sozinho para quem prefere movimento reduzido.
   --------------------------------------------------------- */
document.querySelectorAll('[data-carousel]').forEach(carousel => {
  const track = carousel.querySelector('.carousel__track');
  const slides = [...track.children];
  const dots = carousel.querySelector('.carousel__dots');
  const pauseBtn = carousel.querySelector('[data-pause]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DELAY = 7000;
  let index = 0, timer = null, userPaused = reduced, hovering = false;

  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Depoimento ${i + 1}`);
    b.addEventListener('click', () => { go(i); restart(); });
    dots.appendChild(b);
  });

  function go(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((s, n) => s.setAttribute('aria-hidden', String(n !== index)));
    [...dots.children].forEach((d, n) => d.setAttribute('aria-current', String(n === index)));
  }
  function play() { stop(); if (!userPaused && !hovering) timer = setInterval(() => go(index + 1), DELAY); }
  function stop() { clearInterval(timer); timer = null; }
  function restart() { play(); }
  function setPaused(p) {
    userPaused = p;
    pauseBtn.setAttribute('aria-pressed', String(p));
    pauseBtn.textContent = p ? 'Retomar' : 'Pausar';
    play();
  }

  carousel.querySelector('[data-prev]').addEventListener('click', () => { go(index - 1); restart(); });
  carousel.querySelector('[data-next]').addEventListener('click', () => { go(index + 1); restart(); });
  pauseBtn.addEventListener('click', () => setPaused(!userPaused));
  carousel.addEventListener('mouseenter', () => { hovering = true; stop(); });
  carousel.addEventListener('mouseleave', () => { hovering = false; play(); });
  carousel.addEventListener('focusin', () => { hovering = true; stop(); });
  carousel.addEventListener('focusout', e => { if (!carousel.contains(e.relatedTarget)) { hovering = false; play(); } });

  // deslizar no celular
  let x0 = null;
  track.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) { go(index + (dx < 0 ? 1 : -1)); restart(); }
    x0 = null;
  });

  go(0);
  if (reduced) setPaused(true); else play();
});

/* ---------------------------------------------------------
   FILTROS (cursos e conteúdos)
   <div data-filter-group="x"> com botões data-filter="valor" (ou "todos")
   e itens com data-filter-item="x" data-tags="valor1 valor2".
   --------------------------------------------------------- */
document.querySelectorAll('[data-filter-group]').forEach(group => {
  const name = group.dataset.filterGroup;
  const items = document.querySelectorAll(`[data-filter-item="${name}"]`);
  const empty = document.querySelector(`[data-filter-empty="${name}"]`);
  const status = document.querySelector(`[data-filter-status="${name}"]`);
  const buttons = group.querySelectorAll('button[data-filter]');

  buttons.forEach(btn => btn.addEventListener('click', () => {
    const value = btn.dataset.filter;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    let shown = 0;
    items.forEach(item => {
      const match = value === 'todos' || item.dataset.tags.split(' ').includes(value);
      item.hidden = !match;
      if (match) shown++;
    });
    if (empty) empty.hidden = shown > 0;
    if (status) status.textContent = shown === 1 ? '1 item encontrado.' : `${shown} itens encontrados.`;
  }));
});

/* ---------------------------------------------------------
   ANIMAÇÕES AO ROLAR
   Só anima o que ainda está fora da tela (sem "piscar" no carregamento).
   Desligado para quem prefere movimento reduzido ou navegador sem suporte.
   --------------------------------------------------------- */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if ('IntersectionObserver' in window && !prefersReduced) {
  const SELECTOR = [
    '.section-head', '.solution', '.problem', '.offer', '.step', '.benefit', '.course', '.info', '.path',
    '.post', '.case', '.cases__title', '.trace-step', '.demo-card', '.split__media', '.split > div:not(.split__media)',
    '.mv article', '.format', '.photo-grid figure', '.gallery figure', '.band', '.carousel', '.timeline li',
    '.channel', '.wa-card', '.map-embed', '.jump a', '.related li', '.cta-final .wrap > *', '.solutions__note',
    '.placeholder', '.legal__toc', '.article__cta', '.prose__intro'
  ].join(',');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-visible');
      observer.unobserve(el);
      // devolve as transições normais (hover) quando a entrada termina
      el.addEventListener('transitionend', function done(e) {
        if (e.target !== el || e.propertyName !== 'transform') return;
        el.removeEventListener('transitionend', done);
        el.classList.remove('reveal', 'is-visible');
        el.style.removeProperty('--d');
      });
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  const viewportBottom = window.innerHeight;
  document.querySelectorAll(SELECTOR).forEach(el => {
    if (el.closest('.reveal') || el.getBoundingClientRect().top < viewportBottom) return;
    // efeito cascata entre itens irmãos (cards de uma mesma grade)
    const siblings = [...el.parentElement.children].filter(c => c.matches(SELECTOR));
    const i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty('--d', `${Math.min(i, 5) * 90}ms`);
    el.classList.add('reveal');
    observer.observe(el);
  });
}

/* Header ganha sombra ao rolar */
const header = document.querySelector('.header');
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------------------------------------------------------
   RODAPÉ
   --------------------------------------------------------- */
const yearEl = document.getElementById('ano');
if (yearEl) yearEl.textContent = new Date().getFullYear();
