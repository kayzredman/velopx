const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../../..');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo
config.watchFolders = [monorepoRoot];

// Resolve modules from both the app and monorepo root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Required for pnpm symlink resolution
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// messageSocket.native.ts in @expo/metro-runtime@4.0.1 uses raw CJS require()
// for react-native internal ES modules. RN 0.81.5 exports them as ES modules
// so require() returns { __esModule: true, default: X } instead of X directly.
// We intercept only those two specific requires and redirect to CJS shims.
const MSOCKET_SHIMS = {
  'react-native/Libraries/Core/Devtools/getDevServer': path.resolve(projectRoot, 'shims/getDevServer.js'),
  'react-native/Libraries/WebSocket/WebSocket': path.resolve(projectRoot, 'shims/WebSocket.js'),
};

const _originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Fix pnpm virtual entry path for expo-router
  if (
    (moduleName.includes('/expo-router@') || moduleName === 'expo-router/entry') &&
    (moduleName.endsWith('/entry') || moduleName.endsWith('/entry.js'))
  ) {
    return {
      filePath: require.resolve('expo-router/entry', { paths: [projectRoot] }),
      type: 'sourceFile',
    };
  }
  // Fix CJS/ESM interop for messageSocket.native.ts internal requires
  if (
    context.originModulePath &&
    context.originModulePath.includes('messageSocket.native') &&
    MSOCKET_SHIMS[moduleName]
  ) {
    return { filePath: MSOCKET_SHIMS[moduleName], type: 'sourceFile' };
  }
  if (_originalResolveRequest) {
    return _originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
