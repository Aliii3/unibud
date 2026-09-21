// Metro configuration. The defaults are right for iOS and Android; everything
// here exists so the app also runs in a browser via `npm run web`, which is
// handy for quickly eyeballing a layout without a simulator.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite runs as WebAssembly on web, so the .wasm has to be bundled...
config.resolver.assetExts.push('wasm');

// ...and it needs SharedArrayBuffer, which browsers only expose to a
// cross-origin-isolated page.
config.server = config.server ?? {};
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  return middleware(req, res, next);
};

module.exports = config;
