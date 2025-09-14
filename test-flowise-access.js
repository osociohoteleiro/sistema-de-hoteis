// Teste de acesso ao Flowise e criação de chatflow
const axios = require('axios');

const FLOWISE_URL = 'https://flows.osociohoteleiro.com.br';
const FLOWISE_API_KEY = 'shrq4KZg2IGHJFA4ZikqjrXpf46jU7hXfFKXSQUS84M';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${FLOWISE_API_KEY}`
};

async function testFlowiseAccess() {
  console.log('🔄 Testando acesso ao Flowise...');
  
  try {
    // 1. Testar conexão básica
    console.log('1. Testando conexão...');
    const versionResponse = await axios.get(`${FLOWISE_URL}/api/v1/version`, { headers });
    console.log('✅ Conexão estabelecida!');
    console.log('📋 Versão Flowise:', versionResponse.data);

    // 2. Listar chatflows existentes
    console.log('\n2. Listando chatflows existentes...');
    const chatflowsResponse = await axios.get(`${FLOWISE_URL}/api/v1/chatflows`, { headers });
    console.log(`✅ Encontrados ${chatflowsResponse.data.length} chatflows`);
    
    if (chatflowsResponse.data.length > 0) {
      console.log('📋 Primeiros 3 chatflows:');
      chatflowsResponse.data.slice(0, 3).forEach((flow, index) => {
        console.log(`   ${index + 1}. ${flow.name} (ID: ${flow.id})`);
      });
    }

    // 3. Criar novo chatflow de demonstração
    console.log('\n3. Criando chatflow de demonstração...');
    
    const newChatflow = {
      name: `🤖 Claude Code Test - ${new Date().toISOString().split('T')[0]}`,
      flowData: JSON.stringify({
        nodes: [
          {
            id: 'chatOpenAI_0',
            position: { x: 300, y: 200 },
            type: 'customNode',
            data: {
              id: 'chatOpenAI_0',
              label: 'ChatOpenAI',
              version: 6,
              name: 'chatOpenAI',
              type: 'ChatOpenAI',
              baseClasses: ['ChatOpenAI', 'BaseChatModel'],
              category: 'Chat Models',
              description: 'Wrapper around OpenAI large language models that use the Chat endpoint',
              inputParams: [
                {
                  label: 'Connect Credential',
                  name: 'credential',
                  type: 'credential',
                  credentialNames: ['openAIApi']
                },
                {
                  label: 'Model Name',
                  name: 'modelName',
                  type: 'options',
                  options: [
                    { label: 'gpt-4', name: 'gpt-4' },
                    { label: 'gpt-3.5-turbo', name: 'gpt-3.5-turbo' }
                  ],
                  default: 'gpt-3.5-turbo'
                },
                {
                  label: 'Temperature',
                  name: 'temperature',
                  type: 'number',
                  step: 0.1,
                  default: 0.9
                }
              ],
              inputAnchors: [
                {
                  label: 'Cache',
                  name: 'cache',
                  type: 'BaseCache',
                  optional: true
                }
              ],
              inputs: {
                modelName: 'gpt-3.5-turbo',
                temperature: 0.9,
                cache: ''
              },
              outputAnchors: [
                {
                  id: 'chatOpenAI_0-output-chatOpenAI-ChatOpenAI|BaseChatModel',
                  name: 'chatOpenAI',
                  label: 'ChatOpenAI',
                  type: 'ChatOpenAI | BaseChatModel'
                }
              ]
            },
            width: 300,
            height: 500,
            selected: false,
            positionAbsolute: { x: 300, y: 200 },
            dragging: false
          },
          {
            id: 'conversationChain_0',
            position: { x: 700, y: 200 },
            type: 'customNode',
            data: {
              id: 'conversationChain_0',
              label: 'Conversation Chain',
              version: 1,
              name: 'conversationChain',
              type: 'ConversationChain',
              baseClasses: ['ConversationChain', 'BaseChain'],
              category: 'Chains',
              description: 'Have a conversation with assistant',
              inputParams: [
                {
                  label: 'System Message',
                  name: 'systemMessagePrompt',
                  type: 'string',
                  rows: 4,
                  additionalParams: true,
                  optional: true,
                  placeholder: 'You are a helpful assistant that...'
                }
              ],
              inputAnchors: [
                {
                  label: 'Chat Model',
                  name: 'model',
                  type: 'BaseChatModel'
                },
                {
                  label: 'Memory',
                  name: 'memory',
                  type: 'BaseMemory',
                  optional: true
                }
              ],
              inputs: {
                model: '{{chatOpenAI_0.data.instance}}',
                memory: '',
                systemMessagePrompt: 'Você é um assistente virtual especializado em hotelaria. Responda sempre de forma educada e profissional, oferecendo ajuda com informações sobre reservas, serviços do hotel e dúvidas gerais dos hóspedes.'
              },
              outputAnchors: [
                {
                  id: 'conversationChain_0-output-conversationChain-ConversationChain|BaseChain',
                  name: 'conversationChain',
                  label: 'ConversationChain',
                  type: 'ConversationChain | BaseChain'
                }
              ]
            },
            width: 300,
            height: 500,
            selected: false,
            positionAbsolute: { x: 700, y: 200 },
            dragging: false
          }
        ],
        edges: [
          {
            source: 'chatOpenAI_0',
            sourceHandle: 'chatOpenAI_0-output-chatOpenAI-ChatOpenAI|BaseChatModel',
            target: 'conversationChain_0',
            targetHandle: 'conversationChain_0-input-model-BaseChatModel',
            type: 'buttonedge',
            id: 'chatOpenAI_0-chatOpenAI_0-output-chatOpenAI-ChatOpenAI|BaseChatModel-conversationChain_0-conversationChain_0-input-model-BaseChatModel'
          }
        ],
        viewport: { x: 0, y: 0, zoom: 1 }
      }),
      deployed: false,
      isPublic: false,
      apikeyid: null,
      chatbotConfig: JSON.stringify({
        welcomeMessage: '👋 Olá! Sou o assistente virtual criado via Claude Code. Como posso ajudá-lo hoje?',
        backgroundColor: '#ffffff',
        fontSize: 16,
        botMessage: {
          backgroundColor: '#f0f8ff',
          textColor: '#2c3e50',
          showAvatar: true,
          avatarSrc: ''
        },
        userMessage: {
          backgroundColor: '#3498db',
          textColor: '#ffffff',
          showAvatar: true,
          avatarSrc: ''
        },
        textInput: {
          backgroundColor: '#ffffff',
          textColor: '#2c3e50',
          placeholder: 'Digite sua mensagem aqui...',
          sendButtonColor: '#3498db'
        }
      }),
      type: 'CHATFLOW',
      category: 'Claude Code Demo'
    };

    const createResponse = await axios.post(`${FLOWISE_URL}/api/v1/chatflows`, newChatflow, { headers });
    
    console.log('✅ Chatflow criado com sucesso!');
    console.log('📋 Detalhes do chatflow:');
    console.log(`   • Nome: ${createResponse.data.name}`);
    console.log(`   • ID: ${createResponse.data.id}`);
    console.log(`   • URL: ${FLOWISE_URL}/chatflows`);
    console.log(`   • Categoria: ${newChatflow.category}`);

    // 4. Testar uma mensagem no chatflow (se possível)
    console.log('\n4. Testando mensagem no chatflow...');
    
    try {
      const testMessage = {
        question: 'Olá! Este é um teste do Claude Code. Você consegue me responder?'
      };
      
      const messageResponse = await axios.post(
        `${FLOWISE_URL}/api/v1/prediction/${createResponse.data.id}`,
        testMessage,
        { headers }
      );
      
      console.log('✅ Teste de mensagem bem-sucedido!');
      console.log('🤖 Resposta do bot:', messageResponse.data);
      
    } catch (messageError) {
      console.log('⚠️ Teste de mensagem falhou (normal se não há credenciais OpenAI configuradas)');
      console.log('   Erro:', messageError.response?.data?.message || messageError.message);
    }

    console.log('\n🎉 DEMONSTRAÇÃO COMPLETA!');
    console.log('✅ Acesso ao Flowise confirmado');
    console.log('✅ Chatflow criado com sucesso');
    console.log(`🌐 Acesse: ${FLOWISE_URL}/chatflows para ver o chatflow`);

    return {
      success: true,
      chatflowId: createResponse.data.id,
      chatflowName: createResponse.data.name,
      url: `${FLOWISE_URL}/chatflows`
    };

  } catch (error) {
    console.error('❌ Erro ao acessar Flowise:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

// Executar teste
testFlowiseAccess().then(result => {
  if (result.success) {
    console.log('\n🎯 ACESSO COMPROVADO!');
    console.log(`Chatflow "${result.chatflowName}" criado com ID: ${result.chatflowId}`);
  } else {
    console.log('\n❌ Falha no acesso:', result.error);
  }
}).catch(console.error);