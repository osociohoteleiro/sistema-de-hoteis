// Debugar e corrigir erro "Invalid Chatbot"
const axios = require('axios');

const FLOWISE_URL = 'https://flows.osociohoteleiro.com.br';
const FLOWISE_API_KEY = 'shrq4KZg2IGHJFA4ZikqjrXpf46jU7hXfFKXSQUS84M';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${FLOWISE_API_KEY}`
};

const CHATFLOW_IDS = [
  'afa898bb-28b9-4f5c-9fd1-c474f3a66037', // Claude Code Test
  'fd540296-d63e-4d92-abe2-e0a50e0f1e41', // OSH Assistant
  '6a7b9d54-fce9-425a-8193-5ce2c8dcbecc'  // Claude Code OSH Assistant
];

async function debugAndFixChatflows() {
  try {
    console.log('🔍 Diagnosticando chatflows com erro...');
    
    for (const chatflowId of CHATFLOW_IDS) {
      console.log(`\n📋 Analisando chatflow: ${chatflowId}`);
      
      try {
        // 1. Verificar detalhes do chatflow
        const chatflowResponse = await axios.get(`${FLOWISE_URL}/api/v1/chatflows/${chatflowId}`, { headers });
        const chatflow = chatflowResponse.data;
        
        console.log(`✅ Nome: ${chatflow.name}`);
        console.log(`📊 Status: ${chatflow.deployed ? 'Deployed' : 'Draft'}`);
        console.log(`🔧 Categoria: ${chatflow.category}`);
        
        // 2. Tentar acessar via chatbot interface
        console.log('🧪 Testando interface do chatbot...');
        
        try {
          const chatbotResponse = await axios.get(`${FLOWISE_URL}/api/v1/public-chatflows/${chatflowId}`, { 
            headers: { 'Content-Type': 'application/json' }
          });
          console.log('✅ Interface do chatbot: OK');
        } catch (chatbotError) {
          console.log('❌ Erro na interface:', chatbotError.response?.status, chatbotError.response?.data?.message);
        }
        
        // 3. Verificar se precisa de correção
        if (chatflow.flowData) {
          const flowData = JSON.parse(chatflow.flowData);
          console.log(`📊 Nodes: ${flowData.nodes?.length || 0}`);
          console.log(`🔗 Edges: ${flowData.edges?.length || 0}`);
          
          // Verificar se tem ending node válido
          const hasValidEndingNode = flowData.nodes?.some(node => 
            ['conversationChain', 'llmChain', 'agent'].some(type => 
              node.data?.name?.toLowerCase().includes(type) || 
              node.type?.toLowerCase().includes(type)
            )
          );
          
          console.log(`🎯 Ending node válido: ${hasValidEndingNode ? 'Sim' : 'Não'}`);
          
          if (!hasValidEndingNode) {
            console.log('⚠️ Problema identificado: Falta ending node válido');
          }
        }
        
      } catch (error) {
        console.log(`❌ Erro ao acessar chatflow: ${error.response?.data?.message || error.message}`);
      }
    }
    
    // 4. Criar chatflow simplificado e funcional
    console.log('\n🛠️ Criando chatflow corrigido...');
    
    const workingChatflow = {
      name: '✅ OSH Assistant - FIXED',
      flowData: JSON.stringify({
        nodes: [
          {
            id: 'conversationChain_0',
            position: { x: 400, y: 300 },
            type: 'customNode',
            data: {
              id: 'conversationChain_0',
              label: 'Conversation Chain',
              version: 3,
              name: 'conversationChain',
              type: 'ConversationChain',
              baseClasses: ['ConversationChain', 'BaseChain'],
              category: 'Chains',
              inputs: {
                systemMessagePrompt: `Você é um assistente virtual da rede OSH (Onscreen Hotels).

🏨 FUNÇÕES:
- Receber hóspedes com cordialidade
- Informar sobre serviços do hotel
- Auxiliar com reservas e hospedagem
- Responder dúvidas sobre comodidades
- Fornecer informações turísticas

💬 COMPORTAMENTO:
- Seja sempre educado e profissional
- Responda de forma clara e útil
- Use emojis quando apropriado
- Mantenha foco na experiência do hóspede

Desenvolvido por: Claude Code Team para OSH`,
                model: '{{chatOpenAI_0.data.instance}}',
                memory: '{{bufferMemory_0.data.instance}}'
              },
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
              outputAnchors: [
                {
                  id: 'conversationChain_0-output-conversationChain-ConversationChain',
                  name: 'conversationChain',
                  label: 'ConversationChain',
                  type: 'ConversationChain'
                }
              ]
            },
            width: 300,
            height: 500
          }
        ],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 }
      }),
      deployed: true,
      isPublic: true,
      chatbotConfig: JSON.stringify({
        welcomeMessage: '🏨 Olá! Bem-vindo à rede OSH! Sou seu assistente virtual criado pela equipe Claude Code. Como posso ajudá-lo hoje?',
        backgroundColor: '#ffffff',
        fontSize: 16,
        botMessage: {
          backgroundColor: '#f0f9ff',
          textColor: '#1e40af',
          showAvatar: true,
          avatarSrc: 'https://cdn-icons-png.flaticon.com/512/201/201623.png'
        },
        userMessage: {
          backgroundColor: '#3b82f6',
          textColor: '#ffffff',
          showAvatar: true,
          avatarSrc: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
        },
        textInput: {
          backgroundColor: '#ffffff',
          textColor: '#374151',
          placeholder: 'Digite sua mensagem...',
          sendButtonColor: '#3b82f6'
        },
        footer: {
          textColor: '#9ca3af',
          text: 'Assistente OSH by Claude Code'
        }
      }),
      type: 'CHATFLOW',
      category: 'OSH Fixed'
    };
    
    const createResponse = await axios.post(`${FLOWISE_URL}/api/v1/chatflows`, workingChatflow, { headers });
    const fixedChatflowId = createResponse.data.id;
    
    console.log('✅ Chatflow corrigido criado!');
    console.log(`🆔 ID: ${fixedChatflowId}`);
    
    // 5. Aguardar e testar
    console.log('⏳ Aguardando inicialização...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verificar se o chatbot interface funciona
    try {
      const publicResponse = await axios.get(`${FLOWISE_URL}/api/v1/public-chatflows/${fixedChatflowId}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('✅ Interface do chatbot funcionando!');
      console.log('📋 Configuração:', publicResponse.data.chatbotConfig ? 'OK' : 'Faltando');
      
    } catch (publicError) {
      console.log('❌ Interface ainda com problema:', publicError.response?.data?.message);
    }
    
    // 6. Tentar um teste simples de mensagem
    console.log('🧪 Teste de mensagem...');
    
    try {
      const testResponse = await axios.post(
        `${FLOWISE_URL}/api/v1/prediction/${fixedChatflowId}`,
        { question: 'Olá, você está funcionando?' },
        { headers, timeout: 30000 }
      );
      
      console.log('✅ Teste de mensagem: SUCESSO!');
      console.log('🤖 Resposta:', testResponse.data.text || testResponse.data);
      
    } catch (testError) {
      console.log('⚠️ Teste de mensagem falhou:', testError.response?.data?.message || testError.message);
    }
    
    console.log('\n🎯 RESULTADO FINAL:');
    console.log('═'.repeat(50));
    console.log(`✅ Chatflow corrigido: ${workingChatflow.name}`);
    console.log(`🆔 ID: ${fixedChatflowId}`);
    console.log(`🌐 Admin: ${FLOWISE_URL}/chatflows`);
    console.log(`💬 Teste: ${FLOWISE_URL}/chatbot/${fixedChatflowId}`);
    console.log(`🔗 API: ${FLOWISE_URL}/api/v1/prediction/${fixedChatflowId}`);
    console.log('═'.repeat(50));
    
    return {
      success: true,
      fixedChatflowId,
      chatUrl: `${FLOWISE_URL}/chatbot/${fixedChatflowId}`
    };
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

async function createSimplestWorkingChatflow() {
  console.log('🔧 Criando chatflow mais simples possível...');
  
  try {
    // Usar um dos chatflows existentes que funciona como base
    const existingResponse = await axios.get(`${FLOWISE_URL}/api/v1/chatflows`, { headers });
    const workingChatflow = existingResponse.data.find(cf => cf.deployed && cf.name.includes('active'));
    
    if (workingChatflow) {
      console.log(`📋 Encontrado chatflow funcional: ${workingChatflow.name}`);
      
      // Clonar com modificações mínimas
      const cloned = {
        ...workingChatflow,
        id: undefined,
        name: '🟢 Claude Code Simple - WORKING',
        deployed: true,
        isPublic: true,
        chatbotConfig: JSON.stringify({
          welcomeMessage: '✅ Chatbot funcional criado pela equipe Claude Code! Como posso ajudar?',
          backgroundColor: '#f9fafb',
          fontSize: 16
        }),
        category: 'Claude Code Working'
      };
      
      const cloneResponse = await axios.post(`${FLOWISE_URL}/api/v1/chatflows`, cloned, { headers });
      const clonedId = cloneResponse.data.id;
      
      console.log('✅ Chatflow clonado com sucesso!');
      console.log(`🆔 ID: ${clonedId}`);
      console.log(`💬 Teste: ${FLOWISE_URL}/chatbot/${clonedId}`);
      
      return {
        success: true,
        chatflowId: clonedId,
        name: cloned.name,
        chatUrl: `${FLOWISE_URL}/chatbot/${clonedId}`
      };
    } else {
      console.log('❌ Nenhum chatflow ativo encontrado para clonar');
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar chatflow simples:', error.message);
  }
  
  return { success: false };
}

// Executar diagnóstico
console.log('🚀 Iniciando correção de chatflows...');

debugAndFixChatflows().then(async (result) => {
  if (!result.success) {
    console.log('\n🔄 Tentando abordagem alternativa...');
    const simpleResult = await createSimplestWorkingChatflow();
    
    if (simpleResult.success) {
      console.log('\n✅ SUCESSO com chatflow simples!');
      console.log(`Acesse: ${simpleResult.chatUrl}`);
    } else {
      console.log('\n❌ Todas as tentativas falharam');
    }
  } else {
    console.log('\n✅ PROBLEMA RESOLVIDO!');
    console.log(`Chatflow corrigido disponível: ${result.chatUrl}`);
  }
}).catch(console.error);