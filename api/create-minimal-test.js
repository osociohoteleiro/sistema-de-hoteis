// Criar uma versão mínima de teste do endpoint price-trends
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'rateShopper.js');
let content = fs.readFileSync(filePath, 'utf8');

// Encontrar a rota price-trends e criar uma versão de teste
const testVersion = `
// GET /api/rate-shopper/:hotel_id/price-trends - VERSÃO DE TESTE
router.get('/:hotel_id/price-trends-test', async (req, res) => {
  try {
    const hotel_id = req.params.hotel_id;
    
    // Verificar se hotel_id é UUID ou integer e converter para ID
    let hotelId;
    if (hotel_id.includes('-')) {
      const hotel = await Hotel.findByUuid(hotel_id);
      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      hotelId = hotel.id;
    } else {
      hotelId = parseInt(hotel_id);
    }

    // Retornar dados de teste fixos em vez de fazer query complexa
    const testData = {
      success: true,
      data: {
        chart_data: {
          "2025-09-10": {
            date: "2025-09-10",
            "Eco Encanto Pousada (Artaxnet)": 450.00,
            is_future: false
          },
          "2025-09-11": {
            date: "2025-09-11", 
            "Eco Encanto Pousada (Artaxnet)": 475.00,
            is_future: false
          }
        },
        properties: ["Eco Encanto Pousada (Artaxnet)"],
        main_properties: ["Eco Encanto Pousada (Artaxnet)"],
        date_range: {
          start: "2025-09-10",
          end: "2025-10-09",
          future_end: "2025-11-09"
        }
      }
    };

    res.json(testData);

  } catch (error) {
    console.error('Test price trends error:', error);
    res.status(500).json({ error: 'Failed to load test price trends' });
  }
});
`;

// Encontrar onde inserir a nova rota (antes da rota price-trends original)
const insertIndex = content.indexOf("router.get('/:hotel_id/price-trends'");
if (insertIndex === -1) {
  console.log('❌ Não encontrou a rota price-trends para inserir o teste');
  return;
}

// Inserir a nova rota de teste
const beforeRoute = content.substring(0, insertIndex);
const afterRoute = content.substring(insertIndex);
const newContent = beforeRoute + testVersion + '\n\n' + afterRoute;

fs.writeFileSync(filePath, newContent);

console.log('✅ Rota de teste criada: /api/rate-shopper/:hotel_id/price-trends-test');
console.log('🧪 Esta rota retorna dados fixos para testar se o problema é na query SQL');
console.log('📋 Para testar: https://osh-sistemas-api-backend.d32pnk.easypanel.host/api/rate-shopper/17/price-trends-test');
console.log('💡 Se a rota de teste funcionar, confirma que o problema é na query SQL original');