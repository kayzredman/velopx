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
var auditConsumer_exports = {};
__export(auditConsumer_exports, {
  startAuditConsumer: () => startAuditConsumer
});
module.exports = __toCommonJS(auditConsumer_exports);
var import_producer = require("../producer");
var import_prisma = require("../../db/prisma");
async function startAuditConsumer() {
  const consumer = (0, import_producer.kafka)().consumer({ groupId: "velopx-audit-writer" });
  await consumer.connect();
  await consumer.subscribe({ topic: "audit_events", fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      try {
        const event = JSON.parse(message.value.toString());
        await import_prisma.prisma.auditEvent.create({
          data: {
            userId: event.actor.user_id ?? void 0,
            organisationId: event.actor.organisation_id ?? void 0,
            role: event.actor.role ?? void 0,
            actionType: `${event.action.method} ${event.action.path}`,
            outcome: event.action.outcome,
            sessionId: event.actor.session_id ?? void 0,
            requestId: event.request_id,
            latencyMs: event.latency_ms,
            metadata: event
          }
        });
      } catch (err) {
        console.error("[auditConsumer] Failed to write audit event:", err);
      }
    }
  });
  console.log("\u2713 Audit consumer running");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  startAuditConsumer
});
