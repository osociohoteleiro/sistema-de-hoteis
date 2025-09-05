const db = require('../config/database');

async function createSiteBuilderTables() {
  try {
    console.log('🚀 Criando tabelas do Site Builder...');
    
    // Conectar ao banco
    await db.connect();
    
    // Tabela de templates
    console.log('📊 Criando tabela site_templates...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS site_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        preview_image TEXT,
        html_structure JSONB NOT NULL,
        css_styles JSONB NOT NULL,
        default_content JSONB NOT NULL,
        features JSONB DEFAULT '[]'::jsonb,
        is_premium BOOLEAN DEFAULT false,
        price DECIMAL(10,2) DEFAULT 0.00,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Tabela de sites
    console.log('📊 Criando tabela hotel_sites...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS hotel_sites (
        id SERIAL PRIMARY KEY,
        site_uuid UUID DEFAULT gen_random_uuid() UNIQUE,
        hotel_id INT REFERENCES hotels(id) ON DELETE CASCADE,
        template_id INT REFERENCES site_templates(id),
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(100) UNIQUE,
        custom_domain VARCHAR(255),
        description TEXT,
        content JSONB DEFAULT '{}'::jsonb,
        settings JSONB DEFAULT '{}'::jsonb,
        seo_title VARCHAR(255),
        seo_description TEXT,
        seo_keywords TEXT,
        seo_config JSONB DEFAULT '{}'::jsonb,
        analytics_config JSONB DEFAULT '{}'::jsonb,
        published BOOLEAN DEFAULT false,
        active BOOLEAN DEFAULT true,
        plan_type VARCHAR(50) DEFAULT 'free',
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Tabela de mídia
    console.log('📊 Criando tabela site_media...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS site_media (
        id SERIAL PRIMARY KEY,
        site_id INT REFERENCES hotel_sites(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size BIGINT NOT NULL,
        width INT,
        height INT,
        alt_text VARCHAR(255),
        caption TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        uploaded_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Tabela de páginas
    console.log('📊 Criando tabela site_pages...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS site_pages (
        id SERIAL PRIMARY KEY,
        site_id INT REFERENCES hotel_sites(id) ON DELETE CASCADE,
        slug VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content JSONB NOT NULL,
        meta_title VARCHAR(255),
        meta_description TEXT,
        is_active BOOLEAN DEFAULT true,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(site_id, slug)
      )
    `);
    
    // Tabela de formulários
    console.log('📊 Criando tabela site_form_submissions...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS site_form_submissions (
        id SERIAL PRIMARY KEY,
        site_id INT REFERENCES hotel_sites(id) ON DELETE CASCADE,
        form_type VARCHAR(50) NOT NULL,
        form_data JSONB NOT NULL,
        visitor_ip INET,
        user_agent TEXT,
        submitted_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'new',
        notes TEXT
      )
    `);
    
    console.log('🔍 Criando índices...');
    await db.query(`CREATE INDEX IF NOT EXISTS idx_hotel_sites_hotel_id ON hotel_sites(hotel_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_hotel_sites_subdomain ON hotel_sites(subdomain)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_hotel_sites_published ON hotel_sites(published)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_site_media_site_id ON site_media(site_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_site_pages_site_id ON site_pages(site_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_site_form_submissions_site_id ON site_form_submissions(site_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_site_templates_category ON site_templates(category)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_site_templates_active ON site_templates(is_active)`);
    
    console.log('📝 Inserindo templates padrão...');
    await db.query(`
      INSERT INTO site_templates (name, category, description, preview_image, html_structure, css_styles, default_content, features, is_premium, price) 
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10),
      ($11, $12, $13, $14, $15, $16, $17, $18, $19, $20),
      ($21, $22, $23, $24, $25, $26, $27, $28, $29, $30),
      ($31, $32, $33, $34, $35, $36, $37, $38, $39, $40)
    `, [
      // Template 1: Resort de Luxo
      'Resort de Luxo', 'luxury', 'Design elegante para resorts de alto padrão com cores douradas e layout sofisticado.',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
      JSON.stringify({"sections": ["hero", "about", "rooms", "amenities", "gallery", "contact"], "layout": "luxury"}),
      JSON.stringify({"primary_color": "#D4AF37", "secondary_color": "#1A1A1A", "font_family": "Playfair Display"}),
      JSON.stringify({"hero_title": "Bem-vindo ao Paraíso", "hero_subtitle": "Uma experiência única de luxo e conforto", "about_text": "Nosso resort oferece a mais requintada experiência em hospedagem de luxo."}),
      JSON.stringify(["Galeria Premium", "Reservas Online", "Concierge Digital", "Spa & Wellness"]),
      true, 199.90,
      
      // Template 2: Hotel Boutique
      'Hotel Boutique', 'boutique', 'Template exclusivo para hotéis boutique com design minimalista e elegante.',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop',
      JSON.stringify({"sections": ["hero", "story", "rooms", "experiences", "gallery", "contact"], "layout": "boutique"}),
      JSON.stringify({"primary_color": "#8B4513", "secondary_color": "#F5F5DC", "font_family": "Montserrat"}),
      JSON.stringify({"hero_title": "Hotel Boutique Exclusivo", "hero_subtitle": "Onde cada detalhe conta uma história", "story_text": "Um refúgio urbano que combina design contemporâneo com charme local."}),
      JSON.stringify(["Design Personalizado", "História Local", "Experiências Únicas", "Arte Local"]),
      false, 0.00,
      
      // Template 3: Hotel Executivo
      'Hotel Executivo', 'business', 'Perfeito para hotéis de negócios com foco em produtividade e conveniência.',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
      JSON.stringify({"sections": ["hero", "business", "rooms", "facilities", "meeting", "contact"], "layout": "business"}),
      JSON.stringify({"primary_color": "#2C3E50", "secondary_color": "#3498DB", "font_family": "Open Sans"}),
      JSON.stringify({"hero_title": "Hotel Executivo", "hero_subtitle": "Sua base para negócios de sucesso", "business_text": "Instalações modernas e serviços especializados para o executivo moderno."}),
      JSON.stringify(["Centro de Negócios", "Salas de Reunião", "Wi-Fi Premium", "Serviço Express"]),
      false, 0.00,
      
      // Template 4: Hotel de Praia
      'Hotel de Praia', 'beach', 'Ideal para hotéis à beira-mar com cores tropicais e atmosfera relaxante.',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=300&fit=crop',
      JSON.stringify({"sections": ["hero", "beach", "rooms", "activities", "restaurant", "contact"], "layout": "beach"}),
      JSON.stringify({"primary_color": "#20B2AA", "secondary_color": "#F4A460", "font_family": "Poppins"}),
      JSON.stringify({"hero_title": "Paraíso Tropical", "hero_subtitle": "Onde o mar encontra o conforto", "beach_text": "Desfrute de dias perfeitos em frente ao mar com todo conforto e comodidade."}),
      JSON.stringify(["Vista para o Mar", "Esportes Aquáticos", "Beach Club", "Piscina Infinita"]),
      false, 0.00
    ]);
    
    console.log('✅ Todas as tabelas do Site Builder criadas com sucesso!');
    
    // Verificar tabelas
    const tables = ['site_templates', 'hotel_sites', 'site_media', 'site_pages', 'site_form_submissions'];
    for (const table of tables) {
      const result = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`✓ Tabela ${table}: ${result[0].count} registros`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  } finally {
    await db.close();
  }
}

if (require.main === module) {
  createSiteBuilderTables()
    .then(() => {
      console.log('🎉 Tabelas do Site Builder criadas!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha ao criar tabelas:', error);
      process.exit(1);
    });
}

module.exports = createSiteBuilderTables;