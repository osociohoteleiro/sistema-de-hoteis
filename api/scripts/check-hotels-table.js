const db = require('../config/database');

(async () => { 
  try { 
    await db.connect(); 
    const result = await db.query('SHOW COLUMNS FROM hotels'); 
    console.log('Todos os campos da tabela hotels:'); 
    for(let i = 0; i < result[0].length; i++) { 
      const col = result[0][i]; 
      console.log(col.Field + ' - ' + col.Type + ' - Key: ' + col.Key); 
    } 
    await db.close(); 
  } catch (err) { 
    console.error('Erro:', err.message); 
  } 
})();