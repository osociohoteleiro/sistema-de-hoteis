// Script para corrigir todas as queries MySQL para PostgreSQL
const fs = require('fs');
const path = require('path');

function fixMySQLtoPostgreSQL() {
    console.log('🔧 Corrigindo todas as queries MySQL para PostgreSQL...');
    
    const modelsDir = path.join(__dirname, 'models');
    const files = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));
    
    let totalReplacements = 0;
    
    files.forEach(file => {
        const filePath = path.join(modelsDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let replacements = 0;
        
        // Função para converter ? para $1, $2, etc.
        function replaceMySQLParams(match, beforeMatch, query, afterMatch) {
            let paramIndex = 1;
            const updatedQuery = query.replace(/\?/g, () => `$${paramIndex++}`);
            return beforeMatch + updatedQuery + afterMatch;
        }
        
        // Padrão para encontrar queries SQL com placeholders ?
        const sqlPatterns = [
            // db.query with multiline strings
            /(db\.query\(\s*`)([^`]+)(`[^)]*\))/g,
            // db.query with single quotes
            /(db\.query\(\s*')([^']+)('[^)]*\))/g,
            // db.query with double quotes
            /(db\.query\(\s*")([^"]+)("[^)]*\))/g
        ];
        
        sqlPatterns.forEach(pattern => {
            const newContent = content.replace(pattern, replaceMySQLParams);
            if (newContent !== content) {
                const matches = content.match(pattern);
                replacements += matches ? matches.length : 0;
                content = newContent;
            }
        });
        
        if (replacements > 0) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ ${file}: ${replacements} replacements`);
            totalReplacements += replacements;
        } else {
            console.log(`⏭️ ${file}: no changes needed`);
        }
    });
    
    console.log(`🎉 Total: ${totalReplacements} MySQL queries converted to PostgreSQL!`);
}

// Executar
fixMySQLtoPostgreSQL();