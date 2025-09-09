const db = require('./config/database');

async function processExistingPrices() {
  try {
    console.log('🔄 Processando preços existentes para gerar histórico...');
    
    // Conectar ao banco
    await db.connect();
    
    // Buscar todas as propriedades com preços
    const query = `
      SELECT 
        rsp.property_id,
        rsp.check_in_date,
        rsp.price,
        rsp.scraped_at,
        rsp.hotel_id,
        rsp_prop.property_name
      FROM rate_shopper_prices rsp
      JOIN rate_shopper_properties rsp_prop ON rsp.property_id = rsp_prop.id
      WHERE rsp.hotel_id = 17  -- Hotel específico para teste
      ORDER BY rsp.property_id, rsp.check_in_date, rsp.scraped_at ASC
    `;
    
    const allPrices = await db.query(query);
    console.log(`📊 Encontrados ${allPrices.length} preços para processar`);
    
    // Agrupar por propriedade e data
    const priceMap = {};
    
    for (const price of allPrices) {
      const key = `${price.property_id}_${price.check_in_date}`;
      
      if (!priceMap[key]) {
        priceMap[key] = [];
      }
      
      priceMap[key].push(price);
    }
    
    let processedCount = 0;
    
    // Processar cada grupo
    for (const [key, prices] of Object.entries(priceMap)) {
      if (prices.length < 2) continue; // Precisa ter pelo menos 2 preços para comparar
      
      // Ordenar por data de scraping
      prices.sort((a, b) => new Date(a.scraped_at) - new Date(b.scraped_at));
      
      for (let i = 1; i < prices.length; i++) {
        const currentPrice = prices[i];
        const previousPrice = prices[i - 1];
        
        const priceChange = parseFloat(currentPrice.price) - parseFloat(previousPrice.price);
        const changePercentage = (priceChange / parseFloat(previousPrice.price)) * 100;
        
        // Só processar mudanças significativas (> 1%)
        if (Math.abs(changePercentage) <= 1) continue;
        
        const changeType = changePercentage > 0 ? 'UP' : 'DOWN';
        
        // Formatar data corretamente
        const checkInDate = currentPrice.check_in_date instanceof Date ? 
          currentPrice.check_in_date.toISOString().split('T')[0] : 
          currentPrice.check_in_date.toString().split('T')[0];
        
        console.log(`📈 ${currentPrice.property_name} (${checkInDate}): R$ ${previousPrice.price} → R$ ${currentPrice.price} (${changePercentage.toFixed(1)}%)`);
        
        // Inserir no histórico
        await db.query(`
          INSERT INTO rate_shopper_price_history 
          (property_id, hotel_id, check_in_date, current_price, previous_price, price_change, change_percentage, change_type)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          currentPrice.property_id,
          currentPrice.hotel_id,
          checkInDate,
          currentPrice.price,
          previousPrice.price,
          priceChange.toFixed(2),
          changePercentage.toFixed(2),
          changeType
        ]);
        
        processedCount++;
      }
    }
    
    console.log(`✅ Processamento concluído! ${processedCount} registros de histórico criados.`);
    
  } catch (error) {
    console.error('❌ Erro ao processar preços existentes:', error);
  } finally {
    await db.close();
  }
}

processExistingPrices();