const db = require('../config/database');

async function monitorCacheStats() {
  try {
    console.log('📊 MONITORAMENTO DO CACHE DE CONTATOS\n');

    // Conectar ao banco
    await db.connect();

    // Estatísticas gerais
    const stats = await db.query(`
      SELECT
        COUNT(*) as total_contacts,
        COUNT(CASE WHEN contact_exists = true THEN 1 END) as existing_contacts,
        COUNT(CASE WHEN contact_exists = false THEN 1 END) as non_existing_contacts,
        COUNT(CASE WHEN last_updated > NOW() - INTERVAL '1 hour' THEN 1 END) as recent_contacts_1h,
        COUNT(CASE WHEN last_updated > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_contacts_24h,
        ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - last_updated)) / 3600)::numeric, 2) as avg_age_hours
      FROM contacts_cache
    `);

    if (stats.length > 0) {
      const s = stats[0];
      console.log('📈 ESTATÍSTICAS GERAIS:');
      console.log(`   Total de contatos em cache: ${s.total_contacts}`);
      console.log(`   Contatos existentes: ${s.existing_contacts}`);
      console.log(`   Contatos não existentes: ${s.non_existing_contacts}`);
      console.log(`   Contatos atualizados última hora: ${s.recent_contacts_1h}`);
      console.log(`   Contatos atualizados últimas 24h: ${s.recent_contacts_24h}`);
      console.log(`   Idade média do cache: ${s.avg_age_hours}h\n`);
    }

    // Top 10 instâncias com mais contatos
    const topInstances = await db.query(`
      SELECT
        instance_name,
        COUNT(*) as contact_count,
        COUNT(CASE WHEN contact_exists = true THEN 1 END) as existing_count
      FROM contacts_cache
      GROUP BY instance_name
      ORDER BY contact_count DESC
      LIMIT 10
    `);

    if (topInstances.length > 0) {
      console.log('🏆 TOP INSTÂNCIAS (por número de contatos):');
      topInstances.forEach((inst, index) => {
        console.log(`   ${index + 1}. ${inst.instance_name}: ${inst.contact_count} contatos (${inst.existing_count} existentes)`);
      });
      console.log('');
    }

    // Cache rate (% de hits vs misses baseado em timestamps)
    const cacheRate = await db.query(`
      SELECT
        COUNT(CASE WHEN last_updated > NOW() - INTERVAL '5 minutes' THEN 1 END) as very_recent,
        COUNT(CASE WHEN last_updated > NOW() - INTERVAL '1 hour' THEN 1 END) as recent,
        COUNT(*) as total
      FROM contacts_cache
    `);

    if (cacheRate.length > 0) {
      const cr = cacheRate[0];
      const hitRate = cr.total > 0 ? ((cr.recent / cr.total) * 100).toFixed(1) : 0;
      console.log('⚡ PERFORMANCE DO CACHE:');
      console.log(`   Contatos muito recentes (5min): ${cr.very_recent}`);
      console.log(`   Cache hit rate estimado (1h): ${hitRate}%`);
      console.log(`   Total de registros: ${cr.total}\n`);
    }

    // Contatos problemáticos ou suspeitos
    const problematic = await db.query(`
      SELECT
        phone_number,
        instance_name,
        contact_exists,
        last_updated
      FROM contacts_cache
      WHERE
        phone_number ~ '(\d)\\1{8,}' -- Muitos dígitos iguais
        OR LENGTH(phone_number) = 15 -- 15 dígitos suspeito
        OR phone_number LIKE '%555552772%' -- Padrão específico
      ORDER BY last_updated DESC
      LIMIT 10
    `);

    if (problematic.length > 0) {
      console.log('⚠️  CONTATOS PROBLEMÁTICOS DETECTADOS:');
      problematic.forEach((contact, index) => {
        console.log(`   ${index + 1}. ${contact.phone_number} (${contact.instance_name}) - Existe: ${contact.contact_exists} - ${contact.last_updated}`);
      });
      console.log('');
    }

    // Contatos mais antigos (que podem precisar de refresh)
    const oldest = await db.query(`
      SELECT
        phone_number,
        instance_name,
        contact_name,
        ROUND(EXTRACT(EPOCH FROM (NOW() - last_updated)) / 3600::numeric, 1) as age_hours
      FROM contacts_cache
      WHERE contact_exists = true
      ORDER BY last_updated ASC
      LIMIT 5
    `);

    if (oldest.length > 0) {
      console.log('⏰ CONTATOS MAIS ANTIGOS (podem precisar refresh):');
      oldest.forEach((contact, index) => {
        console.log(`   ${index + 1}. ${contact.phone_number} (${contact.contact_name || 'Sem nome'}) - ${contact.age_hours}h atrás`);
      });
      console.log('');
    }

    console.log('✅ Monitoramento concluído!');
    console.log('📝 Execute este script regularmente para acompanhar a eficiência do cache');

  } catch (error) {
    console.error('❌ Erro no monitoramento:', error);
  } finally {
    process.exit(0);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  monitorCacheStats();
}

module.exports = { monitorCacheStats };