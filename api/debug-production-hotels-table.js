// Script para debugar estrutura da tabela hotels em produção
const db = require('./config/database');

async function debugHotelsTable() {
    try {
        console.log('🔍 DEBUGGING: Verificando estrutura da tabela hotels...');
        
        // 1. Verificar estrutura da tabela hotels
        const structure = await db.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'hotels' 
            ORDER BY ordinal_position
        `);
        
        console.log('📊 Estrutura da tabela hotels:');
        console.table(structure);
        
        // 2. Verificar dados existentes
        try {
            const count = await db.query('SELECT COUNT(*) as total FROM hotels');
            console.log(`📈 Total de hotéis: ${count[0].total}`);
            
            if (count[0].total > 0) {
                const sample = await db.query('SELECT * FROM hotels LIMIT 1');
                console.log('📝 Exemplo de dados:');
                console.table(sample);
            }
        } catch (error) {
            console.log('❌ Erro ao consultar dados:', error.message);
        }
        
        // 3. Verificar estrutura da tabela user_hotels
        const uhStructure = await db.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'user_hotels' 
            ORDER BY ordinal_position
        `);
        
        console.log('📊 Estrutura da tabela user_hotels:');
        console.table(uhStructure);
        
        console.log('🎉 DEBUG CONCLUÍDO!');
        
    } catch (error) {
        console.error('❌ ERRO NO DEBUG:', error);
        console.error('Details:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

// Executar
debugHotelsTable();