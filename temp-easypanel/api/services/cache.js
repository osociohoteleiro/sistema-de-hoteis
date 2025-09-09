const redisDb = require('../config/redis');

class CacheService {
  constructor() {
    this.defaultTTL = parseInt(process.env.CACHE_TTL_DEFAULT) || 3600; // 1 hora
    this.userTTL = parseInt(process.env.CACHE_TTL_USER) || 1800;      // 30 min
    this.hotelTTL = parseInt(process.env.CACHE_TTL_HOTEL) || 7200;    // 2 horas
  }

  // Gerar chave de cache padronizada
  generateKey(type, id, suffix = '') {
    return `osh:${type}:${id}${suffix ? ':' + suffix : ''}`;
  }

  // Cache genérico
  async get(key) {
    try {
      return await redisDb.get(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    try {
      return await redisDb.set(key, value, ttl || this.defaultTTL);
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      return await redisDb.del(key);
    } catch (error) {
      console.error('Cache del error:', error);
      return false;
    }
  }

  // Cache para usuários
  async getUser(userId) {
    const key = this.generateKey('user', userId);
    return await this.get(key);
  }

  async setUser(userId, userData) {
    const key = this.generateKey('user', userId);
    return await this.set(key, userData, this.userTTL);
  }

  async delUser(userId) {
    const key = this.generateKey('user', userId);
    return await this.del(key);
  }

  // Cache para hotéis
  async getHotel(hotelId) {
    const key = this.generateKey('hotel', hotelId);
    return await this.get(key);
  }

  async setHotel(hotelId, hotelData) {
    const key = this.generateKey('hotel', hotelId);
    return await this.set(key, hotelData, this.hotelTTL);
  }

  async delHotel(hotelId) {
    const key = this.generateKey('hotel', hotelId);
    return await this.del(key);
  }

  // Cache para configurações
  async getConfig(configKey) {
    const key = this.generateKey('config', configKey);
    return await this.get(key);
  }

  async setConfig(configKey, configData) {
    const key = this.generateKey('config', configKey);
    return await this.set(key, configData, this.defaultTTL);
  }

  async delConfig(configKey) {
    const key = this.generateKey('config', configKey);
    return await this.del(key);
  }

  // Cache para rate shopper
  async getRateShopperSearch(searchId) {
    const key = this.generateKey('rate_shopper', searchId);
    return await this.get(key);
  }

  async setRateShopperSearch(searchId, searchData, ttl = 1800) {
    const key = this.generateKey('rate_shopper', searchId);
    return await this.set(key, searchData, ttl);
  }

  // Cache para sessões
  async getSession(sessionId) {
    const key = this.generateKey('session', sessionId);
    return await this.get(key);
  }

  async setSession(sessionId, sessionData, ttl = 86400) { // 24 horas
    const key = this.generateKey('session', sessionId);
    return await this.set(key, sessionData, ttl);
  }

  async delSession(sessionId) {
    const key = this.generateKey('session', sessionId);
    return await this.del(key);
  }

  // Invalidar cache por padrão
  async invalidatePattern(pattern) {
    try {
      const keys = await redisDb.keys(pattern);
      if (keys.length > 0) {
        const promises = keys.map(key => this.del(key));
        await Promise.all(promises);
        console.log(`🗑️ Invalidados ${keys.length} itens de cache`);
      }
      return keys.length;
    } catch (error) {
      console.error('Cache invalidate error:', error);
      return 0;
    }
  }

  // Invalidar cache de usuário e relacionados
  async invalidateUser(userId) {
    const patterns = [
      `osh:user:${userId}*`,
      `osh:session:*${userId}*`
    ];
    
    let total = 0;
    for (const pattern of patterns) {
      total += await this.invalidatePattern(pattern);
    }
    return total;
  }

  // Invalidar cache de hotel e relacionados
  async invalidateHotel(hotelId) {
    const patterns = [
      `osh:hotel:${hotelId}*`,
      `osh:config:*${hotelId}*`
    ];
    
    let total = 0;
    for (const pattern of patterns) {
      total += await this.invalidatePattern(pattern);
    }
    return total;
  }

  // Estatísticas do cache
  async getStats() {
    try {
      const keys = await redisDb.keys('osh:*');
      const stats = {
        totalKeys: keys.length,
        users: 0,
        hotels: 0,
        configs: 0,
        sessions: 0,
        rateShoppers: 0,
        others: 0
      };

      keys.forEach(key => {
        if (key.includes(':user:')) stats.users++;
        else if (key.includes(':hotel:')) stats.hotels++;
        else if (key.includes(':config:')) stats.configs++;
        else if (key.includes(':session:')) stats.sessions++;
        else if (key.includes(':rate_shopper:')) stats.rateShoppers++;
        else stats.others++;
      });

      return stats;
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  // Limpar todo o cache
  async flush() {
    try {
      return await redisDb.flushdb();
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  // Middleware para cache automático em rotas
  cacheMiddleware(ttl = null) {
    return async (req, res, next) => {
      // Gerar chave baseada na rota e parâmetros
      const cacheKey = this.generateKey('route', 
        Buffer.from(req.originalUrl).toString('base64')
      );
      
      try {
        const cached = await this.get(cacheKey);
        if (cached) {
          console.log(`🚀 Cache hit: ${req.originalUrl}`);
          return res.json(cached);
        }
        
        // Interceptar res.json para cachear a resposta
        const originalJson = res.json;
        res.json = function(data) {
          // Só cachear responses de sucesso
          if (res.statusCode === 200) {
            cacheService.set(cacheKey, data, ttl).catch(err => 
              console.error('Cache set error:', err)
            );
          }
          return originalJson.call(this, data);
        };
        
        next();
      } catch (error) {
        console.error('Cache middleware error:', error);
        next();
      }
    };
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService;