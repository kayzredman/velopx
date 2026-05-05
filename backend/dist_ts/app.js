"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var app_exports = {};
__export(app_exports, {
  default: () => app_default
});
module.exports = __toCommonJS(app_exports);
var import_express = __toESM(require("express"));
var import_cors = __toESM(require("cors"));
var import_helmet = __toESM(require("helmet"));
var import_express2 = require("@clerk/express");
var import_auditCapture = require("./middleware/auditCapture");
var import_errorHandler = require("./middleware/errorHandler");
var import_v1 = __toESM(require("./routes/v1"));
var import_prisma = require("./db/prisma");
var import_producer = require("./kafka/producer");
var import_ioredis = __toESM(require("ioredis"));
const app = (0, import_express.default)();
app.use((0, import_helmet.default)());
app.use(
  (0, import_cors.default)({
    origin: process.env.CORS_ORIGINS?.split(",") ?? "*",
    credentials: true
  })
);
app.use(import_express.default.json({ limit: "2mb" }));
app.use(import_express.default.urlencoded({ extended: true }));
app.use((0, import_express2.clerkMiddleware)());
app.use(import_auditCapture.auditCapture);
app.use("/v1", import_v1.default);
app.get("/health", async (_req, res) => {
  const start = Date.now();
  const check = async (fn) => {
    const t = Date.now();
    try {
      await fn();
      return { status: "up", latencyMs: Date.now() - t };
    } catch (err) {
      return { status: "down", latencyMs: Date.now() - t, error: err.message };
    }
  };
  const [database, cache, kafka] = await Promise.all([
    check(async () => {
      await import_prisma.prisma.$queryRaw`SELECT 1`;
    }),
    check(async () => {
      const redis = new import_ioredis.default(process.env.REDIS_URL ?? "redis://localhost:6379", { lazyConnect: true, connectTimeout: 3e3 });
      await redis.connect();
      await redis.ping();
      await redis.quit();
    }),
    check(async () => {
      if (!(0, import_producer.isKafkaConnected)()) throw new Error("Producer not connected");
    })
  ]);
  const allUp = [database, cache, kafka].every((s) => s.status === "up");
  const anyDown = [database, cache, kafka].some((s) => s.status === "down");
  res.status(allUp ? 200 : 503).json({
    status: allUp ? "operational" : anyDown ? "degraded" : "operational",
    totalLatencyMs: Date.now() - start,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    services: { database, cache, kafka }
  });
});
app.use(import_errorHandler.errorHandler);
var app_default = app;
