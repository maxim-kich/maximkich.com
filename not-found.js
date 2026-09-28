const stream = document.getElementById('stream');
const SYSTEM_GLYPH = '∙';
const REQUESTED_PATH = window.location.pathname || '/';
let REQUESTED_PATH_DISPLAY = REQUESTED_PATH || '/';
try {
  REQUESTED_PATH_DISPLAY = decodeURIComponent(REQUESTED_PATH_DISPLAY);
} catch (err) {
  REQUESTED_PATH_DISPLAY = REQUESTED_PATH;
}

const ASCII_NOT_FOUND = String.raw`██╗  ██╗  ██████╗  ██╗  ██╗
██║  ██║ ██╔═████╗ ██║  ██║
███████║ ██║██╔██║ ███████║
╚════██║ ████╔╝██║ ╚════██║
     ██║ ╚██████╔╝      ██║
     ╚═╝  ╚═════╝       ╚═╝`;
const MOBILE_BREAKPOINT = 768;
const MOBILE_ASCII_404_IMAGE = '/img/mobile/ascii_404.svg';

const navigationEntry = performance && performance.getEntriesByType
  ? performance.getEntriesByType('navigation')[0] || null
  : null;
const navigationType = navigationEntry?.type
  || (performance && performance.navigation && performance.navigation.type === performance.navigation.TYPE_RELOAD
    ? 'reload'
    : '');
if (navigationType === 'reload') {
  window.location.replace('/');
}

function createRow(type, glyphChar) {
  const row = document.createElement('div');
  row.className = type ? `row row--${type}` : 'row';
  const glyph = document.createElement('div');
  glyph.className = 'glyph';
  glyph.textContent = glyphChar || '';
  const content = document.createElement('div');
  content.className = 'content';
  row.append(glyph, content);
  stream.append(row);
  return { row, glyph, content };
}

function waitAtLeast(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function appendSystemLoadingWithAccordion({ loadingText, doneText, steps = [], duration = 800 }) {
  const { row, glyph, content } = createRow('system', SYSTEM_GLYPH);
  row.setAttribute('role', 'status');
  glyph.classList.add('glyph--loading');
  content.classList.add('loader');
  content.textContent = loadingText;

  return new Promise((resolve) => {
    setTimeout(() => {
      row.removeAttribute('role');
      glyph.classList.remove('glyph--loading');
      content.classList.remove('loader');
      content.textContent = '';

      const header = document.createElement('div');
      header.className = 'accordion-header';
      header.textContent = doneText;
      header.setAttribute('tabindex', '0');

      const panel = document.createElement('div');
      panel.className = 'accordion-panel';
      panel.hidden = true;

      steps.forEach((step) => {
        const stepRow = document.createElement('div');
        stepRow.className = 'accordion-step';
        const icon = document.createElement('span');
        icon.className = 'accordion-step__icon';
        icon.textContent = '✓';
        const text = document.createElement('span');
        text.className = 'accordion-step__text';
        text.textContent = step;
        stepRow.append(icon, text);
        panel.append(stepRow);
      });

      glyph.textContent = '▼';
      glyph.classList.add('accordion-toggle');
      glyph.setAttribute('role', 'button');
      glyph.setAttribute('tabindex', '0');
      glyph.setAttribute('aria-expanded', 'false');
      glyph.setAttribute('aria-label', 'Toggle details');

      content.append(header, panel);

      const toggleAccordion = () => {
        const expanded = glyph.getAttribute('aria-expanded') === 'true';
        const next = !expanded;
        glyph.setAttribute('aria-expanded', String(next));
        glyph.textContent = next ? '▲' : '▼';
        panel.hidden = !next;
      };

      header.addEventListener('click', toggleAccordion);
      glyph.addEventListener('click', toggleAccordion);
      header.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleAccordion();
        }
      });
      glyph.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleAccordion();
        }
      });

      resolve({ row, glyph, panel });
    }, duration);
  });
}

function appendSystemLoadingMessage({
  loadingText,
  resultText,
  duration = 1200,
  failure = false,
}) {
  const { row, glyph, content } = createRow('system', SYSTEM_GLYPH);
  row.setAttribute('role', 'status');
  glyph.classList.add('glyph--loading');
  content.classList.add('loader');
  content.textContent = loadingText;

  return new Promise((resolve) => {
    setTimeout(() => {
      row.removeAttribute('role');
      glyph.classList.remove('glyph--loading');
      content.classList.remove('loader');
      content.textContent = resultText;
      if (failure) {
        glyph.classList.add('glyph--failure');
        glyph.textContent = '!';
      }
      resolve({ row, glyph, content });
    }, duration);
  });
}

function revealAsciiBlocks({ ascii, className = 'ascii-404', duration = 900 } = {}) {
  if (!ascii) return Promise.resolve();
  const { content } = createRow('system', '');
  const pre = document.createElement('pre');
  pre.className = className;
  pre.textContent = '';
  content.append(pre);
  const sanitized = ascii.replace(/^\n+/, '');
  const lines = sanitized.split('\n');
  const total = lines.length || 1;
  const step = duration / total;
  let index = 0;

  return new Promise((resolve) => {
    const tick = () => {
      if (index >= total) {
        resolve();
        return;
      }
      const prefix = index > 0 ? '\n' : '';
      pre.textContent += `${prefix}${lines[index]}`;
      index += 1;
      setTimeout(tick, step);
    };
    tick();
  });
}

function appendAsciiImageRow(src) {
  const { content } = createRow('system', '');
  const wrapper = document.createElement('div');
  wrapper.className = 'ascii-404-image';
  const img = document.createElement('img');
  img.src = src;
  img.alt = 'ASCII 404';
  img.decoding = 'async';
  img.loading = 'lazy';
  img.draggable = false;
  wrapper.append(img);
  content.append(wrapper);
  return Promise.resolve();
}

function isMobileView() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function showReloadSelector() {
  const { content } = createRow('input', '>');
  const panel = document.createElement('div');
  panel.className = 'selector-panel';
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', 'Page not found recovery selector');

  const intro = document.createElement('div');
  intro.className = 'selector-panel__intro';
  intro.textContent = 'Use keyboard or mouse to navigate';
  panel.append(intro);

  const list = document.createElement('div');
  list.className = 'selector-panel__list';
  panel.append(list);

  const option = document.createElement('div');
  option.className = 'selector-option';
  option.setAttribute('role', 'button');
  option.tabIndex = 0;

  const keySpan = document.createElement('span');
  keySpan.className = 'selector-option__key';
  keySpan.textContent = '[r]';
  const labelSpan = document.createElement('span');
  labelSpan.className = 'selector-option__label';
  labelSpan.textContent = ' Reload with correct connection';
  option.append(keySpan, labelSpan);

  const confirm = () => {
    document.removeEventListener('keydown', keyHandler);
    option.setAttribute('disabled', 'true');
    window.location.replace('/');
  };

  option.addEventListener('click', confirm);
  option.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      confirm();
    }
  });

  list.append(option);
  content.append(panel);

  const keyHandler = (event) => {
    if (!event.key) return;
    if (event.key.toLowerCase() === 'r') {
      event.preventDefault();
      confirm();
    }
  };

  document.addEventListener('keydown', keyHandler);
}

function showReloadLink() {
  const { content } = createRow('system', '∙');
  const link = document.createElement('a');
  link.className = 'link';
  link.href = '#';
  link.textContent = 'Reload with the correct connection';
  const reload = () => {
    window.location.replace('/');
  };
  link.addEventListener('click', (event) => {
    event.preventDefault();
    reload();
  });
  content.append(link);
  content.classList.add('row--system-link');
}

function runNotFoundFlow() {
  appendSystemLoadingWithAccordion({
    loadingText: 'Connecting to port:0000',
    doneText: 'Connection successful',
    steps: [
      'Looking up on Wikipedia what a port is',
      'Asking an AI what to do',
      'Still looking on Stack Overflow',
    ],
    duration: 1200,
  })
    .then(() => waitAtLeast(300))
    .then(() => appendSystemLoadingMessage({
      loadingText: 'Starting Maxim Kich CLI',
      resultText: `${REQUESTED_PATH_DISPLAY} does not exist`,
      duration: 400,
      failure: true,
    }))
    .then(() => (isMobileView()
      ? appendAsciiImageRow(MOBILE_ASCII_404_IMAGE)
      : revealAsciiBlocks({ ascii: ASCII_NOT_FOUND, className: 'ascii-404', duration: 900 })))
    .then(() => {
      if (isMobileView()) {
        showReloadLink();
      } else {
        showReloadSelector();
      }
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runNotFoundFlow);
} else {
  runNotFoundFlow();
}
