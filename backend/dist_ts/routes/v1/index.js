"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var v1_exports = {};
__export(v1_exports, {
  default: () => v1_default
});
module.exports = __toCommonJS(v1_exports);
var import_express = require("express");
var import_parts = __toESM(require("./parts"));
var import_quotes = __toESM(require("./quotes"));
var import_orders = __toESM(require("./orders"));
var import_deliveries = __toESM(require("./deliveries"));
var import_claims = __toESM(require("./claims"));
var import_job_cards = __toESM(require("./job-cards"));
var import_webhooks = __toESM(require("./webhooks"));
const router = (0, import_express.Router)();
router.use("/parts", import_parts.default);
router.use("/quotes", import_quotes.default);
router.use("/orders", import_orders.default);
router.use("/deliveries", import_deliveries.default);
router.use("/claims", import_claims.default);
router.use("/job-cards", import_job_cards.default);
router.use("/webhooks", import_webhooks.default);
var v1_default = router;
