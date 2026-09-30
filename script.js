const stream = document.getElementById('stream');
const COMMANDS = ['/about', '/portfolio', '/experience', '/contact'];
const SYSTEM_GLYPH = '∙';
const BLOCK_CHAR = '█';
const activeTimeouts = new Set();
const activeIntervals = new Set();
const registeredListeners = [];
let cursorHideTimer = null;
const CURSOR_HIDE_DELAY = 1500;
let currentPrompt = null;
let isBooting = true;
let desktopRunning = false;
function trackTimeout(fn, delay = 0) {
  const id = window.setTimeout(() => {
    activeTimeouts.delete(id);
    fn();
  }, delay);
  activeTimeouts.add(id);
  return id;
}

function clearTrackedTimeout(id) {
  if (id == null) return;
  window.clearTimeout(id);
  activeTimeouts.delete(id);
}

function trackInterval(fn, delay = 0) {
  const id = window.setInterval(fn, delay);
  activeIntervals.add(id);
  return id;
}

function clearTrackedInterval(id) {
  if (id == null) return;
  window.clearInterval(id);
  activeIntervals.delete(id);
}

function clearAllTimers() {
  activeTimeouts.forEach((id) => window.clearTimeout(id));
  activeTimeouts.clear();
  activeIntervals.forEach((id) => window.clearInterval(id));
  activeIntervals.clear();
}

function addAppListener(target, type, handler, options) {
  target.addEventListener(type, handler, options);
  registeredListeners.push({ target, type, handler, options });
}

function removeAppListeners() {
  registeredListeners.forEach(({ target, type, handler, options }) => {
    target.removeEventListener(type, handler, options);
  });
  registeredListeners.length = 0;
}
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

const EXPERIENCE_CHUNKS = [
  `Product & AI Strategist (B2B / SaaS)
<span class="experience-meta">competitionline Verlags GmbH — Berlin, Germany — 2026–present</span>

- Lead product design for a B2B SaaS platform (architecture and planning professionals).
- Explore and introduce AI-based features and workflows to improve the product experience and internal processes.
- Discover and implement potentials for AI-driven team workflows and processes.`,
  `Head of UI (B2B / B2C)
<span class="experience-meta">Jakala Germany GmbH — Hamburg, Germany — 2023–2026</span>

- Managed structural changes in the UI department, define hiring and career development for 15 designers.
- Improve resource planning and collaboration across design teams and promote the adoption of AI tools.
- Work hands-on as a Product Designer on Hamburg’s public transport apps (hvv switch and hvv app).`,
  `Senior UI/UX Designer (Enterprise)
<span class="experience-meta">WBS Training AG — Leipzig, Germany — 2022–2023</span>

- Designed an internal ERP used to plan 6,000+ courses per year and support around 2,000 employees.
- Led a team of 3 designers, coordinating UX and UI work across the ERP product.`,
  `Senior Product Designer (B2C / B2B / SaaS)
<span class="experience-meta">Andersen Labs — Odesa, Ukraine — 2021–2022</span>

- Led an Android app design for a telehealth platform for patients aged 60+ and a web portal for doctors.
- Mentored 4 designers across projects, improving design practices.`,
  `CEO / Design Lead (B2B / B2C / SaaS)
<span class="experience-meta">Nextpage Agency — Odesa, Ukraine — 2019–2021</span>

- Led a 25-person team, increased project profitability by ~20% and delivered award-winning products.`,
  `Director of Product Design / Co-Founder (B2C)
<span class="experience-meta">Coliving Club — San Francisco — 2015–2018</span>

- Co-founded a coliving product and owned management and product flows for 6 locations and a global marketplace concept.`,
];
const ASCII_LOGO = String.raw`███╗   ███╗  █████╗  ██╗  ██╗ ██╗ ███╗   ███╗
████╗ ████║ ██╔══██╗ ╚██╗██╔╝ ██║ ████╗ ████║
██╔████╔██║ ███████║  ╚███╔╝  ██║ ██╔████╔██║
██║╚██╔╝██║ ██╔══██║  ██╔██╗  ██║ ██║╚██╔╝██║
██║ ╚═╝ ██║ ██║  ██║ ██╔╝ ██╗ ██║ ██║ ╚═╝ ██║
╚═╝     ╚═╝ ╚═╝  ╚═╝ ╚═╝  ╚═╝ ╚═╝ ╚═╝     ╚═╝

██╗  ██╗ ██╗  ██████╗ ██╗  ██╗
██║ ██╔╝ ██║ ██╔════╝ ██║  ██║
█████╔╝  ██║ ██║      ███████║
██╔═██╗  ██║ ██║      ██╔══██║
██║  ██╗ ██║ ╚██████╗ ██║  ██║
╚═╝  ╚═╝ ╚═╝  ╚═════╝ ╚═╝  ╚═╝`;

const ASCII_LOGO_WORDS = [
  { label: 'PRODUCT', ascii: String.raw`██████╗ ██████╗  ██████╗ ██████╗ ██╗   ██╗ ██████╗████████╗
██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██║   ██║██╔════╝╚══██╔══╝
██████╔╝██████╔╝██║   ██║██║  ██║██║   ██║██║        ██║
██╔═══╝ ██╔══██╗██║   ██║██║  ██║██║   ██║██║        ██║
██║     ██║  ██║╚██████╔╝██████╔╝╚██████╔╝╚██████╗   ██║
╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝  ╚═════╝   ╚═╝` },
  { label: 'DESIGN', ascii: String.raw`██████╗ ███████╗███████╗██╗ ██████╗ ███╗   ██╗
██╔══██╗██╔════╝██╔════╝██║██╔════╝ ████╗  ██║
██║  ██║█████╗  ███████╗██║██║  ███╗██╔██╗ ██║
██║  ██║██╔══╝  ╚════██║██║██║   ██║██║╚██╗██║
██████╔╝███████╗███████║██║╚██████╔╝██║ ╚████║
╚═════╝ ╚══════╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝` },
  { label: 'AI', ascii: String.raw` █████╗ ██╗
██╔══██╗██║
███████║██║
██╔══██║██║
██║  ██║██║
╚═╝  ╚═╝╚═╝` },
];

const ASCII_LOGO_STRATEGIST = String.raw`███████╗████████╗██████╗  █████╗ ████████╗███████╗ ██████╗ ██╗███████╗████████╗
██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██╔════╝ ██║██╔════╝╚══██╔══╝
███████╗   ██║   ██████╔╝███████║   ██║   █████╗  ██║  ███╗██║███████╗   ██║
╚════██║   ██║   ██╔══██╗██╔══██║   ██║   ██╔══╝  ██║   ██║██║╚════██║   ██║
███████║   ██║   ██║  ██║██║  ██║   ██║   ███████╗╚██████╔╝██║███████║   ██║
╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝ ╚═════╝ ╚═╝╚══════╝   ╚═╝`;

const MOBILE_LOGO_IMAGES = [
  { src: 'img/mobile/ascii_maxim.svg', alt: 'ASCII Maxim' },
  { src: 'img/mobile/ascii_kich.svg', alt: 'ASCII Kich' },
];

const ASCII_ABOUT_PHOTO = String.raw`
╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║@@@@@@@@@@@@#%*%##=++=:++:+:-:::++:++#*%%@@@@@@@@@@#@%@%%=*::---:-------:--:::+:+==%%=@@@@@@@@@@@@@@║
║@@@@@@@@@@@@##=#%%*==++++++++:::::::::+:++:+:+=%=*=*+:::-:-----------------:++:+=*+%=*@@@@@@@@@@@@@@║
║@@@@@@@@@@@@*%###%=+===++++:++:+::::::::::::::::::::--::-----::----------:-:::+++%==%*#@@@@@@@@@@@@@║
║@@@@@@@@@@@@@*%%@%*=++=+:+++::+::::::+-:::--:-:::::::-:-:::----------------::::+===+=+%@@@@@@@@@@@@@║
║@@@@@@@@@@@@@%##%%*+====+=+:+:+::::::::::::::::::::-:::::-:-------------:::::::+==*==+*@@@@@@@@@@@@@║
║@@@@@@@@@@@@@%%%%%*====+=+++++:::+:::::::::::::::::::::-:-:-::----------:--:::+===*#*+=@@@@@@@@@@@@@║
║@@@@@@@@@@@@@####%%*==++=+++::+::::+::::::::::::::::::--:----:-----...-.--::::++=====*%@@@@@@@@@@@@@║
║@@@@@@@@@@@@@%#%%%%**=+++++::::::::::-:::::::::::+::-:::-:--------------::-::+++*=*%*##@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@%%##%*====+++:+::::::::-::::::::+::::::-:-::------:--------::::++=*=**#@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@#%%##%*=**++++++++:+:::::::::::+:::::::-:-:::---------:-::--:::+++==+=*###%#@@@@@@@@@@║
║@@@@@@@@@@@@@@@##%%%***=+=+++::+::::::::++:::::::::::::::--:----------:-:--::++*===+*#%+:+#@@@@@@@@@║
║@@@@@@@@@@%=+@@#%%%%****===+++:+++::::::::::::::::--::::::-:::---.-:-----:--::+=====*%+::+@@@@@@@@@@║
║@@@@@@@@@@#==*@@%%**%***==+++++:+:::::::-::-::::::---:::-:::-----.-----:--:::=+=+=*=*%+:+=@@@@@@@@@@║
║@@@@@@@@@@@#*=%@%*****=====+:+++:::::-:::--:-:::::-::-:::-----------------::+++==+===*+===#@@@@@@@@@║
║@@@@@@@@@@@@#%%@%*****=*==+=+++::::::::-:::-:---:::::::--:-----------:----::=:+=+=*==*+:+=%@@@@@@@@@║
║@@@@@@@@@@@@#%%#%******+*==*+==+::::-::::::---:::::-::::::::::-:----::::+==:::++==++==*=+:*@@@@@@@@@║
║@@@@@@@@@@@@####%**%%*===###@#*=*+==++++:+::::::::+++:+:+++:+++++=++*%*####=*+*====++**%=+=#@@@@@@@#║
║@@@@@@@@@@@@%#@#***%%#@@@%%@#@@@@@@@@##*%=*=+=+++=+==+=+==**%####@@@@@##@##*%%%*==++===%=+=%@@@@@@@@║
║@@@@@@@@@@@@%#%%*==*%###@@##@@##@@@@@@@@@@#*%**==*=***%%%###@@@@@#%%%%%%#%*%******====*++++*@@@@@@@@║
║@@@@@@@@@@@#=*%%%***%##@###@@@@@@@@@@@@@@@@@##%******%%%%%%##@@@@@@@@@=@@@@@#%%*=++++=*+:::*@@@@@@@@║
║@@@@@@@@@@@*==*%*%**=*%#@@@@@@*=@%@@%@:%@@@@@###*%****%*######=:@@@#@=-*%%=**=+++++=++*=:::*@@@@@@@@║
║@@@@#@@@@@#=+=%%%**==++=*#%%#%%%+=@@+=#@@@@#@@@#*++::+=****%#######*%%+**=+=+++:::+++=**+:+*@@@@@@@@║
║@@@#@@@@@@#=+*%*%**=++++=***%%###*###########@##%+--:++==+=#####%%*%*====+++++::+:+=+*=%*+%@@@@@@@@@║
║@#@##@@@@@@%=%#%%%**===+++=****%%%%%%##%%#%%%##%*+:::::=+++=*#**==*==++=++::-:-::+++=*=*%%@@@@@@@@@@║
║@@#@#@@@@@@@##%#%%**===+++++=======**%#*=****##%=+:--:++++:::::+====+::::---::-:++===*=#@@@@@@@@@@@@║
║@@@##@@@@@@@@@@%%%%%**==++:++:++++++==+++=**%#%%=+:--::=+:::-:---::::::--:----::++===**@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@%%%%*%*===+++++:+++++++++===*###%==::-::++:+---:::::--:-----:-:++++=***#@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@%%#%%%**==+===++++:++++===*%###%*=:-:+:++:+:-:----::---:--::++++++=*%%@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@#%%%%******==+++++:+++===**###%*==+:::+++=*::----------:---::++++==**#@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@@%%%%*%%****==+:+++++=+=%%#%#*===+++:::+++++*=:-:-::-:::::::++++=***%@@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@@@#%#%*%*%**=+===+++====%##*%%==++:::::-:=++==++::-::::::++=++===***@@@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@@@@##%%%*%**======+=====%%####%%++:++::+**#*++::::::-::+++=++===*=*#@@@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@@@@###%%**%**=*==+=======**####@#%%#%**=*%*:::::::::::::::++++===*%@@@@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@@@@@###%%%****=======+==++***#@#####%*%*=+::-:::-:::::::++++===**%@@@@@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@@@@@@##%#%%%**=======+===*=%@####%%#####%#*++:-:::::+++:+++++===*#@@@@@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@@@@@@@%#%%%****=**===+%#=*#%@#@#*###@@@@#%#*%*==+++++++++==+==*%@@#@@@@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@@@@@@@@##%%#%%**%%*%%#%%##@#%*@%=++=*=+=*%%*%%%*#%#=%=++++=+==%@@%#@@@@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@@@@@@@@@@#%%%%%%%%#####@@@@@@@@@@@###@@@@##@@@@@@###@=+++===%#@#%%#@@@@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@@@@@@@@@@@#%%*%###%##%%***%*%%%%%%%%%%****===+==*%%%#=====*%@@@%*%@@@@@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@@@@@@@@@@@@@%**%***%***%%%*=*=*%%*%%*****=++====+==+==+==#@@@#**%#@@@@@@@@@@@@@@@@@@║
║@###@@@@@@@@@@@@@@@@@@@@@@@@@#%%*%**%*%*%****%%%*%##=#%**=+=+++++++++=*%@@@@#*=*#@@@@@@@@@@@@@@@@@@@║
║####@@@@@@@@@@@@@@@@@@@@@@@@@@@@#%#%**%***===****#%#%====++::++++++=*#@@@@@#*==%@@@@@@@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%**===+++::++++++:::::::::::+=*#@@@@@#%==*%#@@@@@@@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#%*==+++::+++++::--:-:::+=*#@@@@@@#%==%%#@@@@@@@@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%#**==+++++=+::++====**#@@@@@@##**=*%#@@@@@@@@@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@##%**%%*****%%%###@@@@@@@@##%***%#@@@@@@@@@@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#@@@@@@@@@@@@@@@@%##@#@@@@@@@@@@@@@@@##%**%%#@@@@@@@@@@@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@##@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#%*****%#@@@@@@@@@@@@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%*%##@@@@@@@@@@@@@@@@@@@@@@@@@##%%****%%##@@@@@@@@@@@@@@@@@@@@@@@@@║
║@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%*==%#@@@@@@@@@@@@@@@@@@##%%******%%*%%#@@@@@@@@@@@@@@@@@@@@@@@@@@║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝
`;

function stopDesktopApp() {
  if (!desktopRunning) return;
  desktopRunning = false;
  if (cursorHideTimer) {
    clearTrackedTimeout(cursorHideTimer);
    cursorHideTimer = null;
  }
  document.body.classList.remove('cursor-hidden');
  clearAllTimers();
  removeAppListeners();
  destroyCurrentPromptRow();
  stream.innerHTML = '';
  currentPrompt = null;
  isBooting = true;
  injectedRabbits.clear();
  resetRabbitLensState();
  resetTrophyUI();
  resetEndgameState();
}

function startDesktopApp() {
  if (desktopRunning) return;
  desktopRunning = true;
  handleGlobalListeners();
  runInitialFlow();
}

const CONTACT_SELECTOR_INTRO = 'Select one option. Use arrows, mouse, or numbers to navigate.';
const CONTACT_SELECTOR_DISMISS = '[esc] Dismiss';
const CONTACT_SELECTOR_OPTIONS = [
  { key: '1', label: 'Email: i.am@maximshevchenko.com', value: 'i.am@maximshevchenko.com', contactKey: 'email' },
  { key: '2', label: 'LinkedIn: https://linkedin.com/in/maximkich', value: 'https://linkedin.com/in/maximkich', contactKey: 'linkedin' },
  { key: '3', label: 'Medium: https://maxim-kich.medium.com/', value: 'https://maxim-kich.medium.com/', contactKey: 'medium' },
];
const PORTFOLIO_SELECTOR_INTRO = 'Select one option by using arrows, mouse, or numbers to navigate.';
const PORTFOLIO_PREVIEW_IMAGES = {
  telemedicine: './img/thumb_medicare.png',
  erp: './img/thumb_erp.png',
  hvv: './img/thumb_switch.png',
};
const PORTFOLIO_SELECTOR_OPTIONS = [
  { id: 'hvv', key: '1', label: 'hvv switch app', previewSrc: PORTFOLIO_PREVIEW_IMAGES.hvv, previewAlt: 'hvv switch app' },
  { id: 'telemedicine', key: '2', label: 'Telemedicine Platform', previewSrc: PORTFOLIO_PREVIEW_IMAGES.telemedicine, previewAlt: 'Telemedicine Platform' },
  { id: 'erp', key: '3', label: 'ERP Application', previewSrc: PORTFOLIO_PREVIEW_IMAGES.erp, previewAlt: 'ERP Application' },
];

const PORTFOLIO_LINKS = {
  hvv: '/portfolio/hvv_switch.ux',
  telemedicine: '/portfolio/telehealth.ux',
  erp: '/portfolio/erp.ux',
};

const PORTFOLIO_SHORTCUTS = [
  { id: 'hvv', label: '/portfolio/hvv_switch.ux' },
  { id: 'telemedicine', label: '/portfolio/telehealth.ux' },
  { id: 'erp', label: '/portfolio/erp.ux' },
];

const PORTFOLIO_HVV_RABBIT_TRIGGER = 'The role requires close collaboration with stakeholders from a publicly owned company, aligning high volumes of regulatory requirements with accessibility standards and a clear product vision.';

const RABBIT_CONFIGS = {
  welcome: { rabbitId: 'rabbit-1', top: 50, left: 150 },
  about: { rabbitId: 'rabbit-2', top: 75, left: 400 },
  experienceHead: { rabbitId: 'rabbit-3', top: 100, left: 350 },
  experienceCeo: { rabbitId: 'rabbit-4', top: 50, left: 0 },
  portfolioHvv: { rabbitId: 'rabbit-5', top: 10, left: 100 },
};

const PORTFOLIO_CASE_IMAGES_MOBILE = {
  telemedicine: ['./img/m_medicare1.png', './img/m_medicare2.png'],
  erp: ['./img/m_erp1.png'],
  hvv: ['./img/m_switch1.png'],
};

const CONTACT_MESSAGE_ROWS = [
  {
    key: 'email',
    html: `Email: <a class="link" href="mailto:i.am@maximshevchenko.com">i.am@maximshevchenko.com</a>`,
  },
  {
    key: 'linkedin',
    html: `LinkedIn: <a class="link" href="https://linkedin.com/in/maximkich" target="_blank" rel="noopener noreferrer">https://linkedin.com/in/maximkich</a>`,
  },
  {
    key: 'medium',
    html: `Medium: <a class="link" href="https://maxim-kich.medium.com/" target="_blank" rel="noopener noreferrer">https://maxim-kich.medium.com/</a>`,
  },
];
const CONTACT_MESSAGE_ROWS_MOBILE = [
  {
    key: 'email',
    html: `<a class="link" href="mailto:i.am@maximshevchenko.com">Email</a>`,
  },
  {
    key: 'linkedin',
    html: `<a class="link" href="https://linkedin.com/in/maximkich" target="_blank" rel="noopener noreferrer">LinkedIn</a>`,
  },
  {
    key: 'medium',
    html: `<a class="link" href="https://maxim-kich.medium.com/" target="_blank" rel="noopener noreferrer">Medium</a>`,
  },
];

const PORTFOLIO_MESSAGE_ROWS = [
  { text: 'Portfolio cases:' },
  { text: '/portfolio/telehealth.ux' },
  { text: '/portfolio/erp.ux' },
  { text: '/portfolio/hvv_switch.ux' },
];
function createPortfolioMessageEntry(id, label) {
  return {
    html: `<a class="link" href="#" data-portfolio="${id}">${label}</a>`,
    onRender: (row) => {
      const link = row.querySelector('[data-portfolio]');
      if (!link) return;
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const targetId = link.getAttribute('data-portfolio');
        if (targetId) {
          openPortfolioCaseById(targetId);
          scrollToBottom(true);
        }
      });
    },
  };
}
const PORTFOLIO_MESSAGE_ROWS_DESKTOP = [
  createPortfolioMessageEntry('telemedicine', '/portfolio/telehealth.ux'),
  createPortfolioMessageEntry('erp', '/portfolio/erp.ux'),
  createPortfolioMessageEntry('hvv', '/portfolio/hvv_switch.ux'),
];
const TOTAL_RABBITS = Object.keys(RABBIT_CONFIGS).length;
const SEQUENTIAL_ROW_DELAY = 200;
const gameStart = performance.now();

const injectedRabbits = new Set();

const LENS_SIZE = 72;
const CIRCLE_RADIUS = LENS_SIZE / 2;
const REPEL_RADIUS = 200;
const MAX_REPEL_PUSH = 48;

const rabbitRows = new Set();
const rabbitRowSpans = new WeakMap();
const rabbitRowOriginalContent = new WeakMap();
let lensInitialized = false;
let warpCircleEl = null;
let activeRabbitRow = null;
let activeRowSpans = [];
let lensPointerX = 0;
let lensPointerY = 0;
let repelFrame = null;
let rabbitTrophyEl = null;
let rabbitTrophyIcons = [];
let caughtRabbits = 0;
let endgameOverlay = null;
let endgameCanvas = null;
let endgameWhiteScreen = null;
let endgameTypewriter = null;
let endgameContent = null;
let endgameIllustration = null;
let endgameTriggered = false;
let endgameScrollY = 0;
let endgameInteractionBlocker = null;
const ENDGAME_ILLUSTRATION_ROWS = Array.from({ length: 16 }, (_, index) => `img/endgame_img/${index + 1}.jpg`);
const ENDGAME_ILLUSTRATION_REVEAL_DURATION = 1200;
const ENDGAME_BLOCKED_EVENTS = [
  'wheel',
  'touchmove',
  'pointermove',
  'mousemove',
  'mousedown',
  'mouseup',
  'click',
  'keydown',
  'keyup',
  'touchstart',
  'touchend',
];

const RABBIT_MIN_WIDTH = 768;

function isRabbitFeatureEnabled() {
  return window.innerWidth >= RABBIT_MIN_WIDTH;
}

function isMobileViewport() {
  return window.innerWidth < RABBIT_MIN_WIDTH;
}

const PORTFOLIO_CASES = {
  hvv: {
    title: 'hvv switch app',
    category: 'Public transportation',
    description: [
      'I designed the public transport area of the hvv switch app—Hamburg’s mobility platform that blends public transport with shared mobility.',
      'The role requires close collaboration with stakeholders from a publicly owned company, aligning high volumes of regulatory requirements with accessibility standards and a clear product vision.',
    ],
    images: ['./img/switch1.png'],
  },
  telemedicine: {
    title: 'Telemedicine Platform',
    category: 'Health tech',
    description: [
      'I guided the project from research and journey mapping to prototyping, testing, and development sprints, focusing on accessibility for elderly users.',
      'Android app interfaces emphasize larger touch targets, intuitive navigation, and a clear visual language to lower cognitive load and build trust.',
      'Web interface showcases complex informational structure and inclusion of medical workflows.',
    ],
    images: ['./img/medicare1.png', './img/medicare2.png'],
    layout: [
      { type: 'text', index: 0 },
      { type: 'text', index: 2 },
      { type: 'image', index: 0 },
      { type: 'text', index: 1 },
      { type: 'image', index: 1 },
    ],
  },
  erp: {
    title: 'ERP Application',
    category: 'Enterprise UX',
    description: [
      'I led the end-to-end process from research and service blueprints to MVP prototypes, usability testing, scoping, planing and cross functional team work.',
      'The result translated complex requirements into a core tool for staff and students, improving efficiency and reducing operational bottlenecks.',
    ],
    images: ['./img/erp1.png'],
  },
};

const SECTION_ASCII = {
  '/about': String.raw`
 █████╗  ██████╗   ██████╗  ██╗   ██╗ ████████╗
██╔══██╗ ██╔══██╗ ██╔═══██╗ ██║   ██║ ╚══██╔══╝
███████║ ██████╔╝ ██║   ██║ ██║   ██║    ██║
██╔══██║ ██╔══██╗ ██║   ██║ ██║   ██║    ██║
██║  ██║ ██████╔╝ ╚██████╔╝ ╚██████╔╝    ██║
╚═╝  ╚═╝ ╚═════╝   ╚═════╝   ╚═════╝     ╚═╝`,
  '/experience': String.raw`
███████╗ ██╗  ██╗ ██████╗  ███████╗ ██████╗  ██╗ ███████╗ ███╗   ██╗  ██████╗ ███████╗
██╔════╝ ╚██╗██╔╝ ██╔══██╗ ██╔════╝ ██╔══██╗ ██║ ██╔════╝ ████╗  ██║ ██╔════╝ ██╔════╝
█████╗    ╚███╔╝  ██████╔╝ █████╗   ██████╔╝ ██║ █████╗   ██╔██╗ ██║ ██║      █████╗
██╔══╝    ██╔██╗  ██╔═══╝  ██╔══╝   ██╔══██╗ ██║ ██╔══╝   ██║╚██╗██║ ██║      ██╔══╝
███████╗ ██╔╝ ██╗ ██║      ███████╗ ██║  ██║ ██║ ███████╗ ██║ ╚████║ ╚██████╗ ███████╗
╚══════╝ ╚═╝  ╚═╝ ╚═╝      ╚══════╝ ╚═╝  ╚═╝ ╚═╝ ╚══════╝ ╚═╝  ╚═══╝  ╚═════╝ ╚══════╝`,
  '/contact': String.raw`
 ██████╗  ██████╗  ███╗   ██╗ ████████╗  █████╗   ██████╗ ████████╗
██╔════╝ ██╔═══██╗ ████╗  ██║ ╚══██╔══╝ ██╔══██╗ ██╔════╝ ╚══██╔══╝
██║      ██║   ██║ ██╔██╗ ██║    ██║    ███████║ ██║         ██║
██║      ██║   ██║ ██║╚██╗██║    ██║    ██╔══██║ ██║         ██║
╚██████╗ ╚██████╔╝ ██║ ╚████║    ██║    ██║  ██║ ╚██████╗    ██║
 ╚═════╝  ╚═════╝  ╚═╝  ╚═══╝    ╚═╝    ╚═╝  ╚═╝  ╚═════╝    ╚═╝`,
  '/portfolio': String.raw`
██████╗   ██████╗  ██████╗  ████████╗ ███████╗  ██████╗  ██╗      ██╗  ██████╗
██╔══██╗ ██╔═══██╗ ██╔══██╗ ╚══██╔══╝ ██╔════╝ ██╔═══██╗ ██║      ██║ ██╔═══██╗
██████╔╝ ██║   ██║ ██████╔╝    ██║    █████╗   ██║   ██║ ██║      ██║ ██║   ██║
██╔═══╝  ██║   ██║ ██╔══██╗    ██║    ██╔══╝   ██║   ██║ ██║      ██║ ██║   ██║
██║      ╚██████╔╝ ██║  ██║    ██║    ██║      ╚██████╔╝ ███████╗ ██║ ╚██████╔╝
╚═╝       ╚═════╝  ╚═╝  ╚═╝    ╚═╝    ╚═╝       ╚═════╝  ╚══════╝ ╚═╝  ╚═════╝`,
};

const SECTION_ASCII_IMAGES = {
  '/about': 'img/mobile/ascii_about.svg',
  '/experience': 'img/mobile/ascii_experience.svg',
  '/contact': 'img/mobile/ascii_contact.svg',
  '/portfolio': 'img/mobile/ascii_portfolio.svg',
};

const forceTop = () => {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

const ensureTop = () => {
  forceTop();
  requestAnimationFrame(forceTop);
  trackTimeout(forceTop, 0);
};

ensureTop();
document.addEventListener('DOMContentLoaded', ensureTop);
function isNearBottom(threshold = 80) {
  const doc = document.documentElement;
  const scrollTop = window.pageYOffset || doc.scrollTop || document.body.scrollTop || 0;
  const viewport = window.innerHeight || doc.clientHeight || 0;
  const fullHeight = Math.max(doc.scrollHeight, document.body.scrollHeight);
  return scrollTop + viewport >= fullHeight - threshold;
}

function scrollToBottom(force = false) {
  if (isBooting) return;
  if (!force && !isNearBottom()) return;
  const target = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  requestAnimationFrame(() => {
    window.scrollTo({ top: target, behavior: force ? 'auto' : 'smooth' });
  });
}

function scrollDuringAsciiReveal() {
  if (!isBooting && !isNearBottom()) return;
  const target = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  requestAnimationFrame(() => {
    window.scrollTo({ top: target, behavior: 'auto' });
  });
}

function createRow(type, glyphChar) {
  const shouldStick = isNearBottom();
  const row = document.createElement('div');
  row.className = type ? `row row--${type}` : 'row';
  const glyph = document.createElement('div');
  glyph.className = 'glyph';
  glyph.textContent = glyphChar || '';
  const content = document.createElement('div');
  content.className = 'content';
  row.append(glyph, content);
  stream.append(row);
  scrollToBottom(shouldStick);
  return { row, glyph, content };
}

function ensureRelativePosition(element) {
  if (!element) return;
  const computed = window.getComputedStyle(element);
  if (computed.position === 'static') {
    element.style.position = 'relative';
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function injectRabbitIntoRow(key, row) {
  if (!row || injectedRabbits.has(key)) return;
  const config = RABBIT_CONFIGS[key];
  if (!config) return;
  const content = row.querySelector('.content');
  if (!content) return;
  ensureRelativePosition(content);
  const rabbit = document.createElement('img');
  rabbit.src = 'src/rabbit.svg';
  rabbit.alt = 'Hidden rabbit';
  rabbit.className = 'rabbit-svg';
  rabbit.id = config.rabbitId;
  rabbit.setAttribute('aria-hidden', 'true');
  rabbit.style.top = `${config.top}px`;
  rabbit.style.left = `${config.left}px`;
  content.append(rabbit);
  row.classList.add('rabbit-row');
  registerRabbitRow(row);
  injectedRabbits.add(key);
}

function ensureRowWrapped(row) {
  if (!row) return [];
  if (!isRabbitFeatureEnabled()) {
    return rabbitRowSpans.get(row) || [];
  }
  if (rabbitRowSpans.has(row)) return rabbitRowSpans.get(row);
  const content = row.querySelector('.content');
  if (!content) {
    rabbitRowSpans.set(row, []);
    return [];
  }
  if (!rabbitRowOriginalContent.has(row)) {
    rabbitRowOriginalContent.set(row, content.innerHTML);
  }
  const spans = [];
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node || !node.parentElement) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (parent.closest('.ascii-photo, .section-ascii, .ascii')) {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.closest('pre,code,a,button,input,textarea,svg,img')) {
        return NodeFilter.FILTER_REJECT;
      }
      return node.textContent ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const replacements = [];
  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    if (!textNode || !textNode.textContent) continue;
    replacements.push(textNode);
  }
  replacements.forEach((node) => {
    const text = node.textContent;
    const frag = document.createDocumentFragment();
    const tokens = text.split(/(\s+)/);
    tokens.forEach((token) => {
      if (!token) return;
      if (/^\s+$/.test(token)) {
        frag.append(document.createTextNode(token));
        return;
      }
      const wordWrapper = document.createElement('span');
      wordWrapper.className = 'fx-word';
      for (let i = 0; i < token.length; i += 1) {
        const charSpan = document.createElement('span');
        charSpan.className = 'fx-ch';
        charSpan.textContent = token[i];
        wordWrapper.append(charSpan);
        spans.push(charSpan);
      }
      frag.append(wordWrapper);
    });
    node.parentNode.replaceChild(frag, node);
  });
  rabbitRowSpans.set(row, spans);
  return spans;
}

function restoreRabbitRowText(row) {
  if (!row) return;
  const original = rabbitRowOriginalContent.get(row);
  if (!original) return;
  const content = row.querySelector('.content');
  if (!content) return;
  content.innerHTML = original;
  rabbitRowSpans.delete(row);
}

function initRabbitLens() {
  if (!isRabbitFeatureEnabled()) return;
  if (lensInitialized) return;
  lensInitialized = true;
  warpCircleEl = document.getElementById('warpCircle');
  rabbitTrophyEl = document.getElementById('rabbitTrophy');
  rabbitTrophyIcons = Array.from(document.querySelectorAll('#rabbitTrophy .rabbit-trophy__icon'));
  updateTrophyIcons(true);
  window.addEventListener('rabbit:capture', handleRabbitCapture);
  window.addEventListener('mousemove', handleLensPointerMove);
  window.addEventListener('mouseleave', handleLensPointerLeave);
  window.addEventListener('scroll', handleLensScroll, { passive: true });
  window.addEventListener('click', handleLensClick);
}

function registerRabbitRow(row) {
  if (!row || rabbitRows.has(row)) return;
  rabbitRows.add(row);
  if (isRabbitFeatureEnabled()) {
    ensureRowWrapped(row);
  } else {
    restoreRabbitRowText(row);
  }
  if (isRabbitFeatureEnabled()) {
    initRabbitLens();
  }
}

function handleLensPointerMove(event) {
  if (!isRabbitFeatureEnabled()) return;
  const row = event.target.closest('.rabbit-row');
  if (!row || !rabbitRows.has(row)) {
    deactivateRabbitRow();
    return;
  }
  lensPointerX = event.clientX;
  lensPointerY = event.clientY;
  activateRabbitRow(row);
}

function handleLensPointerLeave() {
  if (!isRabbitFeatureEnabled()) return;
  deactivateRabbitRow();
}

function handleLensScroll() {
  if (!isRabbitFeatureEnabled()) return;
  if (!activeRabbitRow) return;
  const rect = activeRabbitRow.getBoundingClientRect();
  if (
    lensPointerX < rect.left ||
    lensPointerX > rect.right ||
    lensPointerY < rect.top ||
    lensPointerY > rect.bottom
  ) {
    deactivateRabbitRow();
    return;
  }
  scheduleRepel(true);
  revealRabbits(activeRabbitRow);
}

function activateRabbitRow(row) {
  if (!isRabbitFeatureEnabled()) return;
  if (!row) return;
  if (activeRabbitRow !== row) {
    resetActiveRow();
    activeRabbitRow = row;
    activeRowSpans = ensureRowWrapped(row);
  }
  document.body.classList.add('is-warping');
  moveLensCircle();
  revealRabbits(row);
  updateLensCursor();
  scheduleRepel();
}

function deactivateRabbitRow() {
  if (!activeRabbitRow) return;
  cancelRepelFrame();
  hideRabbits(activeRabbitRow);
  resetActiveRow();
  document.body.classList.remove('is-warping');
  document.body.classList.remove('cursor-pointer');
  removeRabbitHoverPulse();
  if (warpCircleEl) {
    warpCircleEl.style.transform = 'translate(-9999px, -9999px)';
  }
}

function cancelRepelFrame() {
  if (!repelFrame) return;
  cancelAnimationFrame(repelFrame);
  repelFrame = null;
}

function resetActiveRow() {
  if (!activeRabbitRow) return;
  const spans = rabbitRowSpans.get(activeRabbitRow) || [];
  spans.forEach((span) => {
    span.style.transitionDuration = '';
    span.style.transform = 'translate3d(0,0,0)';
  });
  activeRabbitRow = null;
  activeRowSpans = [];
}

function moveLensCircle() {
  if (!warpCircleEl) return;
  const size = LENS_SIZE;
  const x = lensPointerX - size / 2;
  const y = lensPointerY - size / 2;
  warpCircleEl.style.transform = `translate(${x}px, ${y}px)`;
}

function revealRabbits(row) {
  if (!isRabbitFeatureEnabled()) return;
  const rabbits = row.querySelectorAll('.rabbit-svg');
  rabbits.forEach((rabbit) => {
    if (rabbit.dataset.captured === 'true') {
      rabbit.style.opacity = '0';
      rabbit.style.setProperty('--lens-rel-x', '-9999px');
      rabbit.style.setProperty('--lens-rel-y', '-9999px');
      return;
    }
    const rect = rabbit.getBoundingClientRect();
    const relX = lensPointerX - rect.left;
    const relY = lensPointerY - rect.top;
    rabbit.style.opacity = '1';
    rabbit.style.setProperty('--lens-rel-x', `${relX}px`);
    rabbit.style.setProperty('--lens-rel-y', `${relY}px`);
    rabbit.style.setProperty('--lens-radius', `${CIRCLE_RADIUS}px`);
  });
  updateLensCursor();
  updateRabbitHoverPulse();
}

function hideRabbits(row) {
  row.querySelectorAll('.rabbit-svg').forEach((rabbit) => {
    rabbit.style.opacity = '0';
    rabbit.style.setProperty('--lens-rel-x', '-9999px');
    rabbit.style.setProperty('--lens-rel-y', '-9999px');
  });
}

function cleanupRabbitRow(row) {
  if (!row) return;
  if (row.querySelector('.rabbit-svg')) return;
  const content = row.querySelector('.content');
  const originalHTML = rabbitRowOriginalContent.get(row);
  if (content && typeof originalHTML === 'string') {
    content.innerHTML = originalHTML;
  }
  rabbitRowOriginalContent.delete(row);
  row.classList.remove('rabbit-row');
  rabbitRows.delete(row);
  rabbitRowSpans.delete(row);
  if (activeRabbitRow === row) {
    deactivateRabbitRow();
  }
}

function updateLensCursor() {
  if (!activeRabbitRow) {
    document.body.classList.remove('cursor-pointer');
    return;
  }
  const rabbit = getRabbitUnderPointer(activeRabbitRow);
  document.body.classList.toggle('cursor-pointer', Boolean(rabbit));
}

function scheduleRepel(force = false) {
  if (!isRabbitFeatureEnabled()) return;
  if (!activeRabbitRow || !activeRowSpans.length) return;
  if (force) {
    applyRepel();
    return;
  }
  if (repelFrame) return;
  repelFrame = requestAnimationFrame(() => {
    repelFrame = null;
    applyRepel();
  });
}

function applyRepel() {
  if (!isRabbitFeatureEnabled()) return;
  if (!activeRabbitRow || !activeRowSpans.length) return;
  activeRowSpans.forEach((span) => {
    const rect = span.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = cx - lensPointerX;
    const dy = cy - lensPointerY;
    const dist = Math.hypot(dx, dy) || 0.0001;
    if (dist < REPEL_RADIUS) {
      const t = 1 - dist / REPEL_RADIUS;
      const push = t * MAX_REPEL_PUSH;
      const dirX = dx / dist;
      const dirY = dy / dist;
      const tx = dirX * push;
      const ty = dirY * push;
      span.style.transitionDuration = '40ms';
      span.style.transform = `translate(${tx}px, ${ty}px)`;
    } else {
      span.style.transitionDuration = '220ms';
      span.style.transform = 'translate3d(0,0,0)';
    }
  });
}

function getRabbitUnderPointer(row) {
  if (!isRabbitFeatureEnabled()) return null;
  const rabbits = row.querySelectorAll('.rabbit-svg');
  for (const rabbit of rabbits) {
    if (rabbit.dataset.captured === 'true') continue;
    const rect = rabbit.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(cx - lensPointerX, cy - lensPointerY);
    if (dist <= CIRCLE_RADIUS) {
      return rabbit;
    }
  }
  return null;
}

function handleLensClick(event) {
  if (!isRabbitFeatureEnabled()) return;
  if (!activeRabbitRow) return;
  const rabbit = getRabbitUnderPointer(activeRabbitRow);
  if (!rabbit) return;
  triggerRabbitExplosion(rabbit);
  rabbit.dataset.captured = 'true';
  rabbit.style.opacity = '0';
  rabbit.remove();
  cleanupRabbitRow(activeRabbitRow);
  window.dispatchEvent(new CustomEvent('rabbit:capture', { detail: { rabbitId: rabbit.id || null } }));
  event.preventDefault();
  updateLensCursor();
}

function handleRabbitCapture() {
  if (!isRabbitFeatureEnabled()) return;
  caughtRabbits += 1;
  updateTrophyIcons();
  updateRabbitHoverPulse();
  if (!endgameTriggered && caughtRabbits >= TOTAL_RABBITS) {
    const elapsedSeconds = Math.round((performance.now() - gameStart) / 1000);
    runEndgame(elapsedSeconds);
  }
}

function updateTrophyIcons(init = false) {
  if (!rabbitTrophyEl) {
    rabbitTrophyEl = document.getElementById('rabbitTrophy');
  }
  if (!rabbitTrophyIcons.length) {
    rabbitTrophyIcons = Array.from(document.querySelectorAll('#rabbitTrophy .rabbit-trophy__icon'));
  }
  if (!rabbitTrophyEl || !rabbitTrophyIcons.length) return;
  if (!isRabbitFeatureEnabled()) {
    hideRabbitTrophyPanel();
    return;
  }
  rabbitTrophyIcons.forEach((icon, index) => {
    if (index < caughtRabbits) {
      icon.classList.add('rabbit-trophy__icon--unlocked');
      icon.classList.remove('rabbit-trophy__icon--pulsing');
    } else {
      icon.classList.remove('rabbit-trophy__icon--unlocked');
      icon.classList.remove('rabbit-trophy__icon--pulsing');
    }
  });
  if (caughtRabbits > 0) {
    rabbitTrophyEl.classList.add('is-visible');
    rabbitTrophyEl.setAttribute('aria-hidden', 'false');
  } else if (!init) {
    hideRabbitTrophyPanel();
  }
}

function updateRabbitHoverPulse() {
  if (!isRabbitFeatureEnabled() || !rabbitTrophyIcons.length) return;
  if (!rabbitTrophyIcons.length) return;
  const nextIcon = rabbitTrophyIcons[caughtRabbits] || null;
  rabbitTrophyIcons.forEach((icon) => icon.classList.remove('rabbit-trophy__icon--pulsing'));
  if (activeRabbitRow && nextIcon) {
    nextIcon.classList.add('rabbit-trophy__icon--pulsing');
  }
}

function removeRabbitHoverPulse() {
  if (!rabbitTrophyIcons.length) return;
  rabbitTrophyIcons.forEach((icon) => icon.classList.remove('rabbit-trophy__icon--pulsing'));
}

function resetTrophyUI() {
  caughtRabbits = 0;
  if (!rabbitTrophyEl) {
    rabbitTrophyEl = document.getElementById('rabbitTrophy');
  }
  if (!rabbitTrophyIcons.length) {
    rabbitTrophyIcons = Array.from(document.querySelectorAll('#rabbitTrophy .rabbit-trophy__icon'));
  }
  if (rabbitTrophyIcons.length) {
    rabbitTrophyIcons.forEach((icon) => {
      icon.classList.remove('rabbit-trophy__icon--unlocked', 'rabbit-trophy__icon--pulsing');
    });
  }
  if (rabbitTrophyEl) {
    rabbitTrophyEl.classList.remove('is-visible');
    rabbitTrophyEl.setAttribute('aria-hidden', 'true');
  }
}

function hideRabbitTrophyPanel() {
  if (!rabbitTrophyEl) {
    rabbitTrophyEl = document.getElementById('rabbitTrophy');
  }
  if (!rabbitTrophyIcons.length) {
    rabbitTrophyIcons = Array.from(document.querySelectorAll('#rabbitTrophy .rabbit-trophy__icon'));
  }
  if (rabbitTrophyEl) {
    rabbitTrophyEl.classList.remove('is-visible');
    rabbitTrophyEl.setAttribute('aria-hidden', 'true');
  }
  rabbitTrophyIcons.forEach((icon) => icon.classList.remove('rabbit-trophy__icon--unlocked', 'rabbit-trophy__icon--pulsing'));
}

function disableRabbitFeaturesForMobile() {
  if (activeRabbitRow) {
    hideRabbits(activeRabbitRow);
    resetActiveRow();
  }
  rabbitRows.forEach((row) => restoreRabbitRowText(row));
  document.body.classList.remove('is-warping', 'cursor-pointer');
  hideRabbitTrophyPanel();
}

function handleRabbitResponsiveChange() {
  if (!isRabbitFeatureEnabled()) {
    disableRabbitFeaturesForMobile();
    return;
  }
  rabbitRows.forEach((row) => ensureRowWrapped(row));
  if (!lensInitialized && rabbitRows.size) {
    initRabbitLens();
  }
  updateTrophyIcons(true);
}

function resetRabbitLensState() {
  deactivateRabbitRow();
  rabbitRows.clear();
}

function ensureEndgameElements() {
  if (!endgameOverlay) {
    endgameOverlay = document.getElementById('endgame-overlay');
  }
  if (!endgameCanvas) {
    endgameCanvas = document.getElementById('pixel-wipe-canvas');
  }
  if (!endgameWhiteScreen) {
    endgameWhiteScreen = document.getElementById('white-screen');
  }
  if (!endgameTypewriter) {
    endgameTypewriter = document.getElementById('typewriter');
  }
  if (!endgameContent) {
    endgameContent = document.getElementById('endgame-content');
  }
  if (!endgameIllustration) {
    endgameIllustration = document.getElementById('endgame-illustration');
  }
}

function lockPageInteractions() {
  if (window.ENDGAME_ACTIVE) return;
  window.ENDGAME_ACTIVE = true;
  endgameScrollY = window.scrollY || window.pageYOffset || 0;
  document.body.classList.add('endgame-lock');
  document.body.style.position = 'fixed';
  document.body.style.top = `-${endgameScrollY}px`;
  document.body.style.width = '100%';
  const stopper = (event) => {
    if (!window.ENDGAME_ACTIVE) return;
    event.preventDefault();
    event.stopPropagation();
  };
  ENDGAME_BLOCKED_EVENTS.forEach((type) => {
    window.addEventListener(type, stopper, { passive: false, capture: true });
  });
  endgameInteractionBlocker = stopper;
}

function releaseInteractionBlockers() {
  if (!endgameInteractionBlocker) return;
  ENDGAME_BLOCKED_EVENTS.forEach((type) => {
    window.removeEventListener(type, endgameInteractionBlocker, { capture: true });
  });
  endgameInteractionBlocker = null;
  window.ENDGAME_ACTIVE = false;
  document.body.classList.remove('endgame-lock');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, endgameScrollY || 0);
}

async function revealEndgameIllustration(preloadedImagesPromise = null) {
  ensureEndgameElements();
  if (!endgameIllustration || !ENDGAME_ILLUSTRATION_ROWS.length) {
    return;
  }
  endgameIllustration.innerHTML = '';
  endgameIllustration.setAttribute('aria-hidden', 'false');
  const preloadedImages = await (preloadedImagesPromise || preloadImages(ENDGAME_ILLUSTRATION_ROWS));
  const rows = ENDGAME_ILLUSTRATION_ROWS.map((src) => {
    const row = document.createElement('div');
    row.className = 'endgame-illustration__row';
    const cachedSrc = getPreloadedImage(src, preloadedImages);
    const img = document.createElement('img');
    img.src = cachedSrc || src;
    img.alt = '';
    img.decoding = 'async';
    img.loading = 'eager';
    img.draggable = false;
    row.append(img);
    return row;
  });
  if (!rows.length) {
    return;
  }
  const step = ENDGAME_ILLUSTRATION_REVEAL_DURATION / rows.length;
  await new Promise((resolve) => {
    let index = 0;
    const revealNext = () => {
      if (index >= rows.length) {
        resolve();
        return;
      }
      const row = rows[index];
      endgameIllustration.append(row);
      requestAnimationFrame(() => {
        row.classList.add('is-visible');
      });
      index += 1;
      trackTimeout(revealNext, step);
    };
    revealNext();
  });
}

function resetEndgameState() {
  endgameTriggered = false;
  window.ENDGAME_ACTIVE = false;
  releaseInteractionBlockers();
  ensureEndgameElements();
  if (endgameOverlay) {
    endgameOverlay.classList.remove('is-active');
    endgameOverlay.setAttribute('aria-hidden', 'true');
    endgameOverlay.style.pointerEvents = 'none';
  }
  if (endgameCanvas) {
    const ctx = endgameCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, endgameCanvas.width || 0, endgameCanvas.height || 0);
    }
    endgameCanvas.style.display = 'none';
  }
  if (endgameWhiteScreen) {
    endgameWhiteScreen.style.display = 'none';
  }
  if (endgameContent) {
    endgameContent.style.display = 'none';
    endgameContent.setAttribute('aria-hidden', 'true');
  }
  if (endgameIllustration) {
    endgameIllustration.innerHTML = '';
    endgameIllustration.setAttribute('aria-hidden', 'true');
  }
  if (endgameTypewriter) {
    endgameTypewriter.style.display = 'none';
    endgameTypewriter.innerHTML = '';
    endgameTypewriter.setAttribute('aria-hidden', 'true');
  }
}

function typeText(container, text, speed = 30) {
  return new Promise((resolve) => {
    let index = 0;
    function tick() {
      if (index >= text.length) {
        resolve();
        return;
      }
      const char = text[index];
      if (char === '\n') {
        container.appendChild(document.createElement('br'));
      } else {
        container.append(char);
      }
      index += 1;
      setTimeout(tick, speed);
    }
    tick();
  });
}

function typeTextIntoElement(element, text, speed = 30) {
  return new Promise((resolve) => {
    let index = 0;
    function step() {
      if (index >= text.length) {
        resolve();
        return;
      }
      element.textContent += text[index];
      index += 1;
      setTimeout(step, speed);
    }
    step();
  });
}

async function runPixelAssembleWipe(canvas, snapshot, duration = 2000, tileSize = 32) {
  if (!canvas || !snapshot) return;
  const ctx = canvas.getContext('2d');
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  canvas.style.display = 'block';
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, width, height);

  const cols = Math.ceil(width / tileSize);
  const rows = Math.ceil(height / tileSize);
  const totalTiles = cols * rows;
  const tiles = shuffle(Array.from({ length: totalTiles }, (_, index) => index));
  let paintedCount = 0;

  function paintTile(tileIndex) {
    const col = tileIndex % cols;
    const row = Math.floor(tileIndex / cols);
    ctx.fillStyle = '#fff';
    ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
  }

  await new Promise((resolve) => {
    let startTime = null;
    function frame(now) {
      if (startTime === null) {
        startTime = now;
      }
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const target = Math.floor(eased * totalTiles);
      while (paintedCount < target) {
        paintTile(tiles[paintedCount]);
        paintedCount += 1;
      }
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        while (paintedCount < totalTiles) {
          paintTile(tiles[paintedCount]);
          paintedCount += 1;
        }
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });
}

function triggerRabbitExplosion(rabbit) {
  if (!isRabbitFeatureEnabled()) return;
  if (!rabbit || rabbit.dataset.captured === 'true') return;
  const rect = rabbit.getBoundingClientRect();
  const explosion = document.createElement('div');
  explosion.className = 'rabbit-explosion';
  explosion.style.left = `${rect.left}px`;
  explosion.style.top = `${rect.top}px`;
  explosion.style.width = `${rect.width}px`;
  explosion.style.height = `${rect.height}px`;
  document.body.append(explosion);

  const PARTICLES = 30;
  for (let i = 0; i < PARTICLES; i += 1) {
    const particle = document.createElement('span');
    particle.className = 'rabbit-particle';
    particle.style.left = `${Math.random() * rect.width}px`;
    particle.style.top = `${Math.random() * rect.height}px`;
    explosion.append(particle);
  }

  requestAnimationFrame(() => {
    explosion.querySelectorAll('.rabbit-particle').forEach((particle) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 70;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      particle.style.transform = `translate(${dx}px, ${dy}px)`;
      particle.style.opacity = '0';
    });
  });

  setTimeout(() => {
    explosion.remove();
  }, 550);
}

async function runEndgame(elapsedSeconds) {
  if (endgameTriggered) return;
  ensureEndgameElements();
  if (!endgameOverlay) return;
  endgameTriggered = true;
  lockPageInteractions();
  const illustrationPreload = ENDGAME_ILLUSTRATION_ROWS.length
    ? preloadImages(ENDGAME_ILLUSTRATION_ROWS)
    : Promise.resolve(new Map());

  let snapshot = null;
  if (window.html2canvas) {
    const target = document.getElementById('stream') || document.body;
    try {
      snapshot = await window.html2canvas(target, { backgroundColor: null, scale: 1 });
    } catch (error) {
      snapshot = null;
    }
  }

  endgameOverlay.classList.add('is-active');
  endgameOverlay.setAttribute('aria-hidden', 'false');
  endgameOverlay.style.pointerEvents = 'auto';

  if (endgameWhiteScreen) endgameWhiteScreen.style.display = 'none';
  if (endgameContent) {
    endgameContent.style.display = 'none';
    endgameContent.setAttribute('aria-hidden', 'true');
  }
  if (endgameIllustration) {
    endgameIllustration.innerHTML = '';
    endgameIllustration.setAttribute('aria-hidden', 'true');
  }
  if (endgameTypewriter) {
    endgameTypewriter.style.display = 'none';
    endgameTypewriter.innerHTML = '';
    endgameTypewriter.setAttribute('aria-hidden', 'true');
  }

  if (endgameCanvas && snapshot) {
    await runPixelAssembleWipe(endgameCanvas, snapshot);
  } else if (endgameCanvas) {
    endgameCanvas.style.display = 'none';
  }

  if (endgameWhiteScreen) endgameWhiteScreen.style.display = 'block';
  if (endgameCanvas) endgameCanvas.style.display = 'none';
  if (endgameContent) {
    endgameContent.style.display = 'flex';
    endgameContent.setAttribute('aria-hidden', 'false');
  }

  await revealEndgameIllustration(illustrationPreload);

  if (endgameTypewriter) {
    endgameTypewriter.style.display = 'block';
    endgameTypewriter.setAttribute('aria-hidden', 'false');
    releaseInteractionBlockers();
    const beforeLink = `Congratulations #${elapsedSeconds},\nYou followed my White Rabbits and found me!\nContact me `;
    const afterLink = ' if you have any questions.\n\n';
    await typeText(endgameTypewriter, beforeLink, 16);
    const link = document.createElement('a');
    link.href = 'https://www.linkedin.com/in/maximkich/';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'here';
    endgameTypewriter.appendChild(link);
    await typeText(endgameTypewriter, afterLink, 16);
    await typeText(endgameTypewriter, '\n\nSpecial thanks to:\n', 16);
    const typeThanksLine = async (prefix, linkText, href) => {
      await typeText(endgameTypewriter, prefix, 16);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      endgameTypewriter.append(anchor);
      await typeTextIntoElement(anchor, linkText, 16);
      await typeText(endgameTypewriter, '\n', 16);
    };
    await typeThanksLine('Yuki Shindo for ', 'oh-my-logo', 'https://github.com/shinshin86/oh-my-logo');
    await typeThanksLine('Codegrid for ', 'Text Hover Effect', 'https://youtu.be/BgBtxSGEows?si=SNJM0HumCCLEY1q3');
    await typeThanksLine('Niklas von Hertzen for ', 'html2canvas', 'https://github.com/niklasvh/html2canvas');
    await typeThanksLine('JetBrains for ', 'JetBrains Mono', 'https://www.jetbrains.com/lp/mono/');
    await typeText(endgameTypewriter, '\nThe design of this website was inspired by The Matrix, Lumon Industries Software from Severance, and CLI experiences such as Claude Code and OpenCode.', 16);
    await typeText(endgameTypewriter, '\n\n© 2026 Maxim Kich | ', 16);
    const impressumLink = document.createElement('a');
    impressumLink.href = '/impressum.html';
    impressumLink.target = '_blank';
    impressumLink.rel = 'noopener noreferrer';
    impressumLink.className = 'link';
    endgameTypewriter.append(impressumLink);
    await typeTextIntoElement(impressumLink, 'Impressum', 16);
  } else {
    releaseInteractionBlockers();
  }
}

function scrollPromptIntoView(promptRow, force = false) {
  if (!promptRow) return;
  if (!force && !isNearBottom()) return;
  requestAnimationFrame(() => {
    promptRow.scrollIntoView({ block: 'end', behavior: 'auto' });
  });
}

function normalizeCommand(input = '') {
  if (!input) return '';
  const firstLine = input.split('\n')[0].trim();
  if (!firstLine) return '';
  const cdMatch = firstLine.match(/^cd\s+/i);
  if (cdMatch) {
    return firstLine.slice(cdMatch[0].length).trim();
  }
  return firstLine;
}

function appendSystem(text, glyph = SYSTEM_GLYPH) {
  const { row, content } = createRow('system', glyph);
  content.textContent = text;
  return row;
}

function appendSystemHTML(html, glyph = SYSTEM_GLYPH) {
  const { row, content } = createRow('system', glyph);
  content.innerHTML = html;
  return row;
}

function revealAsciiBlocks({
  blocks = [],
  duration = 900,
  useRow = false,
  containerClass = 'section-ascii-block',
  onCreated = null,
} = {}) {
  if (!blocks.length) return Promise.resolve(null);
  return new Promise((resolve) => {
    let targetElement;
    let hostRow = null;
    if (useRow) {
      const { row, content } = createRow('system', '');
      hostRow = row;
      targetElement = content;
    } else {
      const wrapper = document.createElement('div');
      wrapper.className = containerClass;
      stream.append(wrapper);
      scrollToBottom();
      targetElement = wrapper;
    }

    const sequence = [];
    blocks.forEach(({ ascii, className, leadingBlankLine }) => {
      if (!ascii) return;
      const pre = document.createElement('pre');
      pre.className = className || 'section-ascii';
      pre.textContent = '';
      targetElement.append(pre);
      const sanitized = ascii.replace(/^\n+/, '');
      const lines = sanitized.split('\n');
      if (leadingBlankLine) {
        lines.unshift('');
      }
      lines.forEach((line, idx) => {
        sequence.push({
          element: pre,
          line,
          prependNewline: idx > 0,
        });
      });
    });

    if (onCreated) onCreated(targetElement);

    if (!sequence.length) {
      resolve(hostRow || targetElement);
      return;
    }

    const step = duration / sequence.length;
    let index = 0;

    const writeLine = () => {
      if (index >= sequence.length) {
        resolve(hostRow || targetElement);
        return;
      }
      const { element, line, prependNewline } = sequence[index];
      element.textContent += (prependNewline ? '\n' : '') + line;
      scrollDuringAsciiReveal();
      index += 1;
      trackTimeout(writeLine, step);
    };

    writeLine();
  });
}

function appendSectionAscii(key) {
  const isMobileView = window.innerWidth < RABBIT_MIN_WIDTH;
  if (isMobileView && SECTION_ASCII_IMAGES[key]) {
    return appendSectionAsciiImage(SECTION_ASCII_IMAGES[key]);
  }
  const ascii = SECTION_ASCII[key];
  if (!ascii) return null;
  return revealAsciiBlocks({
    blocks: [{ ascii, className: 'section-ascii' }],
    duration: 900,
    useRow: true,
  });
}

function appendSectionAsciiImage(src) {
  if (!src) return Promise.resolve(null);
  const { row, content } = createRow('system', '');
  const wrapper = document.createElement('div');
  wrapper.className = 'section-ascii-image';
  const img = document.createElement('img');
  img.src = src;
  img.alt = '';
  img.decoding = 'async';
  img.loading = 'lazy';
  img.draggable = false;
  wrapper.append(img);
  content.append(wrapper);
  const waitForImage = () => new Promise((resolve) => {
    if (img.complete) {
      resolve();
      return;
    }
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  });
  return waitForImage().then(() => row);
}

function appendContactLinksMessage() {
  const rows = isMobileViewport() ? CONTACT_MESSAGE_ROWS_MOBILE : CONTACT_MESSAGE_ROWS;
  return revealSequentialSystemMessages(rows);
}

function waitAtLeast(ms = 0) {
  return new Promise((resolve) => {
    trackTimeout(resolve, ms);
  });
}

const preloadedImageCache = new Map();

function createImagePreload(src) {
  if (!src) {
    return Promise.resolve({ src: null, objectUrl: null });
  }
  const cached = preloadedImageCache.get(src);
  if (cached && cached.objectUrl) {
    return Promise.resolve({ src, objectUrl: cached.objectUrl });
  }
  if (cached && cached.promise) {
    return cached.promise;
  }
  const promise = fetch(src, { credentials: 'same-origin' })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to preload image: ${src}`);
      }
      return response.blob();
    })
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      preloadedImageCache.set(src, { objectUrl });
      return { src, objectUrl };
    })
    .catch(() => {
      preloadedImageCache.delete(src);
      return { src, objectUrl: null };
    });
  preloadedImageCache.set(src, { promise });
  return promise;
}

function preloadImages(srcs = []) {
  if (!Array.isArray(srcs) || !srcs.length) {
    return Promise.resolve(new Map());
  }
  const uniqueSrcs = Array.from(new Set(srcs.filter(Boolean)));
  if (!uniqueSrcs.length) {
    return Promise.resolve(new Map());
  }
  const loaders = uniqueSrcs.map((src) => createImagePreload(src));
  return Promise.all(loaders).then((entries) => {
    const map = new Map();
    entries.forEach(({ src, objectUrl }) => {
      if (src && objectUrl) {
        map.set(src, objectUrl);
      }
    });
    return map;
  });
}

function waitForImagesWithMinDelay(srcs = [], minMs = 1500) {
  return Promise.all([preloadImages(srcs), waitAtLeast(minMs)]).then(([images]) => images);
}

function getPreloadedImage(src, preferredMap) {
  if (!src) return null;
  if (preferredMap && typeof preferredMap.get === 'function') {
    const mapped = preferredMap.get(src);
    if (mapped) return mapped;
  }
  const cached = preloadedImageCache.get(src);
  if (cached && cached.objectUrl) {
    return cached.objectUrl;
  }
  return null;
}

function destroyCurrentPromptRow() {
  if (currentPrompt && currentPrompt.row && currentPrompt.row.isConnected) {
    currentPrompt.row.remove();
  }
  currentPrompt = null;
}

function trimAsciiLeadingCharacters(ascii = '') {
  return ascii
    .split('\n')
    .map((line) => (line.length ? line.slice(1) : ''))
    .join('\n');
}

function appendAboutPhoto() {
  if (window.innerWidth < RABBIT_MIN_WIDTH) {
    const { row, content } = createRow('system', '');
    const img = document.createElement('img');
    img.className = 'ascii-photo-mobile';
    img.src = 'img/mobile/ascii_portrait_inverted.png';
    img.alt = 'ASCII portrait';
    img.draggable = false;
    img.decoding = 'async';
    img.loading = 'lazy';
    img.dataset.altSrc = 'img/mobile/ascii_portrait.png';
    img.dataset.primarySrc = 'img/mobile/ascii_portrait_inverted.png';
    img.addEventListener('click', () => {
      const current = img.src.includes('ascii_portrait_inverted.png');
      img.src = current ? img.dataset.altSrc : img.dataset.primarySrc;
    });
    content.append(img);
    return Promise.resolve(row);
  }
  return revealAsciiBlocks({
    blocks: [{ ascii: ASCII_ABOUT_PHOTO, className: 'ascii ascii-photo' }],
    duration: 900,
    useRow: true,
  }).then((row) => {
    if (!row) return row;
    const content = row.querySelector('.content');
    if (!content) return row;
    const pre = content.querySelector('pre');
    if (pre) {
      pre.tabIndex = 0;
      let selected = false;
      pre.addEventListener('click', () => {
        const selection = window.getSelection();
        if (!selection) return;
        if (selected) {
          selection.removeAllRanges();
          selected = false;
          return;
        }
        const range = document.createRange();
        range.selectNodeContents(pre);
        selection.removeAllRanges();
        selection.addRange(range);
        selected = true;
      });
    }
    return row;
  });
}

function getOtherPortfolioOptions(currentId) {
  return PORTFOLIO_SELECTOR_OPTIONS.filter((option) => option.id !== currentId);
}

function getPortfolioOptionById(id) {
  return PORTFOLIO_SELECTOR_OPTIONS.find((opt) => opt.id === id);
}

function getPortfolioCaseImages(caseId) {
  if (!caseId) return [];
  if (isMobileViewport()) {
    const mobileImages = PORTFOLIO_CASE_IMAGES_MOBILE[caseId];
    if (Array.isArray(mobileImages) && mobileImages.length) {
      return mobileImages;
    }
  }
  return PORTFOLIO_CASES[caseId]?.images || [];
}

function copyTextToClipboardSafe(value) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    return navigator.clipboard.writeText(value);
  }
  return Promise.reject(new Error('Clipboard API unavailable'));
}

function revealExperienceProgressive() {
  EXPERIENCE_CHUNKS.forEach((chunk, idx) => {
    trackTimeout(() => {
      const row = appendSystemHTML(chunk.replace(/\n/g, '<br>'));
      if (chunk.includes('Head of UI')) {
        injectRabbitIntoRow('experienceHead', row);
      } else if (chunk.includes('CEO / Design Lead (B2B / B2C / SaaS)')) {
        injectRabbitIntoRow('experienceCeo', row);
      }
      if (idx === EXPERIENCE_CHUNKS.length - 1) {
        trackTimeout(() => setupPrompt(), 50);
      }
    }, SEQUENTIAL_ROW_DELAY * idx);
  });
}

function appendSystemLoadingWithAccordion({
  loadingText,
  doneText,
  steps = [],
  duration = 800,
} = {}) {
  const { row, glyph, content } = createRow('system', SYSTEM_GLYPH);
  row.setAttribute('role', 'status');
  glyph.classList.add('glyph--loading');
  content.classList.add('loader');
  content.textContent = loadingText;

  return new Promise((resolve) => {
    trackTimeout(() => {
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

function createPortfolioLoadingElements() {
  const container = document.createElement('div');
  container.className = 'portfolio-loading';
  const barSpan = document.createElement('span');
  barSpan.className = 'portfolio-loading__bar';
  const percentSpan = document.createElement('span');
  percentSpan.className = 'portfolio-loading__percent';
  container.append(barSpan, percentSpan);
  return { container, barSpan, percentSpan };
}

function animatePortfolioLoading({ container, barSpan, percentSpan }, holdPercent = 90) {
  const totalSegments = 20;
  const filledChar = '█';
  const emptyChar = '░';
  const steps = 10;
  const states = Array.from({ length: steps + 1 }, (_, idx) => {
    const percent = idx * 10;
    const filledCount = Math.round((percent / 100) * totalSegments);
    const bar = filledChar.repeat(filledCount) + emptyChar.repeat(totalSegments - filledCount);
    return { bar, percent };
  });
  const holdIndex = states.findIndex((state) => state.percent >= holdPercent && holdPercent < 100);
  const targetHoldIndex = holdIndex === -1 ? states.length - 1 : holdIndex;
  let resolvePromise;
  let rejectPromise;
  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  let index = 0;
  let timerId = null;
  let released = false;
  let holdReached = false;
  let settled = false;

  const clearTimer = () => {
    if (timerId != null) {
      clearTrackedTimeout(timerId);
      timerId = null;
    }
  };

  const stepDelay = 200;
  const step = () => {
    const state = states[index];
    barSpan.textContent = state.bar;
    percentSpan.textContent = `${state.percent}%`;
    if (!released && index >= targetHoldIndex && index < states.length - 1) {
      holdReached = true;
      return;
    }
    index += 1;
    if (index < states.length) {
      timerId = trackTimeout(step, stepDelay);
    } else {
      settled = true;
      container.classList.add('portfolio-loading--complete');
      resolvePromise();
    }
  };

  step();

  const release = () => {
    if (released || settled) return;
    released = true;
    if (holdReached) {
      holdReached = false;
      index += 1;
      step();
    } else if (timerId == null) {
      step();
    }
  };

  const fail = () => {
    if (settled) return;
    clearTimer();
    settled = true;
    container.classList.remove('portfolio-loading--complete');
    container.classList.add('portfolio-loading--error');
    rejectPromise(new Error('portfolio:loading-failed'));
  };

  return { promise, release, fail };
}

function appendPortfolioHeader(title, categoryText) {
  const { row, content } = createRow('system', SYSTEM_GLYPH);
  const header = document.createElement('div');
  header.className = 'portfolio-header';
  const left = document.createElement('div');
  left.className = 'portfolio-header__left';
  const topRow = document.createElement('div');
  topRow.className = 'portfolio-header__top';
  const titleEl = document.createElement('div');
  titleEl.className = 'portfolio-header__title';
  titleEl.textContent = title || 'Loading project';
  topRow.append(titleEl);
  const loadingEls = createPortfolioLoadingElements();
  topRow.append(loadingEls.container);
  left.append(topRow);
  let categoryEl = null;
  if (categoryText) {
    categoryEl = document.createElement('div');
    categoryEl.className = 'portfolio-header__category';
    categoryEl.textContent = categoryText;
    categoryEl.hidden = true;
    left.append(categoryEl);
  }
  header.append(left);
  content.append(header);
  const loadingController = animatePortfolioLoading(loadingEls, 90);
  return {
    row,
    progress: loadingController.promise,
    showCategory: () => {
      if (categoryEl) {
        categoryEl.hidden = false;
      }
    },
    completeLoading: loadingController.release,
    failLoading: loadingController.fail,
  };
}

function appendPortfolioContentRow(item, title, currentRowRef, preloadedImages) {
  return new Promise((resolve) => {
    if (!currentRowRef) currentRowRef = {};
  if (item.type === 'text') {
    const { row, content } = createRow('system', '');
    const div = document.createElement('div');
    div.className = 'portfolio-case__desc-row';
    div.textContent = item.text;
    content.append(div);
    if (item.text && item.text.includes(PORTFOLIO_HVV_RABBIT_TRIGGER)) {
      injectRabbitIntoRow('portfolioHvv', row);
    }
    currentRowRef.lastTextRow = row;
    resolve();
    } else if (item.type === 'image') {
      const { row, content } = createRow('system', '');
      const wrapper = document.createElement('div');
      wrapper.className = 'portfolio-case__img-wrapper';
      const cachedSrc = getPreloadedImage(item.src, preloadedImages);
      const img = document.createElement('img');
      img.className = 'portfolio-case__img';
      img.src = cachedSrc || item.src;
      img.alt = item.alt || `${title} — image`;
      img.decoding = 'async';
      img.loading = 'eager';
      img.draggable = false;
      wrapper.append(img);
      content.append(wrapper);
      currentRowRef.lastTextRow = null;
      if (img.complete) {
        resolve();
      } else {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      }
    } else {
      resolve();
    }
  });
}

function revealPortfolioCaseProgressive(data, preloadedImages) {
  if (!data) return Promise.resolve();
  const paragraphs = Array.isArray(data.description)
    ? data.description
    : String(data.description || '').split(/\n\s*\n/);
  const trimmedParagraphs = paragraphs
    .map((text) => (text && text.trim() ? text.trim() : ''))
    .filter(Boolean);
  const images = Array.isArray(data.images) ? data.images : [];
  const queue = [];
  const layout = Array.isArray(data.layout) ? data.layout : null;
  if (layout && layout.length) {
    layout.forEach((block) => {
      if (block.type === 'text') {
        const text = trimmedParagraphs[block.index];
        if (text) {
          queue.push({ type: 'text', text });
        }
      } else if (block.type === 'image') {
        const src = images[block.index];
        if (src) {
          queue.push({ type: 'image', src, alt: `${data.title} — image ${block.index + 1}` });
        }
      }
    });
  } else {
    trimmedParagraphs.forEach((text) => {
      queue.push({ type: 'text', text });
    });
    images.forEach((src, idx) => {
      if (src) {
        queue.push({ type: 'image', src, alt: `${data.title} — image ${idx + 1}` });
      }
    });
  }
  const delay = 150;
  return new Promise((resolve) => {
    const rowRef = { lastTextRow: null };
    const run = (index = 0) => {
      if (index >= queue.length) {
        resolve();
        return;
      }
      appendPortfolioContentRow(queue[index], data.title, rowRef, preloadedImages).then(() => {
        trackTimeout(() => run(index + 1), delay);
      });
    };
    run();
  });
}

function appendUserMessage(text, existingRow) {
  if (existingRow) {
    const shouldStick = isNearBottom();
    existingRow.classList.remove('row--input');
    existingRow.classList.add('row--user');
    const content = existingRow.querySelector('.content');
    if (content) {
      content.textContent = text;
    }
    scrollToBottom(shouldStick);
    return existingRow;
  }
  const { row, content } = createRow('user', '>');
  content.textContent = text;
  return row;
}

function isValidCommand(value) {
  return COMMANDS.includes(value);
}

function createRotatingLogoWord(content, isMobile) {
  const word = document.createElement('pre');
  word.className = `logo-rotating-word${isMobile ? ' logo-rotating-word--mobile' : ''}`;
  word.setAttribute('aria-label', 'PRODUCT');
  const lines = ASCII_LOGO_WORDS[0].ascii.split('\n');
  const lineElements = lines.map((line) => {
    const span = document.createElement('span');
    span.className = 'logo-rotating-word__line';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = line;
    word.append(span);
    return span;
  });
  content.append(word);

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let wordIndex = 0;
    const rotate = () => {
      if (!word.isConnected || !desktopRunning) return;
      wordIndex = (wordIndex + 1) % ASCII_LOGO_WORDS.length;
      const next = ASCII_LOGO_WORDS[wordIndex];
      const nextLines = next.ascii.split('\n');
      lineElements.forEach((lineElement, index) => {
        trackTimeout(() => {
          lineElement.classList.add('is-flipping');
          trackTimeout(() => {
            lineElement.style.transition = 'none';
            lineElement.style.transform = 'rotateX(90deg)';
            lineElement.textContent = nextLines[index] || '';
            lineElement.classList.remove('is-flipping');
            // Hold the new line edge-on for one frame before snapping it into place.
            void lineElement.offsetHeight;
            lineElement.style.transition = '';
            lineElement.style.transform = '';
            if (index === lineElements.length - 1) word.setAttribute('aria-label', next.label);
          }, 90);
        }, index * 95);
      });
      trackTimeout(rotate, 3000);
    };
    trackTimeout(rotate, 2600);
  }
  return word;
}

function appendLogoRole(content, isMobile) {
  const role = document.createElement('div');
  role.className = 'logo-role logo-role--pending';
  createRotatingLogoWord(role, isMobile);
  const strategist = document.createElement('pre');
  strategist.className = `logo-strategist${isMobile ? ' logo-strategist--mobile' : ''}`;
  strategist.textContent = ASCII_LOGO_STRATEGIST;
  strategist.setAttribute('aria-label', 'STRATEGIST');
  role.append(strategist);
  content.append(role);
  return role;
}

function revealLogoRole(role) {
  role.classList.remove('logo-role--pending');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return Promise.resolve();
  }
  role.style.height = '0px';
  role.classList.add('logo-role--revealing');
  const height = role.scrollHeight;
  // Commit the collapsed frame before expanding the role line by line.
  void role.offsetHeight;
  role.style.height = `${height}px`;
  const followScroll = trackInterval(scrollDuringAsciiReveal, 30);
  return waitAtLeast(300).then(() => {
    clearTrackedInterval(followScroll);
    role.classList.remove('logo-role--revealing');
    role.style.height = '';
  });
}

function revealAsciiLogo() {
  if (window.innerWidth < RABBIT_MIN_WIDTH) {
    return revealMobileLogoImages();
  }
  let role;
  return revealAsciiBlocks({
    blocks: [{ ascii: ASCII_LOGO, className: 'ascii' }],
    duration: 300,
    useRow: true,
    containerClass: '',
    onCreated: (content) => {
      role = appendLogoRole(content, false);
    },
  }).then((row) => revealLogoRole(role).then(() => row));
}

function revealMobileLogoImages() {
  const duration = 350;
  const { row, content } = createRow('system', '');
  const wrapper = document.createElement('div');
  wrapper.className = 'ascii-logo-mobile';
  content.append(wrapper);

  const images = MOBILE_LOGO_IMAGES.map(({ src, alt }) => {
    const img = document.createElement('img');
    img.className = 'ascii-logo-mobile__img ascii-logo-mobile__img--pending';
    img.src = src;
    img.alt = alt || 'ASCII logo';
    img.width = 487;
    img.height = 155;
    img.draggable = false;
    img.decoding = 'async';
    wrapper.append(img);
    return img;
  });
  const role = appendLogoRole(wrapper, true);

  return new Promise((resolve) => {
    const step = duration / images.length;
    let index = 0;
    const revealNext = () => {
      if (index >= images.length) {
        revealLogoRole(role).then(() => resolve(row));
        return;
      }
      images[index].classList.remove('ascii-logo-mobile__img--pending');
      scrollDuringAsciiReveal();
      index += 1;
      trackTimeout(revealNext, step);
    };
    revealNext();
  });
}

function debounce(fn, delay = 120) {
  let timeout;
  return (...args) => {
    clearTrackedTimeout(timeout);
    timeout = trackTimeout(() => fn(...args), delay);
  };
}

function setCaretToEnd(el) {
  const len = el.value.length;
  el.setSelectionRange(len, len);
}

function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function createDropdown(options, onSelect) {
  const dropdown = document.createElement('div');
  dropdown.className = 'dropdown';
  dropdown.setAttribute('role', 'listbox');
  dropdown.setAttribute('aria-hidden', 'true');

  let filtered = [...options];
  let selectedIndex = 0;

  const optionSelector = '[role="option"]';

  const handleSelect = (value) => {
    if (typeof onSelect === 'function') {
      onSelect(value);
    }
  };

  const updateSelectionVisuals = () => {
    const items = dropdown.querySelectorAll(optionSelector);
    items.forEach((item, idx) => {
      const isActive = filtered.length && idx === selectedIndex;
      item.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  };

  const render = () => {
    dropdown.innerHTML = '';
    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'dropdown__item dropdown__item--empty';
      empty.textContent = 'No commands';
      dropdown.append(empty);
      return;
    }
    filtered.forEach((opt, idx) => {
      const item = document.createElement('div');
      item.className = 'dropdown__item';
      item.setAttribute('role', 'option');
      item.textContent = opt;
      item.addEventListener('mousedown', (evt) => evt.preventDefault());
      item.addEventListener('mouseenter', () => {
        selectedIndex = idx;
        updateSelectionVisuals();
      });
      item.addEventListener('click', () => handleSelect(opt));
      dropdown.append(item);
    });
    updateSelectionVisuals();
  };

  const open = () => {
    dropdown.setAttribute('aria-hidden', 'false');
    render();
  };

  const close = () => {
    dropdown.setAttribute('aria-hidden', 'true');
  };

  const isOpen = () => dropdown.getAttribute('aria-hidden') === 'false';

  const filter = (rawInput) => {
    const firstLine = (rawInput || '').split('\n')[0];
    const sanitized = firstLine.replace(/^\//, '').toLowerCase();
    filtered = sanitized ? options.filter((opt) => opt.toLowerCase().includes(sanitized)) : [...options];
    selectedIndex = 0;
    if (isOpen()) {
      render();
    }
    return [...filtered];
  };

  const move = (delta) => {
    if (!filtered.length) return;
    selectedIndex = (selectedIndex + delta + filtered.length) % filtered.length;
    updateSelectionVisuals();
  };

  const selectCurrent = () => {
    if (!filtered.length) return false;
    const value = filtered[selectedIndex];
    handleSelect(value);
    return true;
  };

  const getFiltered = () => [...filtered];

  return {
    element: dropdown,
    open,
    close,
    isOpen,
    filter,
    move,
    selectCurrent,
    getFiltered,
  };
}

function enterSelectorMode({
  introText,
  options,
  dismissLabel,
  onSelect,
  onDismiss,
  ariaLabel,
  exitOnSelect = true,
  previewConfig,
  allowDismiss = true,
  allowEscapeKey = true,
}) {
  if (!options || !options.length) return null;
  if (!currentPrompt) {
    setupPrompt();
  }
  if (!currentPrompt) return null;
  const {
    row,
    textarea,
    dropdown,
    suggestion,
    inputWrapper,
  } = currentPrompt;
  if (!inputWrapper) return null;

  currentPrompt.selectorMode = true;

  textarea.blur();
  textarea.setAttribute('disabled', 'true');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.display = 'none';
  dropdown.close();
  if (dropdown.element) {
    dropdown.element.style.display = 'none';
  }
  if (suggestion) {
    suggestion.style.display = 'none';
  }

  const panel = document.createElement('div');
  panel.className = 'selector-panel';
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', ariaLabel || 'Selector');

  const intro = document.createElement('div');
  intro.className = 'selector-panel__intro';
  intro.textContent = introText;
  panel.append(intro);

  const list = document.createElement('div');
  list.className = 'selector-panel__list';
  panel.append(list);

  const optionElements = [];
  const previewEnabled = Boolean(previewConfig && previewConfig.enabled);
  let previewTooltip = null;
  let previewImage = null;
  let previewVisible = false;
  let previewReady = !previewEnabled;
  let previewDelayTimer = null;

  const setActiveIndex = (nextIndex) => {
    if (!options.length) return;
    const normalized = (nextIndex + options.length) % options.length;
    optionElements.forEach((el, idx) => {
      el.classList.toggle('is-selected', idx === normalized);
    });
    activeIndex = normalized;
    updatePreview();
  };

  let activeIndex = 0;

  const confirmSelection = (opt) => {
    if (!exitOnSelect) {
      if (typeof onSelect === 'function') {
        onSelect(opt);
      }
      return;
    }
    cleanup();
    if (typeof onSelect === 'function') {
      onSelect(opt);
    }
  };

  const dismiss = () => {
    if (!allowDismiss) return;
    cleanup();
    if (typeof onDismiss === 'function') {
      onDismiss();
    }
  };

  options.forEach((opt, idx) => {
    const item = document.createElement('div');
    item.className = 'selector-option';
    item.setAttribute('role', 'button');
    item.setAttribute('data-key', opt.key);

    const keySpan = document.createElement('span');
    keySpan.className = 'selector-option__key';
    keySpan.textContent = `[${opt.key}]`;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'selector-option__label';
    labelSpan.textContent = ` ${opt.label}`;

    item.append(keySpan, labelSpan);
    if (previewEnabled && opt.previewSrc) {
      const previewWrapper = document.createElement('div');
      previewWrapper.className = 'selector-option__preview-wrapper';
      const previewLink = document.createElement('a');
      previewLink.href = PORTFOLIO_LINKS[opt.id] || `/portfolio/${opt.id}.ux`;
      const previewImg = document.createElement('img');
      previewImg.className = 'selector-option__preview';
      previewImg.src = opt.previewSrc;
      previewImg.alt = opt.previewAlt || opt.label;
      previewImg.draggable = false;
      previewLink.append(previewImg);
      previewWrapper.append(previewLink);
      item.append(previewWrapper);
    }
    item.addEventListener('mouseenter', () => {
      setActiveIndex(idx);
    });
    item.addEventListener('click', () => confirmSelection(opt));
    optionElements.push(item);
    list.append(item);
  });

  if (allowDismiss) {
    const dismissLine = document.createElement('div');
    dismissLine.className = 'selector-panel__dismiss selector-option--dismiss';
    const dismissKey = document.createElement('span');
    dismissKey.className = 'selector-panel__dismiss-key';
    const dismissCopy = dismissLabel || '[esc] Dismiss';
    const dismissMatch = dismissCopy.match(/^(\[[^\]]+\])(.*)$/);
    const dismissKeyText = dismissMatch ? dismissMatch[1] : '[esc]';
    const rawDismissText = dismissMatch && dismissMatch[2] ? dismissMatch[2].trim() : 'Dismiss';
    const dismissTextContent = rawDismissText ? ` ${rawDismissText}` : '';
    dismissKey.textContent = dismissKeyText;
    const dismissText = document.createElement('span');
    dismissText.className = 'selector-panel__dismiss-text';
    dismissText.textContent = dismissTextContent;
    dismissLine.append(dismissKey, dismissText);
    dismissLine.addEventListener('click', () => dismiss());
    panel.append(dismissLine);
  }

  if (previewEnabled) {
    const existingTooltip = inputWrapper.querySelector('#portfolio-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
    previewTooltip = document.createElement('div');
    previewTooltip.id = 'portfolio-tooltip';
    previewTooltip.setAttribute('aria-hidden', 'true');
    const img = document.createElement('img');
    img.id = 'portfolio-tooltip-img';
    img.draggable = false;
    previewTooltip.append(img);
    inputWrapper.append(previewTooltip);
    previewImage = img;
    if (previewImage && !previewImage.dataset.boundLoad) {
      previewImage.dataset.boundLoad = 'true';
      previewImage.addEventListener('load', () => {
        if (previewVisible) {
          requestAnimationFrame(() => positionPreview());
        }
      });
    }
    previewReady = false;
    previewDelayTimer = trackTimeout(() => {
      previewReady = true;
      updatePreview();
    }, 150);
  }

  inputWrapper.append(panel);
  scrollPromptIntoView(row, true);

  let cleaned = false;

  const keyListener = (event) => {
    if (!options.length) return;
    if (event.key === 'Escape') {
      if (!allowEscapeKey) return;
      event.preventDefault();
      dismiss();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(activeIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(activeIndex - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      confirmSelection(options[activeIndex]);
    } else if (event.key && event.key.length === 1) {
      const pressed = event.key.toLowerCase();
      const idx = options.findIndex((opt) => String(opt.key || '').toLowerCase() === pressed);
      if (idx !== -1) {
        event.preventDefault();
        setActiveIndex(idx);
        confirmSelection(options[idx]);
      }
    }
  };

  document.addEventListener('keydown', keyListener);

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    document.removeEventListener('keydown', keyListener);
    panel.remove();
    if (row.isConnected) {
      row.remove();
    }
    if (previewEnabled && previewTooltip) {
      previewTooltip.classList.remove('is-visible');
      previewTooltip.setAttribute('aria-hidden', 'true');
      previewTooltip.remove();
      previewTooltip = null;
      previewImage = null;
    }
    if (previewDelayTimer) {
      clearTrackedTimeout(previewDelayTimer);
      previewDelayTimer = null;
    }
    if (currentPrompt && currentPrompt.row === row) {
      currentPrompt = null;
    }
  };

  const updatePreview = () => {
    if (!previewEnabled || !previewImage || !previewTooltip || !previewReady) return;
    const current = options[activeIndex];
    if (current && current.previewSrc) {
      previewImage.src = current.previewSrc;
      previewImage.alt = current.previewAlt || current.label;
      previewVisible = true;
      previewTooltip.classList.add('is-visible');
      previewTooltip.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => positionPreview());
    } else {
      previewVisible = false;
      previewTooltip.classList.remove('is-visible');
      previewTooltip.setAttribute('aria-hidden', 'true');
    }
  };

  const positionPreview = () => {
    if (!previewVisible || !previewTooltip) return;
    const tooltipRect = previewTooltip.getBoundingClientRect();
    const gap = 16;
    const height = Math.round(tooltipRect.height);
    previewTooltip.style.left = '0px';
    const topValue = -height + -gap;
    previewTooltip.style.top = `${topValue}px`;
  };

  setActiveIndex(0);

  return {
    cleanup,
  };
}
function handleContactDismiss() {
  appendContactLinksMessage().then(() => {
    trackTimeout(() => setupPrompt(), 50);
  });
}

function handleContactSelection(option) {
  const isEmailValue = typeof option.value === 'string' && option.value.includes('@') && !option.value.startsWith('http');
  const statusText = isEmailValue ? 'copied to clipboard' : 'opened in a new tab';
  const actionPromise = isEmailValue
    ? copyTextToClipboardSafe(option.value)
    : Promise.resolve(window.open(option.value, '_blank', 'noopener'));
  actionPromise
    .then(() => revealSequentialSystemMessages(buildContactRows(option.contactKey, statusText)))
    .then(() => {
      trackTimeout(() => setupPrompt(), 50);
    })
    .catch(() => {
      appendSystem(isEmailValue
        ? 'Unable to copy email automatically, please copy it manually.'
        : 'Unable to open the link automatically.');
      trackTimeout(() => setupPrompt(), 50);
    });
}

function startContactSelector() {
  setupPrompt();
  enterSelectorMode({
    introText: CONTACT_SELECTOR_INTRO,
    options: CONTACT_SELECTOR_OPTIONS,
    dismissLabel: CONTACT_SELECTOR_DISMISS,
    onSelect: handleContactSelection,
    onDismiss: handleContactDismiss,
    ariaLabel: 'Contact options selector',
  });
}

function handlePortfolioDismiss() {
  revealSequentialSystemMessages(PORTFOLIO_MESSAGE_ROWS_DESKTOP).then(() => {
    trackTimeout(() => setupPrompt(), 50);
  });
}

function startOtherProjectsSelector(currentCaseId) {
  const otherOptions = getOtherPortfolioOptions(currentCaseId);
  if (!otherOptions.length) {
    trackTimeout(() => setupPrompt(), 50);
    return;
  }
  if (isMobileViewport()) {
    appendPortfolioShortcutList({
      withPreview: false,
      options: otherOptions.map((opt) => ({
        id: opt.id,
        label: PORTFOLIO_LINKS[opt.id] || opt.label,
      })),
    });
    trackTimeout(() => setupPrompt(), 50);
    return;
  }
  const caseTitle = PORTFOLIO_CASES[currentCaseId]?.title || 'this project';
  setupPrompt();
  enterSelectorMode({
    introText: `Do you want to see my other projects? Use arrows, mouse, or numbers to navigate.\nYou currently have ${caseTitle} open.`,
    options: otherOptions.map((opt, idx) => ({
      ...opt,
      key: String(idx + 1),
    })),
    dismissLabel: '[esc]Dismiss',
    onSelect: handlePortfolioSelection,
    onDismiss: () => trackTimeout(() => setupPrompt(), 50),
    ariaLabel: 'Other projects selector',
  });
}

function handlePortfolioSelection(option) {
  const caseData = option ? PORTFOLIO_CASES[option.id] : null;
  const caseImages = getPortfolioCaseImages(option ? option.id : null);
  const casePayload = caseData ? { ...caseData, images: caseImages } : null;
  const images = casePayload && Array.isArray(casePayload.images) ? casePayload.images : [];
  const header = appendPortfolioHeader(
    caseData ? caseData.title : 'Loading project',
    caseData ? caseData.category : '',
  );
  let slowImageWarningTimeout = null;
  let slowImageReject = null;
  const clearSlowImageWarning = () => {
    if (slowImageWarningTimeout != null) {
      clearTrackedTimeout(slowImageWarningTimeout);
      slowImageWarningTimeout = null;
    }
  };
  const baseImagePromise = waitForImagesWithMinDelay(images, 1500).finally(() => {
    clearSlowImageWarning();
  });
  if (header.completeLoading) {
    baseImagePromise.then(() => {
      header.completeLoading();
    }).catch(() => {});
  }
  const guardedImagePromise = new Promise((resolve, reject) => {
    slowImageReject = reject;
    baseImagePromise.then(resolve).catch(reject);
  });
  if (images && images.length) {
    slowImageWarningTimeout = trackTimeout(() => {
      slowImageWarningTimeout = null;
      const warningRow = appendSystem('Images are taking longer than expected. Please check your connection or unblock static content and try again.', '!');
      if (warningRow) {
        const glyph = warningRow.querySelector('.glyph');
        if (glyph) {
          glyph.classList.add('glyph--failure');
        }
      }
      if (header.failLoading) {
        header.failLoading();
      }
      if (slowImageReject) {
        slowImageReject(new Error('portfolio:images-timeout'));
      }
      trackTimeout(() => setupPrompt(), 50);
    }, 7000);
  }
  Promise.all([
    header.progress,
    guardedImagePromise,
  ])
    .then(([, preloadedImages]) => {
      if (caseData) {
        if (header.showCategory) {
          header.showCategory();
        }
        return revealPortfolioCaseProgressive(casePayload, preloadedImages)
          .then(() => waitAtLeast(150))
          .then(() => startOtherProjectsSelector(option.id));
      }
      appendSystem('Success!');
      trackTimeout(() => setupPrompt(), 50);
      return null;
    })
    .catch(() => {
      trackTimeout(() => setupPrompt(), 50);
    });
}

function startPortfolioSelector() {
  setupPrompt();
  enterSelectorMode({
    introText: PORTFOLIO_SELECTOR_INTRO,
    options: PORTFOLIO_SELECTOR_OPTIONS,
    dismissLabel: CONTACT_SELECTOR_DISMISS,
    onSelect: handlePortfolioSelection,
    onDismiss: handlePortfolioDismiss,
    ariaLabel: 'Portfolio projects selector',
    previewConfig: { enabled: true },
  });
}

function openPortfolioCaseById(id) {
  const option = getPortfolioOptionById(id);
  if (!option) return;
  destroyCurrentPromptRow();
  handlePortfolioSelection(option);
}

function appendPortfolioShortcutList({ withPreview = false, options = PORTFOLIO_SHORTCUTS } = {}) {
  const row = appendSystem('');
  if (!row) return;
  const content = row.querySelector('.content');
  if (!content) return;
  const container = document.createElement('div');
  container.className = 'portfolio-shortcut-wrapper';
  content.append(container);
  const shortcuts = Array.isArray(options) && options.length ? options : PORTFOLIO_SHORTCUTS;
  const renderRow = (item) => {
    const block = document.createElement('div');
    block.className = 'portfolio-shortcut-row';
    const link = document.createElement('a');
    link.className = 'link portfolio-shortcut';
    link.href = '#';
    const label = item.label || PORTFOLIO_LINKS[item.id] || `/portfolio/${item.id}.ux`;
    link.textContent = label;
    link.dataset.portfolio = item.id;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const targetId = link.getAttribute('data-portfolio');
      if (targetId) {
        openPortfolioCaseById(targetId);
        scrollToBottom(true);
      }
    });
    block.append(link);
    const previewSrc = withPreview ? PORTFOLIO_PREVIEW_IMAGES[item.id] : null;
    if (previewSrc) {
      const imgLink = document.createElement('a');
      imgLink.href = '#';
      imgLink.className = 'portfolio-shortcut-link';
      const img = document.createElement('img');
      img.className = 'portfolio-shortcut-image';
      img.src = previewSrc;
      img.alt = label;
      img.draggable = false;
      imgLink.append(img);
      imgLink.addEventListener('click', (event) => {
        event.preventDefault();
        openPortfolioCaseById(item.id);
        scrollToBottom(true);
      });
      block.append(imgLink);
    }
    return block;
  };
  shortcuts.forEach((item, idx) => {
    trackTimeout(() => {
      const block = renderRow(item);
      container.append(block);
      scrollToBottom(true);
    }, SEQUENTIAL_ROW_DELAY * idx);
  });
  trackTimeout(() => {
    scrollToBottom(true);
  }, SEQUENTIAL_ROW_DELAY * shortcuts.length);
}

function revealSequentialRows(rows = []) {
  if (!rows.length) return Promise.resolve();
  return new Promise((resolve) => {
    const run = (index = 0) => {
      if (index >= rows.length) {
        resolve();
        return;
      }
      appendSystem(rows[index]);
      trackTimeout(() => run(index + 1), SEQUENTIAL_ROW_DELAY);
    };
    run();
  });
}

function revealSequentialSystemMessages(items = [], options = {}) {
  if (!items.length) return Promise.resolve();
  return new Promise((resolve) => {
    const run = (index = 0) => {
      if (index >= items.length) {
        resolve();
        return;
      }
      const entry = items[index];
      let row = null;
      if (entry && entry.html) {
        row = appendSystemHTML(entry.html, options.glyph);
      } else if (entry && entry.text) {
        row = appendSystem(entry.text, options.glyph);
      } else {
        row = appendSystem(String(entry), options.glyph);
      }
      if (entry && entry.key && row) {
        row.dataset.contactKey = entry.key;
      }
      if (entry && typeof entry.onRender === 'function') {
        entry.onRender(row);
      }
      trackTimeout(() => run(index + 1), SEQUENTIAL_ROW_DELAY);
    };
    run();
  });
}

function buildContactRows(statusKey, statusText) {
  const baseRows = isMobileViewport() ? CONTACT_MESSAGE_ROWS_MOBILE : CONTACT_MESSAGE_ROWS;
  return baseRows.map((entry) => {
    const suffix = entry.key === statusKey ? ` (${statusText})` : '';
    return {
      html: `${entry.html}${suffix}`,
    };
  });
}

function appendPortfolioMobileMessage() {
  const row = appendSystem('Portfolio cases:');
  if (!row) return null;
  const content = row.querySelector('.content');
  if (!content) return row;
  const wrapper = document.createElement('div');
  wrapper.className = 'portfolio-mobile-message';
  const paths = ['/portfolio/telehealth.ux', '/portfolio/erp.ux', '/portfolio/hvv_switch.ux'];
  paths.forEach((path, idx) => {
    const option = PORTFOLIO_SELECTOR_OPTIONS[idx];
    if (!option) return;
    const group = document.createElement('div');
    group.className = 'portfolio-mobile-group';
    const linkText = document.createElement('a');
    linkText.className = 'portfolio-mobile-link';
    linkText.href = path;
    linkText.textContent = path;
    const img = document.createElement('img');
    img.className = 'portfolio-mobile-image';
    img.src = option.previewSrc || PORTFOLIO_PREVIEW_IMAGES[option.id];
    img.alt = option.previewAlt || option.label;
    img.draggable = false;
    const imgLink = document.createElement('a');
    imgLink.href = path;
    imgLink.append(img);
    group.append(linkText, imgLink);
    wrapper.append(group);
  });
  content.append(wrapper);
  return row;
}

function setupPrompt({ scrollIntoView = true } = {}) {
  destroyCurrentPromptRow();
  const { row, content } = createRow('input', '>');
  const form = document.createElement('form');
  form.className = 'prompt-form';
  form.setAttribute('autocomplete', 'off');

  const textarea = document.createElement('textarea');
  textarea.className = 'prompt-input';
  textarea.rows = 1;
  const isMobileInput = isMobileViewport();
  const isWidthConstrained = window.innerWidth < RABBIT_MIN_WIDTH;
  const placeholderText = isMobileInput
    ? 'Select a command'
    : (isWidthConstrained
      ? 'Select a command'
      : "Start with [space] or type '/' to see commands");
  textarea.placeholder = placeholderText;
  textarea.setAttribute('aria-label', 'Command input');
  textarea.setAttribute('aria-expanded', 'false');
  textarea.spellcheck = false;
  if (isMobileInput) {
    textarea.setAttribute('readonly', 'true');
    textarea.setAttribute('aria-readonly', 'true');
    textarea.setAttribute('inputmode', 'none');
  }

  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'prompt-input-wrapper';

  const suggestion = document.createElement('div');
  suggestion.className = 'prompt-suggestion';
  suggestion.setAttribute('aria-hidden', 'true');
  const suggestionPrefix = document.createElement('span');
  suggestionPrefix.className = 'ghost-prefix';
  const suggestionCaret = document.createElement('span');
  suggestionCaret.className = 'ghost-caret ghost-caret--hidden';
  suggestionCaret.textContent = BLOCK_CHAR;
  const suggestionAfter = document.createElement('span');
  suggestionAfter.className = 'ghost-after';
  const suggestionSuffix = document.createElement('span');
  suggestionSuffix.className = 'ghost-suffix';
  suggestion.append(suggestionPrefix, suggestionCaret, suggestionAfter, suggestionSuffix);

  inputWrapper.append(suggestion, textarea);

  let activeSuggestionValue = '';

  const getSelectionMeta = () => {
    const value = textarea.value || '';
    let start = 0;
    let end = 0;
    try {
      start = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : value.length;
      end = typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : start;
    } catch (err) {
      start = value.length;
      end = value.length;
    }
    return {
      value,
      start,
      end,
      collapsed: start === end,
    };
  };

  const clearSuggestion = () => {
    activeSuggestionValue = '';
    suggestionSuffix.textContent = '';
  };

  const setCaretVisible = (visible) => {
    suggestionCaret.classList.toggle('ghost-caret--hidden', !visible);
  };

  const updateGhostState = () => {
    const meta = getSelectionMeta();
    const { value, start, end, collapsed } = meta;
    suggestionPrefix.textContent = value.slice(0, start);
    suggestionAfter.textContent = value.slice(start);
    if (!collapsed || document.activeElement !== textarea) {
      setCaretVisible(false);
      suggestionCaret.textContent = '';
      suggestionCaret.classList.remove('ghost-caret--block');
      return { ...meta, atEnd: start >= value.length };
    }
    setCaretVisible(true);
    if (start < value.length) {
      const currentChar = value[start];
      if (currentChar === '\n') {
        suggestionCaret.textContent = BLOCK_CHAR;
        suggestionCaret.classList.add('ghost-caret--block');
      } else {
        suggestionCaret.textContent = currentChar;
        suggestionCaret.classList.remove('ghost-caret--block');
      }
    } else {
      suggestionCaret.textContent = BLOCK_CHAR;
      suggestionCaret.classList.add('ghost-caret--block');
    }
    return { ...meta, atEnd: start >= value.length };
  };

  const dropdown = createDropdown(COMMANDS, (value) => {
    textarea.value = value;
    autoResize(textarea);
    setCaretToEnd(textarea);
    updateGhostState();
    dropdown.close();
    textarea.setAttribute('aria-expanded', 'false');
    clearSuggestion();
    handleSubmit();
  });

  function handleSubmit() {
    const rawValue = textarea.value;
    const normalized = normalizeCommand(rawValue);
    if (!normalized) return false;
    clearSuggestion();
    textarea.blur();
    appendUserMessage(rawValue, row);
    dropdown.close();
    currentPrompt = null;
    if (isValidCommand(normalized)) {
      if (normalized === '/about') {
        trackTimeout(() => {
          appendSystemLoadingWithAccordion({
            loadingText: 'Looking for files in /about',
            doneText: '/about/readme.md was found',
            steps: [
              'Fighting impostor syndrome',
              'Accepting my destiny',
            ],
            duration: 1000,
            }).then(() => appendSectionAscii('/about')
            .then(() => appendAboutPhoto())
            .then(() => {
              const aboutText = `Product & AI Strategist with 10+ years of experience building B2B and B2C digital products across SaaS, mobility, healthcare and enterprise platforms.

My background is in product design, UX research and design leadership, but my work sits at the intersection of product strategy, technology and business. I turn user and business problems into product opportunities, shape concepts and priorities, and work closely with cross-functional teams from discovery through delivery.`;
              const paragraphs = aboutText
                .split(/\\n\\s*\\n/)
                .map((p) => p.trim())
                .filter(Boolean);
              if (!paragraphs.length) {
                trackTimeout(() => setupPrompt(), 50);
                return;
              }
              const firstParagraph = paragraphs.shift();
              const aboutRow = appendSystem(firstParagraph);
              injectRabbitIntoRow('about', aboutRow);
              revealSequentialRows(paragraphs).then(() => {
                trackTimeout(() => setupPrompt(), 50);
              });
            }));
        }, 50);
      } else if (normalized === '/contact') {
        trackTimeout(() => {
          appendSystemLoadingWithAccordion({
            loadingText: 'Looking for connections',
            doneText: '3 ports were found',
            steps: [
              'Is it USB-C or B?',
              'Or maybe the Hamburg port',
              'It must be port wine',
            ],
            duration: 1000,
          }).then(() => appendSectionAscii('/contact')
            .then(() => {
              if (isMobileViewport()) {
                handleContactDismiss();
              } else {
                startContactSelector();
              }
            }));
        }, 50);
      } else if (normalized === '/experience') {
        trackTimeout(() => {
          appendSystemLoadingWithAccordion({
            loadingText: 'Looking for files in /experience',
            doneText: '/experience/readme.md was found',
            steps: [
              'Deleting waiter experience',
              'Questioning my life choices',
              'Ordering… take out',
            ],
            duration: 1000,
          }).then(() => appendSectionAscii('/experience')
            .then(() => {
              revealExperienceProgressive();
            }));
        }, 50);
      } else if (normalized === '/portfolio') {
        trackTimeout(() => {
          appendSystemLoadingWithAccordion({
            loadingText: 'Looking for files in /portfolio',
            doneText: '3 projects were found in /portfolio',
            steps: [
              'Preparing the big guns',
              'Swiping dust off images',
            ],
            duration: 1000,
          }).then(() => appendSectionAscii('/portfolio')
            .then(() => {
              if (isMobileViewport()) {
                appendPortfolioShortcutList({ withPreview: true });
                trackTimeout(() => setupPrompt(), 50);
              } else {
                startPortfolioSelector();
              }
            }));
        }, 50);
      } else {
        trackTimeout(() => {
          appendSystem('Success!');
          trackTimeout(() => setupPrompt(), 50);
        }, 50);
      }
    } else {
      trackTimeout(() => {
        appendSystem(`zsh: command not found: ${normalized}`);
        trackTimeout(() => setupPrompt(), 50);
      }, 50);
    }
    return true;
  }

  form.append(inputWrapper, dropdown.element);
  content.append(form);

  const focusInput = () => {
    if (currentPrompt && currentPrompt.selectorMode) return;
    textarea.focus();
    setCaretToEnd(textarea);
    updateGhostState();
  };

  const updateSuggestion = (rawValue, matches, caretInfo) => {
    const meta = caretInfo || updateGhostState();
    if (!rawValue || rawValue.includes('\n')) {
      clearSuggestion();
      return;
    }
    if (!meta.collapsed || !meta.atEnd) {
      clearSuggestion();
      return;
    }
    const firstLine = rawValue.split('\n')[0];
    if (!firstLine.startsWith('/')) {
      clearSuggestion();
      return;
    }
    const list = matches && matches.length ? matches : dropdown.getFiltered();
    const candidate = list[0];
    if (!candidate) {
      clearSuggestion();
      return;
    }
    if (!candidate.toLowerCase().startsWith(firstLine.toLowerCase())) {
      clearSuggestion();
      return;
    }
    if (candidate.length === firstLine.length) {
      clearSuggestion();
      return;
    }
    activeSuggestionValue = candidate;
    suggestionSuffix.textContent = candidate.slice(firstLine.length);
  };

  const applyFilter = (value) => {
    const caretInfo = updateGhostState();
    dropdown.open();
    textarea.setAttribute('aria-expanded', 'true');
    const matches = dropdown.filter(value);
    updateSuggestion(value, matches, caretInfo);
  };

  const debouncedFilter = debounce(applyFilter, 140);

  const handleInput = () => {
    if (isMobileInput) return;
    autoResize(textarea);
    const rawValue = textarea.value;
    const caretInfo = updateGhostState();
    const trimmed = rawValue.trim();
    if (!trimmed.startsWith('/')) {
      dropdown.close();
      textarea.setAttribute('aria-expanded', 'false');
      clearSuggestion();
      return;
    }
    debouncedFilter(rawValue);
    updateSuggestion(rawValue, dropdown.getFiltered(), caretInfo);
  };

  textarea.addEventListener('input', handleInput);

  textarea.addEventListener('focus', () => {
    if (currentPrompt && currentPrompt.selectorMode) return;
    setCaretVisible(true);
    if (!textarea.value) {
      textarea.value = '/';
      autoResize(textarea);
      setCaretToEnd(textarea);
    }
    updateGhostState();
    applyFilter(textarea.value);
  });

  textarea.addEventListener('blur', () => {
    setCaretVisible(false);
    dropdown.close();
    textarea.setAttribute('aria-expanded', 'false');
    clearSuggestion();
    if (textarea.value.trim() === '/') {
      textarea.value = '';
      autoResize(textarea);
    }
    updateGhostState();
  });

  textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (dropdown.isOpen()) {
        const handled = dropdown.selectCurrent();
        if (handled) {
          return;
        }
      }
      handleSubmit();
    } else if (event.key === 'ArrowRight') {
      const caretAtEnd = textarea.selectionStart === textarea.value.length && textarea.selectionEnd === textarea.selectionStart;
      if (caretAtEnd && activeSuggestionValue) {
        event.preventDefault();
        textarea.value = activeSuggestionValue;
        autoResize(textarea);
        setCaretToEnd(textarea);
        const caretInfo = updateGhostState();
        applyFilter(textarea.value);
        updateSuggestion(textarea.value, dropdown.getFiltered(), caretInfo);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      dropdown.close();
      clearSuggestion();
      textarea.blur();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!dropdown.isOpen()) {
        if (!textarea.value.trim().startsWith('/')) {
          textarea.value = textarea.value.trim() ? textarea.value : '/';
        }
        updateGhostState();
        applyFilter(textarea.value || '/');
      } else {
        dropdown.move(1);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!dropdown.isOpen()) {
        if (!textarea.value.trim().startsWith('/')) {
          textarea.value = textarea.value.trim() ? textarea.value : '/';
        }
        updateGhostState();
        applyFilter(textarea.value || '/');
      } else {
        dropdown.move(-1);
      }
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSubmit();
  });

  row.addEventListener('click', () => {
    focusInput();
  });

  const refreshCaretAndSuggestion = () => {
    const caretInfo = updateGhostState();
    updateSuggestion(textarea.value, dropdown.getFiltered(), caretInfo);
  };

  ['keyup', 'mouseup', 'select'].forEach((evt) => {
    textarea.addEventListener(evt, refreshCaretAndSuggestion);
  });

  currentPrompt = {
    row,
    textarea,
    dropdown,
    suggestion,
    inputWrapper,
    focusInput,
  };
  autoResize(textarea);
  updateGhostState();
  setCaretVisible(document.activeElement === textarea);
  if (scrollIntoView) scrollPromptIntoView(row, true);

  return row;
}

function runInitialFlow() {
    const introStartedAt = performance.now();
    appendSystemLoadingWithAccordion({
      loadingText: 'Connecting to port:0000',
      doneText: 'Connection successful',
      steps: [
        'Looking up on Wikipedia what a port is',
        'Asking an AI what to do',
        'Still looking on Stack Overflow',
      ],
      duration: 300,
    })
    .then(() => waitAtLeast(50))
    .then(() => appendSystemLoadingWithAccordion({
      loadingText: 'Starting Maxim Kich CLI',
      doneText: 'App started',
      steps: [
        'Found a bug',
        'Turning the app off',
        'Turning the app on',
      ],
      duration: 250,
    }))
    .then(() => revealAsciiLogo())
    .then(() => {
      const desktopTips = `Welcome to my personal website. Here you can find information about me and my projects.

Tips for getting started:
- Start with [space] or type '/' to see commands
- You can navigate with your keyboard as well as your mouse cursor
- Read between lines and follow White Rabbits`;
      const mobileIntro = 'Welcome to my personal website. Here you can find information about me and my projects.';
      const welcomeRow = appendSystem(window.innerWidth < RABBIT_MIN_WIDTH ? mobileIntro : desktopTips);
      injectRabbitIntoRow('welcome', welcomeRow);
      scrollDuringAsciiReveal();
      const remaining = Math.max(0, 1600 - (performance.now() - introStartedAt));
      trackTimeout(() => {
        setupPrompt();
        isBooting = false;
      }, remaining);
    });
}

function resetCursorHide() {
  document.body.classList.remove('cursor-hidden');
  if (cursorHideTimer) {
    clearTrackedTimeout(cursorHideTimer);
  }
  cursorHideTimer = trackTimeout(() => {
    document.body.classList.add('cursor-hidden');
    cursorHideTimer = null;
  }, CURSOR_HIDE_DELAY);
}

function handleGlobalListeners() {
  const keyHandler = (event) => {
    const isSpace = event.code === 'Space' || event.key === ' ';
    if (isSpace && currentPrompt && !currentPrompt.selectorMode) {
      if (document.activeElement !== currentPrompt.textarea) {
        event.preventDefault();
        currentPrompt.textarea.focus();
        setCaretToEnd(currentPrompt.textarea);
      }
    }
  };

  const clickHandler = (event) => {
    if (!currentPrompt || currentPrompt.selectorMode) return;
    if (!currentPrompt.row.contains(event.target)) {
      currentPrompt.dropdown.close();
      currentPrompt.textarea.blur();
    }
  };

  addAppListener(document, 'keydown', keyHandler);
  addAppListener(document, 'click', clickHandler);
  addAppListener(document, 'mousemove', resetCursorHide);
  resetCursorHide();
}

window.addEventListener('resize', handleRabbitResponsiveChange);
handleRabbitResponsiveChange();

window.DesktopApp = {
  start: startDesktopApp,
  stop: stopDesktopApp,
};
