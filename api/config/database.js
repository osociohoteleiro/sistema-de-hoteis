const mysql = require('mysql2/promise');
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
          connectionLimit: 10,
          queueLimit: 0,
          acquireTimeout: 60000,
          timeout: 60000,
          charset: 'utf8mb4',
          timezone: 'Z'
        };

        this.pool = mysql.createPool(config);
        
        // Teste de conexão
        const connection = await this.pool.getConnection();
        await connection.ping();
        connection.release();
        
        this.isConnected = true;
        this.currentHost = host;
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

  async query(sql, params = []) {
    if (!this.isConnected) {
      await this.connect();
    }
    
    if (this.usingFallback) {
      return await fallbackDatabase.query(sql, params);
    }
    
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('Erro na query:', error);
      throw error;
    }
  }

  async getConnection() {
    if (!this.isConnected) {
      await this.connect();
    }
    
    if (this.usingFallback) {
      return fallbackDatabase;
    }
    
    return await this.pool.getConnection();
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      console.log('🔒 Conexão com banco de dados fechada');
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      host: this.currentHost,
      database: this.usingFallback ? 'fallback-memory' : process.env.DB_NAME,
      usingFallback: this.usingFallback
    };
  }
}

// Singleton instance
const db = new DatabaseConnection();

module.exports = db;