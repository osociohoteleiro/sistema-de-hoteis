// Script de migração MySQL → PostgreSQL
// OSH Hotel System
require('dotenv').config();

const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const fs = require('fs');

class DatabaseMigrator {
  constructor() {
    // Configuração MySQL (fonte)
    this.mysqlConfig = {
      host: process.env.DB_HOST_EXTERNAL || 'ep.osociohoteleiro.com.br',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'mariadb',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'osh-ia',
      charset: 'utf8mb4'
    };

    // Configuração PostgreSQL (destino)
    this.pgConfig = {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT) || 5432,
      user: process.env.POSTGRES_USER || 'osh_user',
      password: process.env.POSTGRES_PASSWORD || 'osh_password_2024',
      database: process.env.POSTGRES_DB || 'osh_db',
      max: 20
    };

    this.mysqlConnection = null;
    this.pgPool = null;
    this.migrationLog = [];
  }

  async connect() {
    try {
      console.log('🔄 Conectando aos bancos de dados...');
      
      // Conectar MySQL
      this.mysqlConnection = await mysql.createConnection(this.mysqlConfig);
      console.log('✅ MySQL conectado');

      // Conectar PostgreSQL
      this.pgPool = new Pool(this.pgConfig);
      const pgClient = await this.pgPool.connect();
      await pgClient.query('SELECT NOW()');
      pgClient.release();
      console.log('✅ PostgreSQL conectado');

    } catch (error) {
      console.error('❌ Erro na conexão:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.mysqlConnection) {
      await this.mysqlConnection.end();
      console.log('🔒 MySQL desconectado');
    }
    
    if (this.pgPool) {
      await this.pgPool.end();
      console.log('🔒 PostgreSQL desconectado');
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, type, message };
    this.migrationLog.push(logEntry);
    
    const emoji = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${emoji} [${timestamp}] ${message}`);
  }

  async getTableData(tableName, orderBy = 'id') {
    try {
      const [rows] = await this.mysqlConnection.execute(
        `SELECT * FROM ${tableName} ORDER BY ${orderBy}`
      );
      return rows;
    } catch (error) {
      this.log(`Erro ao buscar dados de ${tableName}: ${error.message}`, 'error');
      return [];
    }
  }

  async migrateUsers() {
    this.log('Migrando tabela: users');
    
    const users = await this.getTableData('users');
    if (users.length === 0) {
      this.log('Nenhum usuário encontrado no MySQL', 'warning');
      return;
    }

    for (const user of users) {
      try {
        await this.pgPool.query(`
          INSERT INTO users (id, uuid, name, email, password_hash, user_type, active, email_verified, created_at, updated_at)
          VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          password_hash = EXCLUDED.password_hash,
          user_type = EXCLUDED.user_type,
          active = EXCLUDED.active,
          updated_at = EXCLUDED.updated_at
        `, [
          user.id,
          user.uuid || null,
          user.name,
          user.email,
          user.password_hash,
          user.user_type || 'HOTEL',
          user.active !== undefined ? user.active : true,
          user.email_verified || false,
          user.created_at,
          user.updated_at
        ]);
      } catch (error) {
        this.log(`Erro ao migrar usuário ${user.email}: ${error.message}`, 'error');
      }
    }

    // Ajustar sequence
    if (users.length > 0) {
      await this.pgPool.query(`SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users))`);
    }
    this.log(`✅ Migrados ${users.length} usuários`);
  }

  async migrateHotels() {
    this.log('Migrando tabela: hotels');
    
    const hotels = await this.getTableData('hotels');
    if (hotels.length === 0) {
      this.log('Nenhum hotel encontrado no MySQL', 'warning');
      return;
    }

    for (const hotel of hotels) {
      try {
        await this.pgPool.query(`
          INSERT INTO hotels (id, hotel_uuid, name, checkin_time, checkout_time, cover_image, 
                            description, address, phone, email, website, status, created_at, updated_at)
          VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (hotel_uuid) DO UPDATE SET
          name = EXCLUDED.name,
          checkin_time = EXCLUDED.checkin_time,
          checkout_time = EXCLUDED.checkout_time,
          cover_image = EXCLUDED.cover_image,
          description = EXCLUDED.description,
          address = EXCLUDED.address,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          website = EXCLUDED.website,
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
        `, [
          hotel.id,
          hotel.hotel_uuid,
          hotel.hotel_nome || 'Hotel sem nome',
          hotel.hora_checkin || '14:00:00',
          hotel.hora_checkout || '12:00:00',
          hotel.hotel_capa,
          null, // description não existe no MySQL
          `${hotel.city || ''}, ${hotel.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '') || null, // address baseado em city/state
          null, // phone não existe
          null, // email não existe
          null, // website não existe
          'ACTIVE',
          hotel.hotel_criado_em,
          hotel.hotel_criado_em
        ]);
      } catch (error) {
        this.log(`Erro ao migrar hotel ${hotel.name}: ${error.message}`, 'error');
      }
    }

    await this.pgPool.query(`SELECT setval('hotels_id_seq', (SELECT MAX(id) FROM hotels))`);
    this.log(`✅ Migrados ${hotels.length} hotéis`);
  }

  async migrateUserHotels() {
    this.log('Migrando tabela: user_hotels');
    
    const userHotels = await this.getTableData('user_hotels');
    if (userHotels.length === 0) {
      this.log('Nenhum relacionamento user_hotel encontrado', 'warning');
      return;
    }

    for (const uh of userHotels) {
      try {
        await this.pgPool.query(`
          INSERT INTO user_hotels (id, user_id, hotel_id, role, permissions, active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (user_id, hotel_id) DO UPDATE SET
          role = EXCLUDED.role,
          permissions = EXCLUDED.permissions,
          active = EXCLUDED.active,
          updated_at = EXCLUDED.updated_at
        `, [
          uh.id,
          uh.user_id,
          uh.hotel_id,
          uh.role || 'STAFF',
          uh.permissions ? JSON.stringify(JSON.parse(uh.permissions)) : '{}',
          uh.active !== undefined ? uh.active : true,
          uh.created_at,
          uh.updated_at
        ]);
      } catch (error) {
        this.log(`Erro ao migrar user_hotel ${uh.id}: ${error.message}`, 'error');
      }
    }

    await this.pgPool.query(`SELECT setval('user_hotels_id_seq', (SELECT MAX(id) FROM user_hotels))`);
    this.log(`✅ Migrados ${userHotels.length} relacionamentos user-hotel`);
  }

  async migrateAppConfig() {
    this.log('Migrando tabela: app_config');
    
    const configs = await this.getTableData('app_config');
    
    for (const config of configs) {
      try {
        await this.pgPool.query(`
          INSERT INTO app_config (id, hotel_id, config_key, config_value, config_type, description, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (hotel_id, config_key) DO UPDATE SET
          config_value = EXCLUDED.config_value,
          config_type = EXCLUDED.config_type,
          description = EXCLUDED.description,
          updated_at = EXCLUDED.updated_at
        `, [
          config.id,
          config.hotel_id,
          config.config_key,
          config.config_value,
          config.config_type || 'STRING',
          config.description,
          config.created_at,
          config.updated_at
        ]);
      } catch (error) {
        this.log(`Erro ao migrar config ${config.config_key}: ${error.message}`, 'error');
      }
    }

    if (configs.length > 0) {
      await this.pgPool.query(`SELECT setval('app_config_id_seq', (SELECT MAX(id) FROM app_config))`);
    }
    this.log(`✅ Migradas ${configs.length} configurações`);
  }

  async migrateWorkspaces() {
    this.log('Migrando tabela: workspaces');
    
    const workspaces = await this.getTableData('workspaces');
    
    for (const workspace of workspaces) {
      try {
        await this.pgPool.query(`
          INSERT INTO workspaces (id, uuid, hotel_id, hotel_uuid, name, description, settings, active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (uuid) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          settings = EXCLUDED.settings,
          active = EXCLUDED.active,
          updated_at = EXCLUDED.updated_at
        `, [
          workspace.id,
          workspace.uuid,
          workspace.hotel_id,
          workspace.hotel_uuid,
          workspace.name,
          workspace.description,
          workspace.settings ? JSON.stringify(JSON.parse(workspace.settings)) : '{}',
          workspace.active !== undefined ? workspace.active : true,
          workspace.created_at,
          workspace.updated_at
        ]);
      } catch (error) {
        this.log(`Erro ao migrar workspace ${workspace.name}: ${error.message}`, 'error');
      }
    }

    if (workspaces.length > 0) {
      await this.pgPool.query(`SELECT setval('workspaces_id_seq', (SELECT MAX(id) FROM workspaces))`);
    }
    this.log(`✅ Migrados ${workspaces.length} workspaces`);
  }

  async migrateBotFields() {
    this.log('Migrando tabela: bot_fields');
    
    const botFields = await this.getTableData('bot_fields');
    
    for (const field of botFields) {
      try {
        await this.pgPool.query(`
          INSERT INTO bot_fields (id, hotel_id, field_key, field_value, field_type, category, description, active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (hotel_id, field_key) DO UPDATE SET
          field_value = EXCLUDED.field_value,
          field_type = EXCLUDED.field_type,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          active = EXCLUDED.active,
          updated_at = EXCLUDED.updated_at
        `, [
          field.id,
          field.hotel_id,
          field.field_key,
          field.field_value,
          field.field_type || 'STRING',
          field.category,
          field.description,
          field.active !== undefined ? field.active : true,
          field.created_at,
          field.updated_at
        ]);
      } catch (error) {
        this.log(`Erro ao migrar bot_field ${field.field_key}: ${error.message}`, 'error');
      }
    }

    if (botFields.length > 0) {
      await this.pgPool.query(`SELECT setval('bot_fields_id_seq', (SELECT MAX(id) FROM bot_fields))`);
    }
    this.log(`✅ Migrados ${botFields.length} bot fields`);
  }

  async migrateRateShopperData() {
    this.log('Migrando tabelas do Rate Shopper');
    
    // Migrar propriedades
    const properties = await this.getTableData('rate_shopper_properties');
    for (const prop of properties) {
      try {
        await this.pgPool.query(`
          INSERT INTO rate_shopper_properties (id, hotel_id, property_name, location, website, config, active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
          property_name = EXCLUDED.property_name,
          location = EXCLUDED.location,
          website = EXCLUDED.website,
          config = EXCLUDED.config,
          active = EXCLUDED.active,
          updated_at = EXCLUDED.updated_at
        `, [
          prop.id,
          prop.hotel_id,
          prop.property_name,
          prop.location,
          prop.website,
          prop.config ? JSON.stringify(JSON.parse(prop.config)) : '{}',
          prop.active !== undefined ? prop.active : true,
          prop.created_at,
          prop.updated_at
        ]);
      } catch (error) {
        this.log(`Erro ao migrar propriedade ${prop.property_name}: ${error.message}`, 'error');
      }
    }

    // Migrar pesquisas
    const searches = await this.getTableData('rate_shopper_searches');
    for (const search of searches) {
      try {
        await this.pgPool.query(`
          INSERT INTO rate_shopper_searches (id, property_id, search_date, checkin_date, checkout_date, 
                                           rooms, guests, results, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
          results = EXCLUDED.results,
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
        `, [
          search.id,
          search.property_id,
          search.search_date,
          search.checkin_date,
          search.checkout_date,
          search.rooms || 1,
          search.guests || 2,
          search.results ? JSON.stringify(JSON.parse(search.results)) : '{}',
          search.status || 'PENDING',
          search.created_at,
          search.updated_at
        ]);
      } catch (error) {
        this.log(`Erro ao migrar pesquisa ${search.id}: ${error.message}`, 'error');
      }
    }

    if (properties.length > 0) {
      await this.pgPool.query(`SELECT setval('rate_shopper_properties_id_seq', (SELECT MAX(id) FROM rate_shopper_properties))`);
    }
    if (searches.length > 0) {
      await this.pgPool.query(`SELECT setval('rate_shopper_searches_id_seq', (SELECT MAX(id) FROM rate_shopper_searches))`);
    }

    this.log(`✅ Migrados ${properties.length} propriedades e ${searches.length} pesquisas do Rate Shopper`);
  }

  async validateMigration() {
    this.log('Validando migração...');
    
    const validations = [
      { table: 'users', pgQuery: 'SELECT COUNT(*) FROM users' },
      { table: 'hotels', pgQuery: 'SELECT COUNT(*) FROM hotels' },
      { table: 'user_hotels', pgQuery: 'SELECT COUNT(*) FROM user_hotels' },
      { table: 'workspaces', pgQuery: 'SELECT COUNT(*) FROM workspaces' }
    ];

    for (const validation of validations) {
      try {
        const [mysqlResult] = await this.mysqlConnection.execute(`SELECT COUNT(*) as count FROM ${validation.table}`);
        const pgResult = await this.pgPool.query(validation.pgQuery);
        
        const mysqlCount = mysqlResult[0].count;
        const pgCount = parseInt(pgResult.rows[0].count);
        
        if (mysqlCount === pgCount) {
          this.log(`✅ ${validation.table}: ${mysqlCount} = ${pgCount}`);
        } else {
          this.log(`⚠️ ${validation.table}: MySQL(${mysqlCount}) ≠ PostgreSQL(${pgCount})`, 'warning');
        }
      } catch (error) {
        this.log(`❌ Erro na validação de ${validation.table}: ${error.message}`, 'error');
      }
    }
  }

  async saveMigrationLog() {
    const logFile = `migration-log-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(logFile, JSON.stringify(this.migrationLog, null, 2));
    this.log(`Log salvo em: ${logFile}`);
  }

  async migrate() {
    const startTime = Date.now();
    
    try {
      this.log('🚀 Iniciando migração MySQL → PostgreSQL');
      
      await this.connect();
      
      // Executar migrações em ordem
      await this.migrateUsers();
      await this.migrateHotels();
      await this.migrateUserHotels();
      await this.migrateAppConfig();
      await this.migrateWorkspaces();
      await this.migrateBotFields();
      await this.migrateRateShopperData();
      
      // Validar migração
      await this.validateMigration();
      
      const duration = (Date.now() - startTime) / 1000;
      this.log(`🎉 Migração concluída em ${duration}s`);
      
    } catch (error) {
      this.log(`💥 Erro na migração: ${error.message}`, 'error');
      throw error;
    } finally {
      await this.saveMigrationLog();
      await this.disconnect();
    }
  }
}

// Executar migração
if (require.main === module) {
  const migrator = new DatabaseMigrator();
  migrator.migrate().catch(console.error);
}

module.exports = DatabaseMigrator;