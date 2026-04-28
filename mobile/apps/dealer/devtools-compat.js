/**
 * CJS-compatible shim for react-native internal modules.
 *
 * @expo/metro-runtime's messageSocket.native.ts uses raw CJS require() for
 * react-native internal ES modules, getting { default: X } (Object/namespace)
 * instead of X (Function/Class). This factory unwraps ES module defaults so that
 * `const X = require(...)` callers get the actual function/class directly.
 *
 * Also used by resolveRequest in metro.config.js to redirect specific requires.
 */
function cjsCompat(modulePath) {
  const mod = require(modulePath);
  return typeof mod === 'function' || (mod && typeof mod === 'object' && mod.constructor !== Object)
    ? mod
    : mod && mod.__esModule && mod.default !== undefined
      ? mod.default
      : mod;
}

module.exports = { cjsCompat };
