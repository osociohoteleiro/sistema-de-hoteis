const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const { fallbackDatabase } = require('./fallback-data');
require('dotenv').config();

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.pgPool = null;
    this.isConnected = false;
    this.currentHost = null;
    this.usingFallback = false;
    this.dbMode = process.env.DB_MODE || 'mariadb'; // 'mariadb', 'postgres', 'hybrid'
  }

  async connect() {
    if (this.dbMode === 'postgres') {
      return await this.connectPostgreSQL();
    } else if (this.dbMode === 'hybrid') {
      // Tentar PostgreSQL primeiro, MariaDB como fallback
      try {
        return await this.connectPostgreSQL();
      } catch (error) {
        console.log('⚠️ PostgreSQL falhou, tentando MariaDB...');
        return await this.connectMariaDB();
      }
    } else {
      return await this.connectMariaDB();
    }
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
        min: 5,
        max: 50,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: process.env.PGSSLDISABLE === 'true' ? false : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false)
      };

      this.pgPool = new Pool(config);
      
      // Teste de conexão
      const client = await this.pgPool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnected = true;
      this.currentHost = `${config.host}:${config.port} (PostgreSQL)`;
      console.log('✅ Conectado ao PostgreSQL com sucesso!');
      
      return this.pgPool;
      
    } catch (error) {
      console.error('❌ Erro ao conectar PostgreSQL:', error.message);
      if (this.pgPool) {
        await this.pgPool.end();
        this.pgPool = null;
      }
      throw error;
    }
  }

  async connectMariaDB() {
    const hosts = [
      process.env.DB_HOST_EXTERNAL, // Tentar primeiro host externo
      process.env.DB_HOST_INTERNAL  // Fallback para host interno
    ].filter(Boolean);

    for (const host of hosts) {
      try {
        console.log(`🔄 Tentando conectar ao MariaDB em ${host}:${process.env.DB_PORT}...`);
        
        const config = {
          host: host,
          port: parseInt(process.env.DB_PORT) || 3306,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          waitForConnections: true,
          connectionLimit: 15,
          queueLimit: 0,
          acquireTimeout: 30000,
          timeout: 20000,
          idleTimeout: 300000,
          charset: 'utf8mb4',
          timezone: 'Z',
          keepAliveInitialDelay: 0,
          enableKeepAlive: true
        };

        this.pool = mysql.createPool(config);
        
        // Teste de conexão
        const connection = await this.pool.getConnection();
        await connection.ping();
        connection.release();
        
        this.isConnected = true;
        this.currentHost = `${host} (MariaDB)`;
        console.log(`✅ Conectado ao MariaDB com sucesso! Host: ${host}`);
        return this.pool;
        
      } catch (error) {
        console.log(`❌ Falha ao conectar em ${host}:`, error.message);
        if (this.pool) {
          await this.pool.end();
          this.pool = null;
        }
      }
    }
    
    // Se não conseguiu conectar a nenhum host, usar fallback
    console.log('⚠️ Não foi possível conectar ao banco real. Usando dados de fallback para desenvolvimento...');
    this.usingFallback = true;
    this.isConnected = true;
    this.currentHost = 'fallback-memory';
    return fallbackDatabase;
  }

  async query(sql, params = [], retryCount = 0) {
    if (!this.isConnected) {
      await this.connect();
    }
    
    if (this.usingFallback) {
      return await fallbackDatabase.query(sql, params);
    }

    // PostgreSQL
    if (this.pgPool) {
      try {
        // Converter placeholders ? para $1, $2, etc. para PostgreSQL
        const pgSql = this.convertToPostgreSQLQuery(sql);
        const result = await this.pgPool.query(pgSql, params);
        return result.rows;
      } catch (error) {
        console.error('Erro na query PostgreSQL:', error);
        throw error;
      }
    }

    // MariaDB/MySQL
    if (this.pool) {
      try {
        const [rows] = await this.pool.execute(sql, params);
        return rows;
      } catch (error) {
        console.error('Erro na query MariaDB:', error);
        
        // Retry logic para erros de conexão
        if ((error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') && retryCount < 2) {
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
    
    throw new Error('Nenhuma conexão de banco disponível');
  }

  // Converter query MySQL para PostgreSQL
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

    if (this.pgPool) {
      return await this.pgPool.connect();
    }
    
    if (this.pool) {
      return await this.pool.getConnection();
    }
    
    throw new Error('Nenhuma conexão disponível');
  }

  async close() {
    if (this.pgPool) {
      await this.pgPool.end();
      this.pgPool = null;
      console.log('🔒 Conexão PostgreSQL fechada');
    }
    
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('🔒 Conexão MariaDB fechada');
    }
    
    this.isConnected = false;
  }

  getStatus() {
    let database = 'N/A';
    if (this.usingFallback) {
      database = 'fallback-memory';
    } else if (this.pgPool) {
      database = process.env.POSTGRES_DB || 'osh_db';
    } else if (this.pool) {
      database = process.env.DB_NAME || 'osh-ia';
    }

    return {
      connected: this.isConnected,
      host: this.currentHost,
      database: database,
      mode: this.dbMode,
      usingFallback: this.usingFallback,
      postgresql: !!this.pgPool,
      mariadb: !!this.pool
    };
  }
}

// Singleton instance
const db = new DatabaseConnection();

module.exports = db;