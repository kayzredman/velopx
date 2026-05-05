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
var webhooks_exports = {};
__export(webhooks_exports, {
  default: () => webhooks_default
});
module.exports = __toCommonJS(webhooks_exports);
var import_express = require("express");
var import_svix = require("svix");
var import_prisma = require("../../db/prisma");
const router = (0, import_express.Router)();
router.post(
  "/clerk",
  async (req, res) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[webhook] CLERK_WEBHOOK_SECRET not set");
      res.status(500).json({ error: "Webhook secret not configured" });
      return;
    }
    let rawBody;
    try {
      rawBody = await getRawBody(req);
    } catch {
      res.status(400).json({ error: "Could not read request body" });
      return;
    }
    const svixHeaders = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"]
    };
    if (!svixHeaders["svix-id"] || !svixHeaders["svix-timestamp"] || !svixHeaders["svix-signature"]) {
      res.status(400).json({ error: "Missing Svix headers" });
      return;
    }
    let event;
    try {
      const wh = new import_svix.Webhook(webhookSecret);
      event = wh.verify(rawBody, svixHeaders);
    } catch (err) {
      console.error("[webhook] Signature verification failed:", err);
      res.status(400).json({ error: "Invalid webhook signature" });
      return;
    }
    try {
      await handleClerkEvent(event);
      res.json({ received: true });
    } catch (err) {
      console.error("[webhook] Handler failed:", err);
      res.status(500).json({ error: "Webhook handler failed" });
    }
  }
);
async function handleClerkEvent(event) {
  switch (event.type) {
    case "user.created": {
      const { id, email_addresses, first_name, last_name, public_metadata, unsafe_metadata } = event.data;
      const primaryEmail = email_addresses.find((e) => e.id === event.data.primary_email_address_id);
      await import_prisma.prisma.user.upsert({
        where: { clerkId: id },
        create: {
          clerkId: id,
          email: primaryEmail?.email_address ?? "",
          name: [first_name, last_name].filter(Boolean).join(" ") || void 0,
          role: unsafe_metadata?.role ?? public_metadata?.role ?? "driver"
        },
        update: {
          email: primaryEmail?.email_address ?? void 0,
          name: [first_name, last_name].filter(Boolean).join(" ") || void 0
        }
      });
      break;
    }
    case "user.updated": {
      const { id, email_addresses, first_name, last_name, public_metadata } = event.data;
      const primaryEmail = email_addresses.find((e) => e.id === event.data.primary_email_address_id);
      await import_prisma.prisma.user.update({
        where: { clerkId: id },
        data: {
          email: primaryEmail?.email_address ?? void 0,
          name: [first_name, last_name].filter(Boolean).join(" ") || void 0,
          role: public_metadata?.role ?? void 0
        }
      });
      break;
    }
    case "user.deleted": {
      if (event.data.id) {
        await import_prisma.prisma.user.delete({ where: { clerkId: event.data.id } }).catch(() => {
        });
      }
      break;
    }
    default:
      break;
  }
}
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => data += chunk);
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}
var webhooks_default = router;
