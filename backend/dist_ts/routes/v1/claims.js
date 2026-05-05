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
var claims_exports = {};
__export(claims_exports, {
  default: () => claims_default
});
module.exports = __toCommonJS(claims_exports);
var import_express = require("express");
var import_zod = require("zod");
var import_clerkAuth = require("../../middleware/clerkAuth");
var import_prisma = require("../../db/prisma");
var import_errorHandler = require("../../middleware/errorHandler");
var import_events = require("../../kafka/events");
const router = (0, import_express.Router)();
const LineItemSchema = import_zod.z.object({
  partId: import_zod.z.string().cuid().optional(),
  partName: import_zod.z.string().min(1),
  oemNumber: import_zod.z.string().optional(),
  invoicePrice: import_zod.z.number().positive(),
  benchmarkLow: import_zod.z.number().positive().optional(),
  benchmarkHigh: import_zod.z.number().positive().optional(),
  deviation: import_zod.z.number().optional(),
  currency: import_zod.z.string().length(3).default("GHS")
});
const CreateClaimSchema = import_zod.z.object({
  claimReference: import_zod.z.string().min(1),
  garageName: import_zod.z.string().optional(),
  vehicleProfile: import_zod.z.record(import_zod.z.unknown()).optional(),
  invoiceAmount: import_zod.z.number().positive(),
  currency: import_zod.z.string().length(3).default("GHS"),
  lineItems: import_zod.z.array(LineItemSchema).min(1)
});
const UpdateClaimSchema = import_zod.z.object({
  status: import_zod.z.enum(["open", "under_review", "closed"]).optional(),
  flag: import_zod.z.enum(["ok", "review", "flagged"]).optional(),
  outcome: import_zod.z.enum(["approved", "adjusted", "rejected"]).optional(),
  benchmarkAmount: import_zod.z.number().positive().optional()
});
router.get("/", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
    const allowedRoles = ["assessor", "insurer_admin", "insurer_staff", "platform_admin"];
    if (!allowedRoles.includes(user.role)) throw (0, import_errorHandler.createHttpError)(403, "Forbidden");
    const where = user.role === "platform_admin" ? {} : user.role === "insurer_admin" || user.role === "insurer_staff" ? { assessor: { organisationId: user.organisationId ?? void 0 } } : { assessorId: user.id };
    const claims = await import_prisma.prisma.claim.findMany({
      where,
      include: {
        assessor: { select: { id: true, name: true, email: true } },
        lineItems: true
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ data: claims });
  } catch (err) {
    next(err);
  }
});
router.get("/:id", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
    const claim = await import_prisma.prisma.claim.findUnique({
      where: { id: req.params.id },
      include: {
        assessor: { select: { id: true, name: true, email: true } },
        lineItems: { include: { part: { select: { id: true, name: true, oemNumber: true, price: true, currency: true } } } }
      }
    });
    if (!claim) throw (0, import_errorHandler.createHttpError)(404, "Claim not found");
    const isOwner = claim.assessorId === user.id;
    const isAdmin = user.role === "platform_admin";
    const isInsurer = (user.role === "insurer_admin" || user.role === "insurer_staff") && user.organisationId != null && claim.assessor.id != null;
    if (!isOwner && !isAdmin && !isInsurer) throw (0, import_errorHandler.createHttpError)(403, "Forbidden");
    res.json({ data: claim });
  } catch (err) {
    next(err);
  }
});
router.post("/", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
    if (user.role !== "assessor" && user.role !== "platform_admin") throw (0, import_errorHandler.createHttpError)(403, "Forbidden");
    const body = CreateClaimSchema.parse(req.body);
    const existing = await import_prisma.prisma.claim.findUnique({ where: { claimReference: body.claimReference } });
    if (existing) throw (0, import_errorHandler.createHttpError)(409, "Claim reference already exists");
    const claim = await import_prisma.prisma.claim.create({
      data: {
        assessorId: user.id,
        claimReference: body.claimReference,
        garageName: body.garageName,
        vehicleProfile: body.vehicleProfile,
        invoiceAmount: body.invoiceAmount,
        currency: body.currency,
        lineItems: {
          create: body.lineItems.map((li) => ({
            partId: li.partId,
            partName: li.partName,
            oemNumber: li.oemNumber,
            invoicePrice: li.invoicePrice,
            benchmarkLow: li.benchmarkLow,
            benchmarkHigh: li.benchmarkHigh,
            deviation: li.deviation,
            currency: li.currency
          }))
        }
      },
      include: { lineItems: true }
    });
    void (0, import_events.publishEvent)("audit_events", claim.id, {
      type: "CLAIM_CREATED",
      assessorId: user.id,
      claimReference: body.claimReference
    });
    res.status(201).json({ data: claim });
  } catch (err) {
    next(err);
  }
});
router.patch("/:id", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
    const claim = await import_prisma.prisma.claim.findUnique({ where: { id: req.params.id } });
    if (!claim) throw (0, import_errorHandler.createHttpError)(404, "Claim not found");
    if (claim.assessorId !== user.id && user.role !== "platform_admin") throw (0, import_errorHandler.createHttpError)(403, "Forbidden");
    const body = UpdateClaimSchema.parse(req.body);
    const updated = await import_prisma.prisma.claim.update({
      where: { id: req.params.id },
      data: body
    });
    void (0, import_events.publishEvent)("audit_events", claim.id, {
      type: "CLAIM_UPDATED",
      assessorId: user.id,
      changes: body
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});
var claims_default = router;
