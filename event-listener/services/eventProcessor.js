const EventModel = require('../models/Event');
const dedupService = require('./deduplicationService');

class EventProcessor {
  constructor(instanceId) {
    this.instanceId = instanceId;
    this.stats = { received: 0, processed: 0, deduplicated: 0, failed: 0 };
  }

  async processEvent(eventData) {
    const start = Date.now();
    const eventId = eventData.id;
    this.stats.received++;

    try {
      const claimed = await dedupService.claimEvent(eventId, this.instanceId);
      if (!claimed) {
        this.stats.deduplicated++;
        return { success: true, deduplicated: true, eventId, reason: 'claimed/processed' };
      }

      // simulate processing
      await this.simulateProcessing();

      // persist
      const doc = new EventModel({
        eventId: eventData.id,
        type: eventData.type,
        timestamp: new Date(eventData.timestamp),
        payload: eventData.payload,
        sequenceNumber: eventData.sequenceNumber,
        processedBy: this.instanceId,
        processingTimeMs: Date.now() - start
      });
      await doc.save();

      await dedupService.markProcessed(eventId, this.instanceId);
      this.stats.processed++;
      console.log(`[SUCCESS] ✓ ${eventId} processed by ${this.instanceId} in ${Date.now()-start}ms`);
      return { success: true, deduplicated: false, eventId, processingTime: Date.now() - start };
    } catch (err) {
      this.stats.failed++;
      console.error(`[FAILED] ✗ Error processing ${eventId}:`, err.message);
      // release lock so others can try
      await dedupService.releaseLock(eventId);
      return { success: false, eventId, error: err.message };
    }
  }

  simulateProcessing() {
    const delay = Math.floor(Math.random() * 150) + 50;
    return new Promise(res => setTimeout(res, delay));
  }

  getStats() {
    return {
      instanceId: this.instanceId,
      ...this.stats,
      deduplicationRate: this.stats.received > 0 ? ((this.stats.deduplicated / this.stats.received) * 100).toFixed(2) + '%' : '0%'
    };
  }
}

module.exports = EventProcessor;
