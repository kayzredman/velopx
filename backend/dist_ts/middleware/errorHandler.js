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
var errorHandler_exports = {};
__export(errorHandler_exports, {
  createHttpError: () => createHttpError,
  errorHandler: () => errorHandler
});
module.exports = __toCommonJS(errorHandler_exports);
var import_zod = require("zod");
function errorHandler(err, _req, res, _next) {
  if (err instanceof import_zod.ZodError) {
    res.status(422).json({
      error: "Validation failed",
      issues: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message
      }))
    });
    return;
  }
  if (isHttpError(err)) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error("[errorHandler]", err);
  res.status(500).json({ error: "Internal server error" });
}
function isHttpError(err) {
  return err instanceof Error && "status" in err && typeof err.status === "number";
}
function createHttpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createHttpError,
  errorHandler
});
