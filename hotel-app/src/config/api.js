export const API_CONFIG = {
  baseURL: 'http://localhost:3001',
  WEBHOOK_URL: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/cadastra_hotel',
  AI_ENDPOINTS: {
    CREATE_INTEGRATION: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/create_integration',
    GET_INTEGRATIONS: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/get_integrations',
    UPDATE_INTEGRATION: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/update_integration',
    DELETE_INTEGRATION: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/delete_integration',
    GET_AI_STATS: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/get_ai_stats',
    GET_BOT_FIELDS: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/05e590dd-8185-424b-9658-d839ca38c481/lista_botfields_onenode_mysql/:hotel_uuid',
    UPDATE_BOT_FIELDS: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/atualiza_botfields_no_onenode'
  }
};