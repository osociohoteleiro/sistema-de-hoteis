const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testUpdateHotel() {
  try {
    // Primeiro fazer login para obter o token
    console.log('🔐 Fazendo login...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@hotel.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Falha no login');
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login realizado com sucesso!');

    // Buscar lista de hotéis
    console.log('📋 Buscando lista de hotéis...');
    const hotelsResponse = await fetch('http://localhost:3001/api/hotels', {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });

    const hotelsData = await hotelsResponse.json();
    const hotels = hotelsData.hotels || [];
    
    if (hotels.length === 0) {
      console.log('⚠️  Nenhum hotel encontrado para testar');
      return;
    }

    const hotelToUpdate = hotels[0];
    console.log(`🏨 Hotel para atualizar: ${hotelToUpdate.hotel_nome} (ID: ${hotelToUpdate.id})`);

    // Atualizar o hotel
    console.log('🔄 Atualizando hotel...');
    const updateData = {
      hotel_nome: hotelToUpdate.hotel_nome + ' (Atualizado)',
      hotel_capa: hotelToUpdate.hotel_capa || '',
      hora_checkin: '15:00:00',
      hora_checkout: '11:00:00'
    };

    console.log('Dados enviados:', updateData);

    const updateResponse = await fetch(`http://localhost:3001/api/hotels/${hotelToUpdate.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    const updateResult = await updateResponse.json();
    
    if (!updateResponse.ok) {
      console.error('❌ Erro ao atualizar:', updateResult);
      console.error('Status:', updateResponse.status);
      console.error('Detalhes:', updateResult.details || updateResult.error);
    } else {
      console.log('✅ Hotel atualizado com sucesso!');
      console.log('Resultado:', updateResult);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testUpdateHotel();