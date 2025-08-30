const mysql = require('mysql2/promise');
require('dotenv').config();

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.currentHost = null;
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
    
    throw new Error('Não foi possível conectar a nenhum host do banco de dados');
  }

  async query(sql, params = []) {
    if (!this.pool || !this.isConnected) {
      await this.connect();
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
    if (!this.pool || !this.isConnected) {
      await this.connect();
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
      database: process.env.DB_NAME
    };
  }
}

// Singleton instance
const db = new DatabaseConnection();

module.exports = db;