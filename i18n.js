/* Local translations and language selector. Loaded before page animations. */
(() => {
  'use strict';
  const dictionaries = window.ACUTIS_TRANSLATIONS;
  if (!dictionaries) return;
  const root = document.documentElement;
  const switcher = document.getElementById('languageSwitch');
  const summary = document.getElementById('languageSummary');
  const buttons = [...document.querySelectorAll('[data-language]')];
  const statement = document.getElementById('statement');
  const originalStatement = statement.textContent;
  const texts = [];
  const attributes = [];
  let language = 'es';
  const owns = key => Object.prototype.hasOwnProperty.call(dictionaries.es, key);
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement.closest('script, style, svg, [translate="no"], #statement, #heroTitle, #languageSwitch')) continue;
    const key = node.textContent.trim();
    if (owns(key)) texts.push({ node, key, before: node.textContent.match(/^\s*/)[0], after: node.textContent.match(/\s*$/)[0] });
  }
  document.querySelectorAll('[alt], [aria-label], [title], meta[name="description"], meta[property="og:title"], meta[property="og:description"]').forEach(element => {
    if (element.closest('[translate="no"], #languageSwitch')) return;
    ['alt', 'aria-label', 'title', 'content'].forEach(attribute => {
      const key = element.getAttribute(attribute);
      if (key && owns(key)) attributes.push({ element, attribute, key });
    });
  });
  function t(key, values = {}) {
    const text = dictionaries[language][key] ?? dictionaries.es[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
  }
  function applyLanguage(next, persist = true) {
    if (!Object.prototype.hasOwnProperty.call(dictionaries, next)) next = 'es';
    const navBottom = document.getElementById('nav').getBoundingClientRect().bottom;
    const anchor = persist && window.scrollY > 0
      ? [...document.querySelectorAll('main h1, main h2, main h3, main p, main figure')].find(element => {
        const rect = element.getBoundingClientRect();
        return rect.bottom > navBottom && rect.top < innerHeight;
      }) : null;
    const anchorTop = anchor?.getBoundingClientRect().top;
    language = next;
    root.lang = next === 'pt' ? 'pt-BR' : next;
    texts.forEach(({ node, key, before, after }) => {
      if (node.isConnected) node.textContent = before + t(key) + after;
    });
    attributes.forEach(({ element, attribute, key }) => element.setAttribute(attribute, t(key)));
    statement.textContent = t(originalStatement);
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === next)));
    const selected = buttons.find(button => button.dataset.language === next);
    document.getElementById('languageFlag').replaceChildren(selected.querySelector('svg').cloneNode(true));
    document.getElementById('languageCode').textContent = next.toUpperCase();
    summary.setAttribute('aria-label', `${t('Elegir idioma')}: ${selected.dataset.name}`);
    summary.title = t('Elegir idioma');
    if (persist) {
      try { localStorage.setItem('acutis-language', next); } catch (_) { /* Storage can be unavailable. */ }
      try {
        const url = new URL(location.href);
        url.searchParams.set('lang', next);
        history.replaceState(null, '', url);
      } catch (_) { /* The selector also works when opened as a local file. */ }
    }
    document.getElementById('languageStatus').textContent = persist ? t('Idioma cambiado a {language}', { language: selected.dataset.name }) : '';
    document.dispatchEvent(new CustomEvent('languagechange', { detail: { language: next } }));
    // Open accordions can change height after a translation.
    requestAnimationFrame(() => {
      document.querySelectorAll('.qa.open .a').forEach(panel => { panel.style.maxHeight = panel.scrollHeight + 'px'; });
      if (anchor) window.scrollBy({ top: anchor.getBoundingClientRect().top - anchorTop, behavior: 'instant' });
    });
  }
  window.siteI18n = { t, setLanguage: applyLanguage, get language() { return language; } };
  buttons.forEach(button => button.addEventListener('click', () => {
    applyLanguage(button.dataset.language);
    switcher.open = false;
    summary.focus({ preventScroll: true });
  }));
  document.addEventListener('click', event => {
    if (!switcher.contains(event.target)) switcher.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && switcher.open) { switcher.open = false; summary.focus({ preventScroll: true }); }
  });
  let initial = new URLSearchParams(location.search).get('lang');
  if (!initial) {
    try { initial = localStorage.getItem('acutis-language'); } catch (_) { /* Use Spanish. */ }
  }
  applyLanguage(initial || 'es', false);
})();
