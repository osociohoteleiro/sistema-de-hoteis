const db = require('../config/database');

async function createCacheTable() {
  try {
    console.log('🔄 Criando tabela contacts_cache...');

    // Conectar ao banco
    await db.connect();

    // Criar tabela
    await db.query(`
      CREATE TABLE IF NOT EXISTS contacts_cache (
          id SERIAL PRIMARY KEY,
          phone_number VARCHAR(20) NOT NULL,
          instance_name VARCHAR(100) NOT NULL,
          contact_name VARCHAR(255),
          profile_picture_url TEXT,
          contact_exists BOOLEAN DEFAULT true,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(phone_number, instance_name)
      );
    `);

    // Criar índices
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_cache_phone ON contacts_cache(phone_number);
      CREATE INDEX IF NOT EXISTS idx_contacts_cache_instance ON contacts_cache(instance_name);
      CREATE INDEX IF NOT EXISTS idx_contacts_cache_updated ON contacts_cache(last_updated);
    `);

    // Verificar se a tabela foi criada
    const tables = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'contacts_cache'
    `);

    if (tables.length > 0) {
      console.log('✅ Tabela contacts_cache criada com sucesso!');

      // Inserir um registro de teste
      await db.query(`
        INSERT INTO contacts_cache (phone_number, instance_name, contact_name, contact_exists)
        VALUES ('5511999999999', 'test_instance', 'Contato Teste', true)
        ON CONFLICT (phone_number, instance_name) DO NOTHING
      `);

      console.log('✅ Registro de teste inserido!');
    } else {
      console.log('❌ Tabela contacts_cache NÃO foi criada');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
    process.exit(1);
  }
}

createCacheTable();