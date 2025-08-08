// 内存存储（开发用）
class MemoryStorage {
  constructor() {
    this.store = new Map();
  }
  
  set(key, value) {
    this.store.set(key, value);
  }
  
  get(key) {
    return this.store.get(key);
  }
  
  has(key) {
    return this.store.has(key);
  }
  
  delete(key) {
    return this.store.delete(key);
  }
}

// Redis 存储（生产用）
class RedisStorage {
  constructor() {
    const redis = require('redis');
    this.client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.client.connect();
  }
  
  async set(key, value) {
    await this.client.set(key, JSON.stringify(value));
  }
  
  async get(key) {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  async has(key) {
    return (await this.client.exists(key)) === 1;
  }
  
  async delete(key) {
    return (await this.client.del(key)) > 0;
  }
}

module.exports = {
  getStorage: () => {
    if (process.env.USE_REDIS === 'true') {
      return new RedisStorage();
    }
    return new MemoryStorage();
  }
};
