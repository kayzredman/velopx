// Shim: guard against "property is not writable" when the native side has
// already defined __FUSEBOX_REACT_DEVTOOLS_DISPATCHER__ as non-configurable.
// We monkey-patch Object.defineProperty before requiring the original module,
// then restore it immediately after so the guard only applies to that one call.
const _define = Object.defineProperty;
Object.defineProperty = function (obj, prop, desc) {
  if (obj === global && prop === '__FUSEBOX_REACT_DEVTOOLS_DISPATCHER__') {
    const existing = Object.getOwnPropertyDescriptor(obj, prop);
    if (existing && !existing.configurable) {
      // Already defined by native — skip silently.
      return obj;
    }
  }
  return _define(obj, prop, desc);
};
try {
  require('react-native/src/private/devsupport/rndevtools/setUpFuseboxReactDevToolsDispatcher');
} catch (e) {
  // ignore
} finally {
  Object.defineProperty = _define;
}
