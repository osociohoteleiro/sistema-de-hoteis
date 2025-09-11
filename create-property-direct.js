// Script para criar propriedade diretamente via SQL
const axios = require('axios');

async function createPropertiesDirect() {
  const API_BASE = 'https://osh-sistemas-api-backend.d32pnk.easypanel.host';
  const hotelUuid = '0cf84c30-82cb-11f0-bd40-02420a0b00b1';

  console.log('🎯 Tentando criar propriedades diretamente...');

  // Lista de propriedades para criar
  const properties = [
    {
      property_name: "Eco Encanto Pousada",
      booking_url: "https://www.booking.com/hotel/br/eco-encanto-pousada-e-hostel.pt-br.html",
      location: "Ubatuba",
      category: "DIRECT_COMPETITOR",
      max_bundle_size: 7,
      is_main_property: true
    },
    {
      property_name: "Eco Encanto Pousada",
      booking_url: "https://eco-encanto-pousada.artaxnet.com/#/",
      location: "Ubatuba", 
      category: "DIRECT_COMPETITOR",
      max_bundle_size: 7,
      is_main_property: true
    },
    {
      property_name: "Pousada Aquária",
      booking_url: "https://www.booking.com/hotel/br/pousada-aquaria.pt-br.html",
      location: "Ubatuba",
      category: "COMPETITOR",
      max_bundle_size: 7,
      is_main_property: false
    }
  ];

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    console.log(`\n${i + 1}. Criando: ${prop.property_name}...`);

    try {
      const response = await axios.post(
        `${API_BASE}/api/rate-shopper/${hotelUuid}/properties`,
        prop,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log(`✅ Propriedade criada: ${prop.property_name}`);
      console.log(`   Resposta:`, response.data);

    } catch (error) {
      console.log(`❌ Erro ao criar ${prop.property_name}:`);
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Erro: ${error.response?.data?.error || error.message}`);
      
      if (error.response?.data?.details) {
        console.log(`   Detalhes:`, error.response.data.details);
      }
    }
  }

  // Verificar propriedades criadas
  console.log('\n🔍 Verificando propriedades criadas...');
  try {
    const response = await axios.get(`${API_BASE}/api/rate-shopper/${hotelUuid}/properties`);
    console.log(`✅ Total de propriedades: ${response.data.data.length}`);
    response.data.data.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.property_name} (${prop.platform || 'booking'})`);
    });
  } catch (error) {
    console.log(`❌ Erro ao listar propriedades: ${error.message}`);
  }
}

createPropertiesDirect().catch(console.error);