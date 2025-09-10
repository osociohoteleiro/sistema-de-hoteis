// Script para corrigir todas as queries MySQL nos serviços para PostgreSQL
const fs = require('fs');
const path = require('path');

function fixServicesMySQL() {
    console.log('🔧 Corrigindo todas as queries MySQL nos serviços para PostgreSQL...');
    
    const servicesDir = path.join(__dirname, 'services');
    const files = fs.readdirSync(servicesDir).filter(file => file.endsWith('.js'));
    
    let totalReplacements = 0;
    
    files.forEach(file => {
        const filePath = path.join(servicesDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        let replacements = 0;
        
        // Função para converter ? para $1, $2, etc em cada query
        function replaceMySQLParams(match, beforeMatch, query, afterMatch) {
            let paramIndex = 1;
            const updatedQuery = query.replace(/\?/g, () => `$${paramIndex++}`);
            return beforeMatch + updatedQuery + afterMatch;
        }
        
        // Padrões para encontrar queries SQL com placeholders ?
        const sqlPatterns = [
            // db.query with template literals
            /(db\.query\(\s*`)([^`]+)(`[^)]*\))/g,
            // db.query with single quotes
            /(db\.query\(\s*')([^']+)('[^)]*\))/g,
            // db.query with double quotes  
            /(db\.query\(\s*")([^"]+)("[^)]*\))/g,
            // pool.query patterns
            /(pool\.query\(\s*`)([^`]+)(`[^)]*\))/g,
            /(pool\.query\(\s*')([^']+)('[^)]*\))/g,
            /(pool\.query\(\s*")([^"]+)("[^)]*\))/g,
            // connection.query patterns
            /(connection\.query\(\s*`)([^`]+)(`[^)]*\))/g,
            /(connection\.query\(\s*')([^']+)('[^)]*\))/g,
            /(connection\.query\(\s*")([^"]+)("[^)]*\))/g
        ];
        
        sqlPatterns.forEach(pattern => {
            const newContent = content.replace(pattern, replaceMySQLParams);
            if (newContent !== content) {
                const beforeMatches = (content.match(/\?/g) || []).length;
                const afterMatches = (newContent.match(/\?/g) || []).length;
                replacements += beforeMatches - afterMatches;
                content = newContent;
            }
        });
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ ${file}: ~${replacements} MySQL placeholders converted`);
            totalReplacements += replacements;
        } else {
            console.log(`⏭️ ${file}: no SQL queries found`);
        }
    });
    
    console.log(`🎉 Total: ~${totalReplacements} MySQL placeholders converted in services!`);
}

// Executar
fixServicesMySQL();