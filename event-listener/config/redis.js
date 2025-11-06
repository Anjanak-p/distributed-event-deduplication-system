const redis = require('redis');

class RedisClient {
  constructor(){
    this.client = null;
    this.isConnected = false;
  }

  async connect(){
    if (this.client && this.isConnected) return this.client;

    this.client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) return new Error('Max reconnection attempts reached');
          return Math.min(retries * 100, 3000);
        }
      }
    });

    this.client.on('error', (err) => {
      console.error('Redis Error:', err.message);
      this.isConnected = false;
    });
    this.client.on('connect', () => console.log('🔌 Connecting to Redis...'));
    this.client.on('ready', () => { console.log('✓ Redis connected and ready'); this.isConnected = true; });
    this.client.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));

    await this.client.connect();
    return this.client;
  }

  getClient(){
    if (!this.client || !this.isConnected) throw new Error('Redis client not connected');
    return this.client;
  }

  async disconnect(){
    if (this.client) {
      await this.client.quit();
      console.log('Redis connection closed');
      this.isConnected = false;
    }
  }
}

module.exports = new RedisClient();
