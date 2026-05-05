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
var clerkAuth_exports = {};
__export(clerkAuth_exports, {
  getOrCreateUser: () => getOrCreateUser,
  getRequestAuth: () => getRequestAuth,
  requireClerkAuth: () => requireClerkAuth,
  requireRole: () => requireRole
});
module.exports = __toCommonJS(clerkAuth_exports);
var import_express = require("@clerk/express");
var import_prisma = require("../db/prisma");
function requireClerkAuth(req, res, next) {
  const auth = (0, import_express.getAuth)(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }
  next();
}
function requireRole(...roles) {
  return (req, res, next) => {
    const auth = (0, import_express.getAuth)(req);
    if (!auth?.userId) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }
    if (roles.length > 0) {
      const role = auth.sessionClaims?.metadata?.role;
      if (!role || !roles.includes(role)) {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }
    }
    next();
  };
}
function getRequestAuth(req) {
  const auth = (0, import_express.getAuth)(req);
  const role = auth.sessionClaims?.metadata?.role;
  return {
    userId: auth.userId,
    orgId: auth.orgId,
    sessionId: auth.sessionId,
    role
  };
}
async function getOrCreateUser(clerkId) {
  const existing = await import_prisma.prisma.user.findUnique({ where: { clerkId } });
  if (existing) return existing;
  let email = `${clerkId}@unknown.local`;
  let name;
  try {
    const clerkUser = await import_express.clerkClient.users.getUser(clerkId);
    const primary = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    );
    email = primary?.emailAddress ?? email;
    name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || void 0;
    const role = clerkUser.unsafeMetadata?.role ?? clerkUser.publicMetadata?.role ?? "dealer_owner";
    return import_prisma.prisma.user.create({ data: { clerkId, email, name, role } });
  } catch {
    return import_prisma.prisma.user.create({ data: { clerkId, email, name, role: "dealer_owner" } });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getOrCreateUser,
  getRequestAuth,
  requireClerkAuth,
  requireRole
});
