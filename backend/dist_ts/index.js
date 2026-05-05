"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var import_config = require("dotenv/config");
var import_app = __toESM(require("./app"));
var import_producer = require("./kafka/producer");
var import_auditConsumer = require("./kafka/consumers/auditConsumer");
var import_prisma = require("./db/prisma");
const PORT = process.env.PORT || 3e3;
async function bootstrap() {
  import_app.default.listen(PORT, () => {
    console.log(`\u2713 velopX API running on :${PORT}`);
  });
  (0, import_producer.connectKafka)().then(() => (0, import_auditConsumer.startAuditConsumer)()).then(() => console.log("\u2713 Kafka connected")).catch((err) => console.warn("\u26A0 Kafka unavailable (audit events disabled):", err.message));
}
async function shutdown() {
  console.log("Shutting down...");
  await (0, import_producer.disconnectKafka)();
  await import_prisma.prisma.$disconnect();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
bootstrap();
