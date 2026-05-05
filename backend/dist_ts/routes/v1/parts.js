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
var parts_exports = {};
__export(parts_exports, {
  default: () => parts_default
});
module.exports = __toCommonJS(parts_exports);
var import_express = require("express");
var import_zod = require("zod");
var import_clerkAuth = require("../../middleware/clerkAuth");
var import_prisma = require("../../db/prisma");
var import_errorHandler = require("../../middleware/errorHandler");
const router = (0, import_express.Router)();
const CreatePartSchema = import_zod.z.object({
  name: import_zod.z.string().min(1).max(200),
  description: import_zod.z.string().optional(),
  oemNumber: import_zod.z.string().optional(),
  condition: import_zod.z.enum(["oem", "aftermarket", "used"]),
  price: import_zod.z.number().positive(),
  currency: import_zod.z.string().length(3).default("GHS"),
  country: import_zod.z.string().length(2),
  // ISO 3166-1 alpha-2
  stockStatus: import_zod.z.enum(["in_stock", "out_of_stock", "limited"]).default("in_stock"),
  attributes: import_zod.z.record(import_zod.z.unknown()).default({}),
  images: import_zod.z.array(import_zod.z.string().url()).default([])
});
const SearchPartsSchema = import_zod.z.object({
  q: import_zod.z.string().optional(),
  condition: import_zod.z.enum(["oem", "aftermarket", "used"]).optional(),
  country: import_zod.z.string().optional(),
  mine: import_zod.z.coerce.boolean().optional(),
  page: import_zod.z.coerce.number().int().positive().default(1),
  limit: import_zod.z.coerce.number().int().min(1).max(100).default(20)
});
router.get("/", async (req, res, next) => {
  try {
    const { q, condition, country, mine, page, limit } = SearchPartsSchema.parse(req.query);
    const skip = (page - 1) * limit;
    let ownerId;
    if (mine) {
      const auth = (0, import_clerkAuth.getRequestAuth)(req);
      if (!auth?.userId) {
        res.status(401).json({ error: "Authentication required for mine=true" });
        return;
      }
      const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId }, select: { id: true } });
      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }
      ownerId = user.id;
    }
    const where = {
      ...ownerId && { dealerId: ownerId },
      ...condition && { condition },
      ...country && { country },
      ...q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { oemNumber: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } }
        ]
      }
    };
    const [parts, total] = await import_prisma.prisma.$transaction([
      import_prisma.prisma.part.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { dealer: { select: { id: true, name: true } } }
      }),
      import_prisma.prisma.part.count({ where })
    ]);
    res.json({
      data: parts,
      meta: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
});
router.get("/:id", async (req, res, next) => {
  try {
    const part = await import_prisma.prisma.part.findUnique({
      where: { id: req.params.id },
      include: { dealer: { select: { id: true, name: true } } }
    });
    if (!part) throw (0, import_errorHandler.createHttpError)(404, "Part not found");
    res.json({ data: part });
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
      const data = CreatePartSchema.parse(req.body);
      const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
      if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found \u2014 ensure webhook provisioned");
      const part = await import_prisma.prisma.part.create({
        data: {
          ...data,
          attributes: data.attributes,
          price: data.price,
          dealerId: user.id
        }
      });
      res.status(201).json({ data: part });
    } catch (err) {
      next(err);
    }
  }
);
router.patch(
  "/:id",
  import_clerkAuth.requireClerkAuth,
  (0, import_clerkAuth.requireRole)("dealer_owner", "dealer_staff", "platform_admin"),
  async (req, res, next) => {
    try {
      const auth = (0, import_clerkAuth.getRequestAuth)(req);
      const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
      if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
      const part = await import_prisma.prisma.part.findUnique({ where: { id: req.params.id } });
      if (!part) throw (0, import_errorHandler.createHttpError)(404, "Part not found");
      if (part.dealerId !== user.id && auth.role !== "platform_admin") {
        throw (0, import_errorHandler.createHttpError)(403, "You can only update your own listings");
      }
      const rawUpdate = CreatePartSchema.partial().parse(req.body);
      const updated = await import_prisma.prisma.part.update({
        where: { id: req.params.id },
        data: {
          ...rawUpdate,
          ...rawUpdate.attributes !== void 0 && {
            attributes: rawUpdate.attributes
          }
        }
      });
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);
router.delete(
  "/:id",
  import_clerkAuth.requireClerkAuth,
  (0, import_clerkAuth.requireRole)("dealer_owner", "platform_admin"),
  async (req, res, next) => {
    try {
      const auth = (0, import_clerkAuth.getRequestAuth)(req);
      const user = await import_prisma.prisma.user.findUnique({ where: { clerkId: auth.userId } });
      if (!user) throw (0, import_errorHandler.createHttpError)(404, "User not found");
      const part = await import_prisma.prisma.part.findUnique({ where: { id: req.params.id } });
      if (!part) throw (0, import_errorHandler.createHttpError)(404, "Part not found");
      if (part.dealerId !== user.id && auth.role !== "platform_admin") {
        throw (0, import_errorHandler.createHttpError)(403, "Forbidden");
      }
      await import_prisma.prisma.part.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);
var parts_default = router;
