"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var auditCapture_exports = {};
__export(auditCapture_exports, {
  auditCapture: () => auditCapture
});
module.exports = __toCommonJS(auditCapture_exports);
var import_express = require("@clerk/express");
var import_producer = require("../kafka/producer");
function auditCapture(req, res, next) {
  const start = Date.now();
  const requestId = req.headers["x-request-id"] ?? crypto.randomUUID();
  res.setHeader("x-request-id", requestId);
  res.on("finish", () => {
    if (!req.path.startsWith("/v1")) return;
    const auth = (0, import_express.getAuth)(req);
    const role = auth.sessionClaims?.metadata?.role;
    const event = {
      event_id: crypto.randomUUID(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      actor: {
        user_id: auth.userId ?? null,
        role: role ?? null,
        organisation_id: auth.orgId ?? null,
        session_id: auth.sessionId ?? null
      },
      action: {
        method: req.method,
        path: req.path,
        status_code: res.statusCode,
        outcome: res.statusCode < 400 ? "SUCCESS" : "FAILURE"
      },
      request_id: requestId,
      latency_ms: Date.now() - start
    };
    (0, import_producer.publishEvent)("audit_events", event.actor.user_id ?? "", event).catch((err) => {
      console.error("[auditCapture] Kafka publish failed:", err);
    });
  });
  next();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  auditCapture
});
