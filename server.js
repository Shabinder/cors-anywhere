process.on('SIGINT', function () {
  console.info('\nReceived SIGINT. Terminating...');
  process.exit(0);
});

// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

// Grab the BLOCKLIST from the command-line so that we can update the BLOCKLIST without deploying
// again. CORS Anywhere is open by design, and this BLOCKLIST is not used, except for countering
// immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// use originAllowList instead.
var originBlockList = parseEnvList(process.env.CORSANYWHERE_BLOCKLIST);
var originAllowList = parseEnvList(process.env.CORSANYWHERE_ALLOWLIST);

function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(',').filter(function (it) {
    return it !== '';
  });
}

// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

var cors_proxy = require('./lib/cors-anywhere');
cors_proxy.createServer({
  originBlockList: originBlockList,
  originAllowList: originAllowList,
  requireHeader: ['origin', 'x-requested-with'],
  checkRateLimit: checkRateLimit,
  removeHeaders: [
    'cookie',
    'cookie2',
    // Strip Heroku-specific headers
    'x-request-start',
    'x-request-id',
    'via',
    'connect-time',
    'total-route-time',
    'save-data',
    'user-agent',
    // Other Heroku added debug headers
    // 'x-forwarded-for',
    // 'x-forwarded-proto',
    // 'x-forwarded-port',
  ],
  setHeaders: {
    'referer': 'https://music.youtube.com/search',//For YT MUSIC API
    'origin': 'https://music.youtube.com/search',//For YT MUSIC API
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:85.0) Gecko/20100101 Firefox/85.0',//For Same Response on Mobile
  },
  redirectSameOrigin: true,
  httpProxyOptions: {
    // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
    xfwd: false,
  },
}).listen(port, host, function () {
  console.log('Running CORS Anywhere on ' + host + ':' + port);
  console.log('Rate limit: ' + (process.env.CORSANYWHERE_RATELIMIT || 'unlimited'));
  console.log('Allowing CORS from: [' + originAllowList + ']');
  console.log('Blocking CORS from: [' + originBlockList + ']');
});
