const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true, index: true },
  timestamp: { type: Date, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  sequenceNumber: { type: Number, index: true },
  processedBy: { type: String, required: true },
  processedAt: { type: Date, default: Date.now },
  processingTimeMs: { type: Number }
}, { timestamps: true });

eventSchema.index({ type: 1, processedAt: -1 });
eventSchema.index({ processedBy: 1, processedAt: -1 });

module.exports = mongoose.model('Event', eventSchema);
