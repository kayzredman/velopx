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
var producer_exports = {};
__export(producer_exports, {
  connectKafka: () => connectKafka,
  disconnectKafka: () => disconnectKafka,
  isKafkaConnected: () => isKafkaConnected,
  kafka: () => getKafka,
  publishEvent: () => publishEvent
});
module.exports = __toCommonJS(producer_exports);
var import_kafkajs = require("kafkajs");
let kafka;
let kafkaProducer;
function getKafka() {
  if (!kafka) {
    kafka = new import_kafkajs.Kafka({
      clientId: "velopx-backend",
      brokers: (process.env.KAFKA_BROKERS ?? "localhost:9092").split(",")
    });
  }
  return kafka;
}
let _kafkaConnected = false;
function isKafkaConnected() {
  return _kafkaConnected;
}
async function connectKafka() {
  kafkaProducer = getKafka().producer({ allowAutoTopicCreation: true });
  await kafkaProducer.connect();
  _kafkaConnected = true;
}
async function disconnectKafka() {
  _kafkaConnected = false;
  if (kafkaProducer) await kafkaProducer.disconnect();
}
function publishEvent(topic, key, value) {
  if (!kafkaProducer || !_kafkaConnected) return Promise.resolve();
  return kafkaProducer.send({ topic, messages: [{ key, value: JSON.stringify(value) }] }).then(() => void 0);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  connectKafka,
  disconnectKafka,
  isKafkaConnected,
  kafka,
  publishEvent
});
