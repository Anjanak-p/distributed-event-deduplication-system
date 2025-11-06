const redisClient = require('../config/redis');

class DeduplicationService {
  constructor(){
    this.LOCK_TTL = parseInt(process.env.LOCK_TTL || '60'); // seconds
    this.PROCESSED_TTL = parseInt(process.env.PROCESSED_TTL || `${24*3600}`); // 24h
    this.redis = null;
  }

  async initialize(){
    this.redis = redisClient.getClient();
  }

  async claimEvent(eventId, instanceId){
    const lockKey = `lock:${eventId}`;
    const processedKey = `processed:${eventId}`;

    try {
      // Fast path: processed marker
      const alreadyProcessed = await this.redis.get(processedKey);
      if (alreadyProcessed) {
        console.log(`[DEDUP] Event ${eventId} already processed by ${alreadyProcessed}`);
        return false;
      }

      // Atomic set NX EX
      const result = await this.redis.set(lockKey, instanceId, { NX: true, EX: this.LOCK_TTL });
      if (result === 'OK') {
        console.log(`[CLAIM] ✓ ${instanceId} claimed ${eventId}`);
        return true;
      } else {
        const locker = await this.redis.get(lockKey);
        console.log(`[DEDUP] Event ${eventId} already claimed by ${locker}`);
        return false;
      }
    } catch (err) {
      console.error(`[ERROR] claimEvent ${eventId}:`, err.message);
      return false;
    }
  }

  async markProcessed(eventId, instanceId){
    const processedKey = `processed:${eventId}`;
    const lockKey = `lock:${eventId}`;
    try {
      await this.redis.set(processedKey, instanceId, { EX: this.PROCESSED_TTL });
      await this.redis.del(lockKey);
      console.log(`[COMPLETE] Event ${eventId} marked processed by ${instanceId}`);
    } catch (err) {
      console.error(`[ERROR] markProcessed ${eventId}:`, err.message);
    }
  }

  async releaseLock(eventId){
    const lockKey = `lock:${eventId}`;
    try {
      await this.redis.del(lockKey);
      console.log(`[UNLOCK] Released lock for ${eventId}`);
    } catch (err) {
      console.error(`[ERROR] releaseLock ${eventId}:`, err.message);
    }
  }

  // getStats: list processed:* keys - small scale OK; for large scale use SCAN
  async getStats(instanceId){
    try {
      const keys = await this.redis.keys('processed:*');
      const total = keys.length;
      let processedByThis = 0;
      for (const key of keys) {
        const proc = await this.redis.get(key);
        if (proc === instanceId) processedByThis++;
      }
      return { totalProcessed: total, processedByThisInstance: processedByThis, processedByOthers: total - processedByThis };
    } catch (err) {
      console.error('[ERROR] getStats:', err.message);
      return null;
    }
  }
}

module.exports = new DeduplicationService();
