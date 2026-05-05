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
var job_cards_exports = {};
__export(job_cards_exports, {
  default: () => job_cards_default
});
module.exports = __toCommonJS(job_cards_exports);
var import_express = require("express");
var import_zod = require("zod");
var import_clerkAuth = require("../../middleware/clerkAuth");
var import_prisma = require("../../db/prisma");
var import_errorHandler = require("../../middleware/errorHandler");
var import_events = require("../../kafka/events");
const router = (0, import_express.Router)();
const CreateJobCardSchema = import_zod.z.object({
  customerName: import_zod.z.string().min(1),
  vehicleReg: import_zod.z.string().optional(),
  vehicleProfile: import_zod.z.record(import_zod.z.unknown()).optional(),
  description: import_zod.z.string().min(1),
  mechanic: import_zod.z.string().optional(),
  claimReference: import_zod.z.string().optional(),
  orderIds: import_zod.z.array(import_zod.z.string().cuid()).optional()
});
const UpdateJobCardSchema = import_zod.z.object({
  status: import_zod.z.enum(["waiting_for_parts", "in_progress", "complete", "cancelled"]).optional(),
  mechanic: import_zod.z.string().optional(),
  description: import_zod.z.string().optional(),
  claimReference: import_zod.z.string().optional(),
  vehicleReg: import_zod.z.string().optional()
});
router.get("/", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
    const allowedRoles = ["garage_owner", "garage_staff", "platform_admin"];
    if (!allowedRoles.includes(user.role)) throw (0, import_errorHandler.createHttpError)(403, "Forbidden");
    const where = user.role === "platform_admin" ? {} : { garageId: user.id };
    const cards = await import_prisma.prisma.jobCard.findMany({
      where,
      include: {
        orders: {
          include: {
            items: { include: { part: { select: { id: true, name: true, oemNumber: true } } } },
            delivery: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ data: cards });
  } catch (err) {
    next(err);
  }
});
router.get("/:id", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
    const card = await import_prisma.prisma.jobCard.findUnique({
      where: { id: req.params.id },
      include: {
        orders: {
          include: {
            items: { include: { part: { select: { id: true, name: true, oemNumber: true } } } },
            delivery: true
          }
        }
      }
    });
    if (!card) throw (0, import_errorHandler.createHttpError)(404, "Job card not found");
    if (card.garageId !== user.id && user.role !== "platform_admin") throw (0, import_errorHandler.createHttpError)(403, "Forbidden");
    res.json({ data: card });
  } catch (err) {
    next(err);
  }
});
router.post("/", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
    if (user.role !== "garage_owner" && user.role !== "garage_staff" && user.role !== "platform_admin") {
      throw (0, import_errorHandler.createHttpError)(403, "Forbidden");
    }
    const body = CreateJobCardSchema.parse(req.body);
    const card = await import_prisma.prisma.jobCard.create({
      data: {
        garageId: user.id,
        customerName: body.customerName,
        vehicleReg: body.vehicleReg,
        vehicleProfile: body.vehicleProfile,
        description: body.description,
        mechanic: body.mechanic,
        claimReference: body.claimReference,
        ...body.orderIds?.length ? { orders: { connect: body.orderIds.map((id) => ({ id })) } } : {}
      },
      include: { orders: true }
    });
    void (0, import_events.publishEvent)("audit_events", card.id, {
      type: "JOB_CARD_CREATED",
      garageId: user.id
    });
    res.status(201).json({ data: card });
  } catch (err) {
    next(err);
  }
});
router.patch("/:id", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
    const card = await import_prisma.prisma.jobCard.findUnique({ where: { id: req.params.id } });
    if (!card) throw (0, import_errorHandler.createHttpError)(404, "Job card not found");
    if (card.garageId !== user.id && user.role !== "platform_admin") throw (0, import_errorHandler.createHttpError)(403, "Forbidden");
    const body = UpdateJobCardSchema.parse(req.body);
    const updated = await import_prisma.prisma.jobCard.update({
      where: { id: req.params.id },
      data: body
    });
    void (0, import_events.publishEvent)("audit_events", card.id, {
      type: "JOB_CARD_UPDATED",
      garageId: user.id,
      changes: body
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});
router.post("/:id/orders", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
    const card = await import_prisma.prisma.jobCard.findUnique({ where: { id: req.params.id } });
    if (!card) throw (0, import_errorHandler.createHttpError)(404, "Job card not found");
    if (card.garageId !== user.id && user.role !== "platform_admin") throw (0, import_errorHandler.createHttpError)(403, "Forbidden");
    const { orderId } = import_zod.z.object({ orderId: import_zod.z.string().cuid() }).parse(req.body);
    const order = await import_prisma.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw (0, import_errorHandler.createHttpError)(404, "Order not found");
    if (order.buyerId !== user.id) throw (0, import_errorHandler.createHttpError)(403, "Cannot link an order you did not place");
    await import_prisma.prisma.order.update({
      where: { id: orderId },
      data: { jobCardId: req.params.id }
    });
    res.json({ data: { linked: true } });
  } catch (err) {
    next(err);
  }
});
var job_cards_default = router;
