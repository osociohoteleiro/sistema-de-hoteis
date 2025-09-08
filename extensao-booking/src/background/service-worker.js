// Service Worker para comunicação em background
console.log('🚀 OSH Booking Extension Service Worker started');

// Inicializar quando extensão for instalada
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('📦 Extension installed:', details);
  
  // Configurar badge inicial
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
  
  // Criar contexto menu (opcional)
  chrome.contextMenus.create({
    id: 'sync-now',
    title: 'Sincronizar dados agora',
    contexts: ['page'],
    documentUrlPatterns: ['https://admin.booking.com/*']
  });
});

// Listener para mensagens dos content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Message received:', request);

  switch (request.action) {
    case 'SYNC_DATA':
      handleDataSync(request.data, sendResponse);
      return true; // Keep response channel open

    case 'UPDATE_BADGE':
      updateBadge(request.text, request.color);
      sendResponse({ success: true });
      break;

    case 'SHOW_NOTIFICATION':
      showNotification(request.title, request.message, request.type);
      sendResponse({ success: true });
      break;

    case 'GET_STATUS':
      getExtensionStatus().then(sendResponse);
      return true;

    default:
      console.warn('⚠️ Unknown action:', request.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Manipular sincronização de dados
async function handleDataSync(data, sendResponse) {
  try {
    console.log('🔄 Starting data sync:', data);

    // Verificar se temos token de auth
    const result = await chrome.storage.local.get(['osh_auth_token', 'osh_hotel_id']);
    
    if (!result.osh_auth_token || !result.osh_hotel_id) {
      sendResponse({ 
        success: false, 
        error: 'Extensão não configurada. Configure no popup da extensão.' 
      });
      return;
    }

    // Fazer requisição para API
    const response = await fetch('http://localhost:3001/api/booking-extranet/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${result.osh_auth_token}`
      },
      body: JSON.stringify({
        hotelId: result.osh_hotel_id,
        timestamp: new Date().toISOString(),
        source: 'booking-extranet',
        data: data
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const apiResponse = await response.json();
    
    // Atualizar storage com última sincronização
    await chrome.storage.local.set({
      osh_last_sync: new Date().toISOString(),
      osh_sync_status: 'success'
    });

    // Atualizar badge
    updateBadge('✓', '#4CAF50');

    // Mostrar notificação de sucesso
    showNotification('OSH Sync', `Dados sincronizados: ${data.type}`, 'success');

    sendResponse({ success: true, data: apiResponse });

  } catch (error) {
    console.error('❌ Sync error:', error);

    // Atualizar status de erro
    await chrome.storage.local.set({
      osh_sync_status: 'error'
    });

    // Atualizar badge com erro
    updateBadge('!', '#f44336');

    // Mostrar notificação de erro
    showNotification('OSH Sync Error', error.message, 'error');

    sendResponse({ success: false, error: error.message });
  }
}

// Atualizar badge da extensão
function updateBadge(text, color) {
  chrome.action.setBadgeText({ text: text.toString() });
  chrome.action.setBadgeBackgroundColor({ color });
}

// Mostrar notificação
function showNotification(title, message, type = 'basic') {
  const iconUrl = type === 'error' ? 'icons/icon-48.png' : 'icons/icon-48.png';
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: iconUrl,
    title: title,
    message: message
  });
}

// Obter status da extensão
async function getExtensionStatus() {
  try {
    const storage = await chrome.storage.local.get([
      'osh_auth_token',
      'osh_hotel_id',
      'osh_last_sync',
      'osh_sync_status',
      'osh_user_config'
    ]);

    const status = {
      isConfigured: !!(storage.osh_auth_token && storage.osh_hotel_id),
      hasToken: !!storage.osh_auth_token,
      hotelId: storage.osh_hotel_id,
      lastSync: storage.osh_last_sync ? new Date(storage.osh_last_sync) : null,
      syncStatus: storage.osh_sync_status || 'idle',
      config: storage.osh_user_config || {}
    };

    // Verificar conectividade com API
    try {
      const healthCheck = await fetch('http://localhost:3001/health', { 
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      status.apiOnline = healthCheck.ok;
    } catch (error) {
      status.apiOnline = false;
    }

    return { success: true, data: status };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Listener para context menu
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'sync-now') {
    // Enviar mensagem para content script forçar sync
    chrome.tabs.sendMessage(tab.id, { action: 'FORCE_SYNC' });
  }
});

// Alarme para sincronização automática (opcional)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'auto-sync') {
    // Verificar se há abas da extranet abertas
    const tabs = await chrome.tabs.query({
      url: 'https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/*'
    });

    if (tabs.length > 0) {
      // Enviar mensagem para fazer sync automático
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { action: 'AUTO_SYNC' });
      });
    }
  }
});

// Configurar alarme para sync automático (a cada 5 minutos)
chrome.alarms.create('auto-sync', {
  delayInMinutes: 1,
  periodInMinutes: 5
});

console.log('✅ Service Worker initialized');