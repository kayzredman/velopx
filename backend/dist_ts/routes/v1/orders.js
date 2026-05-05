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
var orders_exports = {};
__export(orders_exports, {
  default: () => orders_default
});
module.exports = __toCommonJS(orders_exports);
var import_express = require("express");
var import_zod = require("zod");
var import_clerkAuth = require("../../middleware/clerkAuth");
var import_prisma = require("../../db/prisma");
var import_errorHandler = require("../../middleware/errorHandler");
var import_events = require("../../kafka/events");
const router = (0, import_express.Router)();
const CreateOrderSchema = import_zod.z.object({
  claimReference: import_zod.z.string().optional(),
  currency: import_zod.z.string().length(3),
  items: import_zod.z.array(
    import_zod.z.object({
      partId: import_zod.z.string().cuid(),
      quantity: import_zod.z.number().int().positive().default(1),
      price: import_zod.z.number().positive()
    })
  ).min(1)
});
router.get("/", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    const user = await (0, import_clerkAuth.getOrCreateUser)(auth.userId);
    const isSellerView = req.query.view === "seller" && (user.role === "dealer_owner" || user.role === "dealer_staff" || user.role === "platform_admin");
    const where = isSellerView ? { items: { some: { part: { dealerId: user.id } } } } : { buyerId: user.id };
    const orders = await import_prisma.prisma.order.findMany({
      where,
      include: {
        buyer: isSellerView ? { select: { id: true, name: true, email: true } } : false,
        items: { include: { part: { select: { id: true, name: true } } } },
        delivery: true
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ data: orders });
  } catch (err) {
    next(err);
  }
});
router.get("/:id", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    const user = await (0, import_clerkAuth.getOrCreateUser)(auth.userId);
    const order = await import_prisma.prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { part: { select: { id: true, name: true, oemNumber: true, condition: true } } } },
        delivery: true
      }
    });
    if (!order) throw (0, import_errorHandler.createHttpError)(404, "Order not found");
    if (order.buyerId !== user.id && auth.role !== "platform_admin") {
      throw (0, import_errorHandler.createHttpError)(403, "Forbidden");
    }
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
});
router.post("/", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
    const data = CreateOrderSchema.parse(req.body);
    const totalAmount = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await import_prisma.prisma.order.create({
      data: {
        buyerId: user.id,
        claimReference: data.claimReference,
        currency: data.currency,
        totalAmount,
        items: {
          create: data.items.map((item) => ({
            partId: item.partId,
            quantity: item.quantity,
            price: item.price,
            currency: data.currency
          }))
        }
      },
      include: { items: true }
    });
    await (0, import_events.publishEvent)("order_events", order.id, {
      event_type: "ORDER_CREATED",
      order_id: order.id,
      buyer_id: user.id,
      claim_reference: data.claimReference ?? null,
      currency: data.currency,
      total_amount: totalAmount,
      item_count: data.items.length
    });
    res.status(201).json({ data: order });
  } catch (err) {
    next(err);
  }
});
router.patch("/:id/status", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const { status } = import_zod.z.object({
      status: import_zod.z.enum([
        "confirmed",
        "dispatched",
        "delivered",
        "completed",
        "cancelled",
        "disputed"
      ])
    }).parse(req.body);
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    const user = await (0, import_clerkAuth.getOrCreateUser)(auth.userId);
    const order = await import_prisma.prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw (0, import_errorHandler.createHttpError)(404, "Order not found");
    if (order.buyerId !== user.id && auth.role !== "platform_admin") {
      throw (0, import_errorHandler.createHttpError)(403, "Forbidden");
    }
    const updated = await import_prisma.prisma.order.update({
      where: { id: req.params.id },
      data: { status }
    });
    await (0, import_events.publishEvent)("order_events", req.params.id, {
      event_type: "ORDER_STATUS_CHANGED",
      order_id: req.params.id,
      previous_status: order.status,
      new_status: status,
      actor_id: user.id,
      actor_role: user.role
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});
var orders_default = router;
