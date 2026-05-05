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
var quotes_exports = {};
__export(quotes_exports, {
  default: () => quotes_default
});
module.exports = __toCommonJS(quotes_exports);
var import_express = require("express");
var import_zod = require("zod");
var import_clerkAuth = require("../../middleware/clerkAuth");
var import_prisma = require("../../db/prisma");
var import_errorHandler = require("../../middleware/errorHandler");
var import_events = require("../../kafka/events");
const router = (0, import_express.Router)();
const QuoteItemSchema = import_zod.z.object({
  partId: import_zod.z.string().cuid(),
  price: import_zod.z.number().positive(),
  currency: import_zod.z.string().length(3),
  note: import_zod.z.string().optional()
});
const CreateQuoteSchema = import_zod.z.object({
  claimReference: import_zod.z.string().optional(),
  vehicleProfile: import_zod.z.object({
    vin: import_zod.z.string().optional(),
    make: import_zod.z.string(),
    model: import_zod.z.string(),
    year: import_zod.z.number().int().min(1900).max((/* @__PURE__ */ new Date()).getFullYear() + 1),
    engine: import_zod.z.string().optional(),
    bodyType: import_zod.z.string().optional()
  }).optional(),
  items: import_zod.z.array(QuoteItemSchema).min(1),
  expiresAt: import_zod.z.string().datetime().optional()
});
router.get("/", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
    const quotes = await import_prisma.prisma.quote.findMany({
      where: { requesterId: user.id },
      include: {
        items: { include: { part: { select: { id: true, name: true, oemNumber: true } } } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ data: quotes });
  } catch (err) {
    next(err);
  }
});
router.get("/for-dealer", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
    const quotes = await import_prisma.prisma.quote.findMany({
      where: {
        items: { some: { part: { dealerId: user.id } } }
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            part: { select: { id: true, name: true, oemNumber: true, condition: true, price: true, currency: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ data: quotes });
  } catch (err) {
    next(err);
  }
});
router.get("/:id", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
    const quote = await import_prisma.prisma.quote.findUnique({
      where: { id: req.params.id },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            part: { select: { id: true, name: true, oemNumber: true, condition: true, dealer: { select: { id: true, name: true } } } }
          }
        }
      }
    });
    if (!quote) throw (0, import_errorHandler.createHttpError)(404, "Quote not found");
    const isDealerOnQuote = quote.items.some((item) => item.part.dealer.id === user.id);
    if (quote.requesterId !== user.id && !isDealerOnQuote && auth.role !== "platform_admin") {
      throw (0, import_errorHandler.createHttpError)(403, "Forbidden");
    }
    res.json({ data: quote });
  } catch (err) {
    next(err);
  }
});
router.post("/", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
    const data = CreateQuoteSchema.parse(req.body);
    const quote = await import_prisma.prisma.quote.create({
      data: {
        requesterId: user.id,
        claimReference: data.claimReference,
        vehicleProfile: data.vehicleProfile,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : void 0,
        items: {
          create: data.items.map((item) => ({
            partId: item.partId,
            price: item.price,
            currency: item.currency,
            note: item.note
          }))
        }
      },
      include: { items: true }
    });
    res.status(201).json({ data: quote });
  } catch (err) {
    next(err);
  }
});
router.patch("/:id/status", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const { status } = import_zod.z.object({ status: import_zod.z.enum(["accepted", "declined"]) }).parse(req.body);
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
    const quote = await import_prisma.prisma.quote.findUnique({ where: { id: req.params.id } });
    if (!quote) throw (0, import_errorHandler.createHttpError)(404, "Quote not found");
    if (quote.requesterId !== user.id && auth.role !== "platform_admin") {
      throw (0, import_errorHandler.createHttpError)(403, "Forbidden");
    }
    if (quote.status !== "responded") {
      throw (0, import_errorHandler.createHttpError)(400, "Quote must be in responded status before accepting or declining");
    }
    const updated = await import_prisma.prisma.quote.update({
      where: { id: req.params.id },
      data: { status }
    });
    if (status === "accepted") {
      await (0, import_events.publishEvent)("quote_events", req.params.id, {
        event_type: "QUOTE_ACCEPTED",
        quote_id: req.params.id,
        requester_id: user.id,
        claim_reference: quote.claimReference ?? null
      });
    }
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});
const RespondSchema = import_zod.z.object({
  items: import_zod.z.array(
    import_zod.z.object({
      quoteItemId: import_zod.z.string().cuid(),
      price: import_zod.z.number().positive(),
      currency: import_zod.z.string().length(3),
      note: import_zod.z.string().optional()
    })
  ).min(1)
});
router.patch("/:id/respond", import_clerkAuth.requireClerkAuth, async (req, res, next) => {
  try {
    const auth = (0, import_clerkAuth.getRequestAuth)(req);
    const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
    const quote = await import_prisma.prisma.quote.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { part: { select: { dealerId: true } } } }
      }
    });
    if (!quote) throw (0, import_errorHandler.createHttpError)(404, "Quote not found");
    if (quote.status !== "pending") {
      throw (0, import_errorHandler.createHttpError)(400, "Only pending quotes can be responded to");
    }
    const dealerItemIds = new Set(
      quote.items.filter((i) => i.part.dealerId === user.id).map((i) => i.id)
    );
    if (dealerItemIds.size === 0) throw (0, import_errorHandler.createHttpError)(403, "Forbidden");
    const { items } = RespondSchema.parse(req.body);
    const invalidItem = items.find((i) => !dealerItemIds.has(i.quoteItemId));
    if (invalidItem) throw (0, import_errorHandler.createHttpError)(403, "One or more items do not belong to your catalogue");
    await import_prisma.prisma.$transaction([
      ...items.map(
        (item) => import_prisma.prisma.quoteItem.update({
          where: { id: item.quoteItemId },
          data: { price: item.price, currency: item.currency, note: item.note }
        })
      ),
      import_prisma.prisma.quote.update({
        where: { id: req.params.id },
        data: { status: "responded" }
      })
    ]);
    await (0, import_events.publishEvent)("quote_events", req.params.id, {
      event_type: "QUOTE_RESPONDED",
      quote_id: req.params.id,
      dealer_id: user.id,
      claim_reference: quote.claimReference ?? null
    });
    const updated = await import_prisma.prisma.quote.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { part: { select: { id: true, name: true, oemNumber: true } } } }
      }
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});
var quotes_default = router;
