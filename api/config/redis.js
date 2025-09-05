const redis = require('redis');
require('dotenv').config();

class RedisConnection {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const config = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        // password: process.env.REDIS_PASSWORD,
        db: 0,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('Redis server recusou conexão');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Tempo limite de retry excedido');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      };

      console.log(`🔄 Conectando ao Redis em ${config.host}:${config.port}...`);
      
      this.client = redis.createClient(config);
      
      this.client.on('error', (err) => {
        console.error('❌ Erro Redis:', err);
        this.isConnected = false;
      });
      
      this.client.on('connect', () => {
        console.log('🔗 Conectado ao Redis');
        this.isConnected = true;
      });
      
      this.client.on('ready', () => {
        console.log('✅ Redis pronto para uso');
      });
      
      this.client.on('end', () => {
        console.log('🔌 Conexão Redis encerrada');
        this.isConnected = false;
      });
      
      await this.client.connect();
      return this.client;
      
    } catch (error) {
      console.error('❌ Erro ao conectar Redis:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  async get(key) {
    if (!this.isConnected) {
      await this.connect();
    }
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('❌ Erro ao buscar no Redis:', error);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    if (!this.isConnected) {
      await this.connect();
    }
    
    try {
      const serialized = JSON.stringify(value);
      
      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar no Redis:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) {
      await this.connect();
    }
    
    try {
      return await this.client.del(key);
    } catch (error) {
      console.error('❌ Erro ao deletar do Redis:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) {
      await this.connect();
    }
    
    try {
      return await this.client.exists(key);
    } catch (error) {
      console.error('❌ Erro ao verificar existência no Redis:', error);
      return false;
    }
  }

  async flushdb() {
    if (!this.isConnected) {
      await this.connect();
    }
    
    try {
      return await this.client.flushDb();
    } catch (error) {
      console.error('❌ Erro ao limpar Redis:', error);
      return false;
    }
  }

  async keys(pattern = '*') {
    if (!this.isConnected) {
      await this.connect();
    }
    
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error('❌ Erro ao buscar chaves no Redis:', error);
      return [];
    }
  }

  async ttl(key) {
    if (!this.isConnected) {
      await this.connect();
    }
    
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error('❌ Erro ao verificar TTL no Redis:', error);
      return -1;
    }
  }

  async close() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      console.log('🔒 Conexão Redis fechada');
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    };
  }
}

// Singleton instance
const redisDb = new RedisConnection();

module.exports = redisDb;