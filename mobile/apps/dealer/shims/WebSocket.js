// CJS-compatible shim: react-native/Libraries/WebSocket/WebSocket
const mod = require('react-native/Libraries/WebSocket/WebSocket');
module.exports = mod && mod.__esModule && mod.default !== undefined ? mod.default : mod;
