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
var deliveries_exports = {};
__export(deliveries_exports, {
  default: () => deliveries_default
});
module.exports = __toCommonJS(deliveries_exports);
var import_express = require("express");
var import_zod = require("zod");
var import_clerkAuth = require("../../middleware/clerkAuth");
var import_prisma = require("../../db/prisma");
var import_errorHandler = require("../../middleware/errorHandler");
var import_events = require("../../kafka/events");
const router = (0, import_express.Router)();
const VALID_TRANSITIONS = {
  pending: ["assigned"],
  assigned: ["collected"],
  collected: ["in_transit"],
  in_transit: ["delivered"],
  delivered: ["confirmed", "disputed"],
  confirmed: [],
  disputed: []
};
const UpdateStatusSchema = import_zod.z.object({
  status: import_zod.z.enum(["assigned", "collected", "in_transit", "delivered", "confirmed", "disputed"]),
  driverId: import_zod.z.string().cuid().optional(),
  // required when → assigned
  proofUrl: import_zod.z.string().url().optional(),
  // required when → delivered
  note: import_zod.z.string().max(500).optional()
});
const LocationUpdateSchema = import_zod.z.object({
  lat: import_zod.z.number().finite(),
  lng: import_zod.z.number().finite()
});
router.get("/", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    if (!auth.userId) return next((0, import_errorHandler.createHttpError)(401, "Unauthorized"));
    const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
    let where = {};
    if (user.role === "driver") {
      where = { driverId: user.id };
    } else if (user.role === "dealer_owner" || user.role === "dealer_staff") {
      where = { order: { items: { some: { part: { dealerId: user.id } } } } };
    } else if (user.role !== "platform_admin") {
      where = { order: { buyerId: user.id } };
    }
    const deliveries = await import_prisma.prisma.delivery.findMany({
      where,
      include: {
        driver: { select: { id: true, name: true, email: true } },
        order: {
          select: {
            id: true,
            claimReference: true,
            status: true,
            currency: true,
            totalAmount: true,
            buyer: { select: { id: true, name: true, email: true } },
            items: {
              include: {
                part: { select: { id: true, name: true, oemNumber: true, condition: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ data: deliveries });
  } catch (err) {
    next(err);
  }
});
router.get("/:id", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const delivery = await import_prisma.prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            buyer: { select: { id: true, name: true, email: true } },
            items: {
              include: {
                part: { select: { id: true, name: true, oemNumber: true, condition: true, price: true, currency: true } }
              }
            }
          }
        },
        driver: { select: { id: true, name: true, email: true } }
      }
    });
    if (!delivery) throw (0, import_errorHandler.createHttpError)(404, "Delivery not found");
    const shaped = {
      ...delivery,
      driverLocation: delivery.driverLat != null ? { lat: delivery.driverLat, lng: delivery.driverLng } : null,
      destination: delivery.destLat != null ? { lat: delivery.destLat, lng: delivery.destLng } : null,
      estimatedMinutes: null,
      distanceKm: null,
      driver: delivery.driver
    };
    res.json({ data: shaped });
  } catch (err) {
    next(err);
  }
});
router.post(
  "/",
  import_clerkAuth.requireClerkAuth,
  (0, import_clerkAuth.requireRole)("dealer_owner", "dealer_staff", "platform_admin"),
  async (req, res, next) => {
    try {
      const auth = (0, import_clerkAuth.getRequestAuth)(req);
      if (!auth.userId) return next((0, import_errorHandler.createHttpError)(401, "Unauthorized"));
      const { orderId } = import_zod.z.object({ orderId: import_zod.z.string().cuid() }).parse(req.body);
      const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
      if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
      const order = await import_prisma.prisma.order.findUnique({ where: { id: orderId } });
      if (!order) throw (0, import_errorHandler.createHttpError)(404, "Order not found");
      if (order.status !== "confirmed") {
        throw (0, import_errorHandler.createHttpError)(400, "Order must be in confirmed status before creating a delivery");
      }
      const existing = await import_prisma.prisma.delivery.findUnique({ where: { orderId } });
      if (existing) throw (0, import_errorHandler.createHttpError)(409, "A delivery already exists for this order");
      const delivery = await import_prisma.prisma.delivery.create({
        data: { orderId, status: "pending" },
        include: {
          order: { select: { id: true, claimReference: true, buyerId: true } }
        }
      });
      await (0, import_events.publishEvent)("delivery_events", delivery.id, {
        event_type: "DELIVERY_CREATED",
        delivery_id: delivery.id,
        order_id: orderId,
        actor_id: user.id,
        actor_role: user.role
      });
      res.status(201).json({ data: delivery });
    } catch (err) {
      next(err);
    }
  }
);
router.patch("/:id/status", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    if (!auth.userId) return next((0, import_errorHandler.createHttpError)(401, "Unauthorized"));
    const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
    const body = UpdateStatusSchema.parse(req.body);
    const delivery = await import_prisma.prisma.delivery.findUnique({ where: { id: req.params.id } });
    if (!delivery) throw (0, import_errorHandler.createHttpError)(404, "Delivery not found");
    const currentStatus = delivery.status;
    const nextStatus = body.status;
    if (!VALID_TRANSITIONS[currentStatus].includes(nextStatus)) {
      throw (0, import_errorHandler.createHttpError)(
        400,
        `Cannot transition delivery from '${currentStatus}' to '${nextStatus}'`
      );
    }
    if (nextStatus === "assigned" && !["dealer_owner", "dealer_staff", "platform_admin"].includes(user.role)) {
      throw (0, import_errorHandler.createHttpError)(403, "Only dealers can assign a driver to a delivery");
    }
    if (nextStatus === "assigned" && !body.driverId) {
      throw (0, import_errorHandler.createHttpError)(400, "driverId is required when assigning a delivery");
    }
    if (["collected", "in_transit", "delivered"].includes(nextStatus) && !["driver", "platform_admin"].includes(user.role)) {
      throw (0, import_errorHandler.createHttpError)(403, "Only drivers can update collection and transit status");
    }
    if (["confirmed", "disputed"].includes(nextStatus) && !["garage_owner", "garage_staff", "assessor", "platform_admin"].includes(user.role)) {
      throw (0, import_errorHandler.createHttpError)(403, "Only the receiving party can confirm or dispute a delivery");
    }
    const updateData = { status: nextStatus };
    if (body.driverId) updateData.driverId = body.driverId;
    if (body.proofUrl) updateData.proofUrl = body.proofUrl;
    if (body.note !== void 0) updateData.note = body.note;
    if (nextStatus === "collected") updateData.collectedAt = /* @__PURE__ */ new Date();
    if (nextStatus === "delivered") updateData.deliveredAt = /* @__PURE__ */ new Date();
    const updated = await import_prisma.prisma.delivery.update({
      where: { id: req.params.id },
      data: updateData
    });
    await (0, import_events.publishEvent)("delivery_events", delivery.id, {
      event_type: "DELIVERY_STATUS_CHANGED",
      delivery_id: delivery.id,
      order_id: delivery.orderId,
      previous_status: currentStatus,
      new_status: nextStatus,
      actor_id: user.id,
      actor_role: user.role,
      proof_url: body.proofUrl ?? null,
      note: body.note ?? null
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});
router.patch(
  "/:id/location",
  import_clerkAuth.requireClerkAuth,
  (0, import_clerkAuth.requireRole)("driver", "platform_admin"),
  async (req, res, next) => {
    try {
      const auth = (0, import_clerkAuth.getRequestAuth)(req);
      if (!auth.userId) return next((0, import_errorHandler.createHttpError)(401, "Unauthorized"));
      const { lat, lng } = LocationUpdateSchema.parse(req.body);
      const delivery = await import_prisma.prisma.delivery.findUnique({ where: { id: req.params.id } });
      if (!delivery) throw (0, import_errorHandler.createHttpError)(404, "Delivery not found");
      const updated = await import_prisma.prisma.delivery.update({
        where: { id: req.params.id },
        data: { driverLat: lat, driverLng: lng }
      });
      await (0, import_events.publishEvent)("delivery_events", delivery.id, {
        event_type: "DELIVERY_LOCATION_UPDATED",
        delivery_id: delivery.id,
        driver_lat: lat,
        driver_lng: lng,
        updated_by: auth.userId
      });
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);
var deliveries_default = router;
