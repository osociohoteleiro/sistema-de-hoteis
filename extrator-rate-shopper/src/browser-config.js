const os = require('os');
const fs = require('fs');

/**
 * Configuração robusta do browser para Docker/Linux com fallbacks múltiplos
 */
function getBrowserConfig() {
  const platform = os.platform();
  const isLinux = platform === 'linux';
  const isCI = process.env.CI === 'true';
  const forceHeadless = process.env.HEADLESS === 'true';
  const isDebug = process.env.DEBUG === 'true';
  const isProduction = process.env.NODE_ENV === 'production';
  const isDocker = fs.existsSync('/.dockerenv') || process.env.DOCKER === 'true';

  console.log(`🔍 Environment Detection:`);
  console.log(`   Platform: ${platform}`);
  console.log(`   Is Linux: ${isLinux}`);
  console.log(`   Is Production: ${isProduction}`);
  console.log(`   Is Docker: ${isDocker}`);
  console.log(`   Force Headless: ${forceHeadless}`);

  // Detectar path do Chromium automaticamente
  const possibleChromiumPaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_BIN,
    process.env.CHROMIUM_PATH,
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/snap/bin/chromium'
  ];

  let executablePath = null;
  for (const path of possibleChromiumPaths) {
    if (path && fs.existsSync(path)) {
      executablePath = path;
      console.log(`✅ Chromium encontrado em: ${path}`);
      break;
    }
  }

  if (!executablePath && isLinux) {
    console.log(`⚠️  Nenhum Chromium encontrado nos caminhos padrão. Tentando detectar...`);
    // Último recurso: usar comando padrão e deixar Puppeteer decidir
    executablePath = '/usr/bin/chromium-browser';
  }

  // Configuração base otimizada para Docker/Linux
  const config = {
    headless: true, // Sempre headless em produção
    defaultViewport: { width: 1366, height: 768 },
    args: [
      // Flags obrigatórias para Docker/Linux
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--no-first-run',
      '--no-zygote',
      '--disable-default-apps',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-ipc-flooding-protection',

      // Flags para estabilidade em containers
      '--disable-features=VizDisplayCompositor',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-xss-auditor',
      '--disable-features=TranslateUI',
      '--disable-features=BlinkGenPropertyTrees',
      '--run-all-compositor-stages-before-draw',
      '--disable-accelerated-2d-canvas',
      '--disable-accelerated-jpeg-decoding',
      '--disable-accelerated-mjpeg-decode',
      '--disable-accelerated-video-decode',
      '--disable-accelerated-video-encode',

      // Otimizações de memória para containers
      '--memory-pressure-off',
      '--max_old_space_size=2048',
      '--disable-background-networking',
      '--disable-background-sync',
      '--disable-client-side-phishing-detection',
      '--disable-sync',
      '--disable-translate',
      '--hide-scrollbars',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-pings',
      '--disable-logging',
      '--disable-permissions-api',
      '--disable-presentation-api',

      // User agent e detecção
      '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
  };

  // Configurações específicas para Linux/Docker
  if (isLinux || isDocker || isProduction) {
    config.args.push(
      '--headless=new',
      '--virtual-time-budget=5000',
      '--single-process', // Importante para containers com memória limitada
      '--disable-software-rasterizer'
    );

    if (executablePath) {
      config.executablePath = executablePath;
    }

    // Timeouts mais generosos para ambientes containerizados
    config.timeout = 90000;
    config.defaultNavigationTimeout = 90000;
    config.defaultTimeout = 90000;
  }

  // Configurações para debug (apenas desenvolvimento local)
  if (isDebug && !isLinux && !forceHeadless && !isProduction) {
    config.headless = false;
    config.devtools = true;
    config.slowMo = 100;
    // Remover algumas flags que podem interferir no debug
    config.args = config.args.filter(arg =>
      !arg.includes('--disable-web-security') &&
      !arg.includes('--disable-extensions')
    );
  }

  console.log(`🌐 Browser Config Summary:`);
  console.log(`   Headless: ${config.headless}`);
  console.log(`   Executable: ${config.executablePath || 'auto-detect'}`);
  console.log(`   Args count: ${config.args.length}`);
  console.log(`   Timeout: ${config.timeout || 'default'}`);

  return config;
}

/**
 * User agents rotativos para evitar detecção
 */
const USER_AGENTS = [
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

/**
 * Retorna um User-Agent aleatório
 */
function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Gera delay aleatório entre min e max segundos
 */
function getRandomDelay(min = 3000, max = 7000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  getBrowserConfig,
  getRandomUserAgent,
  getRandomDelay,
  USER_AGENTS
};