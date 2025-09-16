const { Pool } = require('pg');
const { fallbackDatabase } = require('./fallback-data');
require('dotenv').config();

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.currentHost = null;
    this.usingFallback = false;
  }

  async connect() {
    return await this.connectPostgreSQL();
  }

  async connectPostgreSQL() {
    try {
      console.log('🔄 Conectando ao PostgreSQL...');

      const config = {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT) || 5432,
        user: process.env.POSTGRES_USER || 'osh_user',
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB || 'osh_db',
        min: parseInt(process.env.PG_POOL_MIN) || 5,
        max: parseInt(process.env.PG_POOL_MAX) || 50,
        idleTimeoutMillis: parseInt(process.env.PG_POOL_IDLE_TIMEOUT) || 30000,
        connectionTimeoutMillis: parseInt(process.env.PG_POOL_CONNECTION_TIMEOUT) || 10000,
        ssl: process.env.PGSSLDISABLE === 'true' ? false : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false)
      };

      this.pool = new Pool(config);

      // Teste de conexão
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      this.currentHost = `${config.host}:${config.port} (PostgreSQL)`;
      console.log('✅ Conectado ao PostgreSQL com sucesso!');

      return this.pool;

    } catch (error) {
      console.error('❌ Erro ao conectar PostgreSQL:', error.message);

      // Fallback para dados mockados apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Não foi possível conectar ao PostgreSQL. Usando dados de fallback para desenvolvimento...');
        this.usingFallback = true;
        this.isConnected = true;
        this.currentHost = 'fallback-memory';
        return fallbackDatabase;
      }

      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }
      throw error;
    }
  }

  async query(sql, params = [], retryCount = 0) {
    if (!this.isConnected) {
      await this.connect();
    }

    if (this.usingFallback) {
      return await fallbackDatabase.query(sql, params);
    }

    if (this.pool) {
      try {
        // Converter placeholders ? para $1, $2, etc. para PostgreSQL se necessário
        const pgSql = this.convertToPostgreSQLQuery(sql);
        const result = await this.pool.query(pgSql, params);

        // Manter compatibilidade com código legado
        const rows = result.rows || [];
        if (rows && typeof rows === 'object') {
          rows.rowCount = result.rowCount;
          rows.command = result.command;
          rows.fields = result.fields;
        }
        return rows;
      } catch (error) {
        console.error('Erro na query PostgreSQL:', error);

        // Retry logic para erros de conexão
        if ((error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') && retryCount < 2) {
          console.log(`🔄 Tentando reconectar... (tentativa ${retryCount + 1}/3)`);

          // Reset connection
          if (this.pool) {
            try { await this.pool.end(); } catch (e) {}
            this.pool = null;
            this.isConnected = false;
          }

          // Aguardar um pouco antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));

          // Tentar novamente
          return await this.query(sql, params, retryCount + 1);
        }

        throw error;
      }
    }

    throw new Error('Nenhuma conexão PostgreSQL disponível');
  }

  // Converter query MySQL para PostgreSQL se necessário
  convertToPostgreSQLQuery(sql) {
    let pgSql = sql;
    let paramIndex = 1;

    // Converter placeholders ? para $1, $2, etc.
    pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

    // Converter NOW() para NOW()
    pgSql = pgSql.replace(/NOW\(\)/gi, 'NOW()');

    // Converter LIMIT sem OFFSET
    pgSql = pgSql.replace(/LIMIT\s+(\d+)$/i, 'LIMIT $1');

    return pgSql;
  }

  async getConnection() {
    if (!this.isConnected) {
      await this.connect();
    }

    if (this.usingFallback) {
      return fallbackDatabase;
    }

    if (this.pool) {
      return await this.pool.connect();
    }

    throw new Error('Nenhuma conexão PostgreSQL disponível');
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('🔒 Conexão PostgreSQL fechada');
    }

    this.isConnected = false;
  }

  getStatus() {
    const database = this.usingFallback
      ? 'fallback-memory'
      : (process.env.POSTGRES_DB || 'osh_db');

    return {
      connected: this.isConnected,
      host: this.currentHost,
      database: database,
      mode: 'postgresql',
      usingFallback: this.usingFallback,
      postgresql: !!this.pool
    };
  }
}

// Singleton instance
const db = new DatabaseConnection();

module.exports = db;