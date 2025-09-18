const redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.initMemoryCache(); // Inicializar cache em memória sempre
    this.init();
  }

  async init() {
    try {
      // Tentar conectar ao Redis se estiver disponível
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        enableOfflineQueue: false
      });

      this.client.on('connect', () => {
        console.log('✅ Redis Cache conectado com sucesso');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.warn('⚠️ Redis não disponível, usando cache em memória:', err.message);
        this.isConnected = false;
        this.client = null;
        this.initMemoryCache();
      });

      await this.client.connect();
    } catch (error) {
      console.warn('⚠️ Redis não disponível, usando cache em memória:', error.message);
      this.isConnected = false;
      this.client = null;
      this.initMemoryCache();
    }
  }

  initMemoryCache() {
    // Fallback para cache em memória quando Redis não está disponível
    this.memoryCache = new Map();
    this.memoryTTL = new Map();

    // Limpar cache expirado a cada 5 minutos
    setInterval(() => {
      const now = Date.now();
      for (const [key, expiry] of this.memoryTTL.entries()) {
        if (now > expiry) {
          this.memoryCache.delete(key);
          this.memoryTTL.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  async get(key) {
    try {
      if (this.isConnected && this.client) {
        const result = await this.client.get(key);
        return result ? JSON.parse(result) : null;
      } else {
        // Usar cache em memória
        if (this.memoryCache && this.memoryCache.has(key)) {
          const expiry = this.memoryTTL.get(key);
          if (Date.now() < expiry) {
            return this.memoryCache.get(key);
          } else {
            this.memoryCache.delete(key);
            this.memoryTTL.delete(key);
          }
        }
        return null;
      }
    } catch (error) {
      console.warn('Cache get error:', error.message);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    try {
      if (this.isConnected && this.client) {
        await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      } else {
        // Usar cache em memória
        if (this.memoryCache) {
          this.memoryCache.set(key, value);
          this.memoryTTL.set(key, Date.now() + (ttlSeconds * 1000));
        }
      }
    } catch (error) {
      console.warn('Cache set error:', error.message);
    }
  }

  async del(key) {
    try {
      if (this.isConnected && this.client) {
        await this.client.del(key);
      } else {
        // Usar cache em memória
        if (this.memoryCache) {
          this.memoryCache.delete(key);
          this.memoryTTL.delete(key);
        }
      }
    } catch (error) {
      console.warn('Cache del error:', error.message);
    }
  }

  async delPattern(pattern) {
    try {
      if (this.isConnected && this.client) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } else {
        // Usar cache em memória
        if (this.memoryCache) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          for (const key of this.memoryCache.keys()) {
            if (regex.test(key)) {
              this.memoryCache.delete(key);
              this.memoryTTL.delete(key);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Cache delPattern error:', error.message);
    }
  }

  // Métodos específicos para relacionamentos
  async getUserHotels(userId) {
    return await this.get(`user:${userId}:hotels`);
  }

  async setUserHotels(userId, hotels, ttl = 300) {
    await this.set(`user:${userId}:hotels`, hotels, ttl);
  }

  async getHotelWorkspaces(hotelId) {
    return await this.get(`hotel:${hotelId}:workspaces`);
  }

  async setHotelWorkspaces(hotelId, workspaces, ttl = 300) {
    await this.set(`hotel:${hotelId}:workspaces`, workspaces, ttl);
  }

  async getWorkspaceBots(workspaceId) {
    return await this.get(`workspace:${workspaceId}:bots`);
  }

  async setWorkspaceBots(workspaceId, bots, ttl = 300) {
    await this.set(`workspace:${workspaceId}:bots`, bots, ttl);
  }

  async getWorkspaceInstances(workspaceUuid) {
    return await this.get(`workspace:${workspaceUuid}:instances`);
  }

  async setWorkspaceInstances(workspaceUuid, instances, ttl = 300) {
    await this.set(`workspace:${workspaceUuid}:instances`, instances, ttl);
  }

  // Invalidar cache relacionado
  async invalidateUserCache(userId) {
    await this.delPattern(`user:${userId}:*`);
  }

  async invalidateHotelCache(hotelId) {
    await this.delPattern(`hotel:${hotelId}:*`);
  }

  async invalidateWorkspaceCache(workspaceId, workspaceUuid = null) {
    await this.delPattern(`workspace:${workspaceId}:*`);
    if (workspaceUuid) {
      await this.delPattern(`workspace:${workspaceUuid}:*`);
    }
  }

  // Stats do cache
  getStats() {
    if (this.isConnected) {
      return { type: 'redis', connected: true };
    } else {
      return {
        type: 'memory',
        connected: false,
        keys: this.memoryCache ? this.memoryCache.size : 0
      };
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService;