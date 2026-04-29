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

// pnpm creates multiple virtual instances of singleton packages (react, react-native, expo)
// when they appear in different peer-dep contexts. Metro bundles ALL of them, which creates
// multiple AppRegistry instances. The wrong one ends up as global.RN$AppRegistry, so native
// calls runApplication('main') on the one that still has AppEntryNotFound as the placeholder.
// Force all requires of these singletons to resolve from THIS app's node_modules.
const SINGLETONS = ['react', 'react-native', 'expo'];

// messageSocket.native.ts in @expo/metro-runtime@4.0.1 uses raw CJS require()
// for react-native internal ES modules. RN 0.81.5 exports them as ES modules
// so require() returns { __esModule: true, default: X } instead of X directly.
// We intercept only those two specific requires and redirect to CJS shims.
const MSOCKET_SHIMS = {
  'react-native/Libraries/Core/Devtools/getDevServer': path.resolve(projectRoot, 'shims/getDevServer.js'),
  'react-native/Libraries/WebSocket/WebSocket': path.resolve(projectRoot, 'shims/WebSocket.js'),
};

// setUpFuseboxReactDevToolsDispatcher.js calls Object.defineProperty with
// configurable:false but the native side already defined the property, causing
// "property is not writable". Redirect to a shim that guards the call.
const FUSEBOX_MODULE = 'react-native/src/private/devsupport/rndevtools/setUpFuseboxReactDevToolsDispatcher';
const FUSEBOX_SHIM = path.resolve(projectRoot, 'shims/setUpFuseboxReactDevToolsDispatcher.js');

const _originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Deduplicate singleton packages — always resolve to THIS app's copy
  if (SINGLETONS.includes(moduleName)) {
    return {
      filePath: require.resolve(moduleName, { paths: [projectRoot] }),
      type: 'sourceFile',
    };
  }
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
  // Guard Fusebox devtools dispatcher against non-writable property error.
  // The originModulePath check prevents a resolver loop: the shim itself
  // requires the original, so we must NOT re-intercept that inner call.
  if (
    (moduleName === FUSEBOX_MODULE || moduleName.includes('setUpFuseboxReactDevToolsDispatcher')) &&
    !(context.originModulePath && context.originModulePath.includes('setUpFuseboxReactDevToolsDispatcher'))
  ) {
    return { filePath: FUSEBOX_SHIM, type: 'sourceFile' };
  }
  if (_originalResolveRequest) {
    return _originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
