const { Pool } = require('pg');
require('dotenv').config();

class PostgreSQLConnection {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const config = {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT) || 5432,
        user: process.env.POSTGRES_USER || 'osh_user',
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB || 'osh_db',
        
        // Pool configuration
        min: parseInt(process.env.PG_POOL_MIN) || 5,
        max: parseInt(process.env.PG_POOL_MAX) || 50,
        idleTimeoutMillis: parseInt(process.env.PG_POOL_IDLE_TIMEOUT) || 30000,
        connectionTimeoutMillis: parseInt(process.env.PG_POOL_CONNECTION_TIMEOUT) || 10000,
        
        // SSL configuration
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        
        // Query timeout
        query_timeout: 20000,
        statement_timeout: 30000,
      };

      console.log(`🔄 Conectando ao PostgreSQL em ${config.host}:${config.port}...`);
      
      this.pool = new Pool(config);
      
      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnected = true;
      console.log(`✅ Conectado ao PostgreSQL com sucesso!`);
      
      // Handle pool events
      this.pool.on('error', (err) => {
        console.error('❌ Erro no pool PostgreSQL:', err);
        this.isConnected = false;
      });
      
      this.pool.on('connect', () => {
        console.log('🔗 Nova conexão PostgreSQL estabelecida');
      });
      
      this.pool.on('remove', () => {
        console.log('🔌 Conexão PostgreSQL removida do pool');
      });
      
      return this.pool;
      
    } catch (error) {
      console.error('❌ Erro ao conectar PostgreSQL:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  async query(text, params = []) {
    if (!this.isConnected) {
      await this.connect();
    }
    
    try {
      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development' && duration > 100) {
        console.log(`🐌 Query lenta (${duration}ms):`, text.substring(0, 100));
      }
      
      return result.rows;
    } catch (error) {
      console.error('❌ Erro na query PostgreSQL:', error.message);
      console.error('Query:', text);
      throw error;
    }
  }

  async transaction(callback) {
    if (!this.isConnected) {
      await this.connect();
    }
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getConnection() {
    if (!this.isConnected) {
      await this.connect();
    }
    return await this.pool.connect();
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      console.log('🔒 Pool PostgreSQL fechado');
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DB || 'osh_db',
      totalCount: this.pool ? this.pool.totalCount : 0,
      idleCount: this.pool ? this.pool.idleCount : 0,
      waitingCount: this.pool ? this.pool.waitingCount : 0
    };
  }
}

// Singleton instance
const pgDb = new PostgreSQLConnection();

module.exports = pgDb;