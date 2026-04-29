// CJS-compatible shim: react-native/Libraries/Core/Devtools/getDevServer
const mod = require('react-native/Libraries/Core/Devtools/getDevServer');
module.exports = mod && mod.__esModule && typeof mod.default === 'function' ? mod.default : mod;
