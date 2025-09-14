const os = require('os');

/**
 * Configuração inteligente do browser baseada no ambiente
 */
function getBrowserConfig() {
  const isLinux = os.platform() === 'linux';
  const isCI = process.env.CI === 'true';
  const forceHeadless = process.env.HEADLESS === 'true';
  const isDebug = process.env.DEBUG === 'true';
  const isProduction = process.env.NODE_ENV === 'production';

  // Configuração base
  const config = {
    headless: true, // Default para headless
    defaultViewport: { width: 1366, height: 768 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-ipc-flooding-protection'
    ]
  };

  // Configurações específicas para Linux/VPS/Produção
  if (isLinux || isCI || forceHeadless || isProduction) {
    config.args.push(
      '--headless=new',
      '--disable-web-security',
      '--disable-xss-auditor',
      '--disable-features=VizDisplayCompositor',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--disable-infobars',
      '--single-process'
    );

    // Especificar executablePath em produção Linux (Docker)
    if (isLinux && isProduction) {
      config.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';
    }
  }

  // Configurações para debug (Windows apenas)
  if (isDebug && !isLinux && !forceHeadless) {
    config.headless = false;
    config.devtools = true;
    config.slowMo = 100; // Mais lento para debug
  }

  // Configurações para baixo consumo de memória (VPS/Produção)
  if (isLinux || isCI || isProduction) {
    config.args.push(
      '--memory-pressure-off',
      '--max_old_space_size=2048',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-component-update',
      '--disable-extensions-http-throttling',
      '--disable-client-side-phishing-detection'
    );

    // Timeout mais generoso para ambientes lentos
    config.timeout = 60000;
    config.defaultNavigationTimeout = 60000;
    config.defaultTimeout = 60000;
  }

  console.log(`🌐 Browser config - Platform: ${os.platform()}, Headless: ${config.headless}, Production: ${isProduction}`);
  if (config.executablePath) {
    console.log(`🔧 Using Chromium at: ${config.executablePath}`);
  }

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