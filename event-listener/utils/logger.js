class Logger {
  constructor(instanceId) { this.instanceId = instanceId; }
  info(msg, obj = {}) { console.log(`[${this.instanceId}] ${msg}`, obj); }
  success(msg, obj = {}) { console.log(`[${this.instanceId}]  ${msg}`, obj); }
  error(msg, err) { console.error(`[${this.instanceId}]  ${msg}`, err?.message || err); }
  warn(msg, obj = {}) { console.warn(`[${this.instanceId}]  ${msg}`, obj); }
}
module.exports = Logger;