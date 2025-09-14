// Analisar nodes do chatflow específico
const axios = require('axios');

const FLOWISE_URL = 'https://flows.osociohoteleiro.com.br';
const FLOWISE_API_KEY = 'shrq4KZg2IGHJFA4ZikqjrXpf46jU7hXfFKXSQUS84M';
const CHATFLOW_ID = '6a7b9d54-fce9-425a-8193-5ce2c8dcbecc';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${FLOWISE_API_KEY}`
};

async function analyzeChatflowNodes() {
  try {
    console.log('🔍 Analisando chatflow:', CHATFLOW_ID);
    console.log('🌐 URL:', `${FLOWISE_URL}/canvas/${CHATFLOW_ID}`);
    
    // 1. Buscar detalhes do chatflow
    const response = await axios.get(`${FLOWISE_URL}/api/v1/chatflows/${CHATFLOW_ID}`, { headers });
    const chatflow = response.data;
    
    console.log('\n📋 INFORMAÇÕES GERAIS:');
    console.log('═'.repeat(50));
    console.log(`📝 Nome: ${chatflow.name}`);
    console.log(`✅ Status: ${chatflow.deployed ? 'ATIVO/DEPLOYED' : 'INATIVO/DRAFT'}`);
    console.log(`📂 Categoria: ${chatflow.category}`);
    console.log(`🏷️ Tipo: ${chatflow.type}`);
    console.log(`🌐 Público: ${chatflow.isPublic ? 'Sim' : 'Não'}`);
    
    // 2. Analisar estrutura do fluxo
    if (!chatflow.flowData) {
      console.log('❌ Dados do fluxo não encontrados');
      return;
    }
    
    const flowData = JSON.parse(chatflow.flowData);
    const { nodes = [], edges = [], viewport = {} } = flowData;
    
    console.log('\n🏗️ ESTRUTURA DO FLUXO:');
    console.log('═'.repeat(50));
    console.log(`🔢 Total de Nodes: ${nodes.length}`);
    console.log(`🔗 Total de Conexões: ${edges.length}`);
    console.log(`👁️ Viewport: x:${viewport.x}, y:${viewport.y}, zoom:${viewport.zoom}`);
    
    // 3. Analisar cada node detalhadamente
    console.log('\n🧩 ANÁLISE DETALHADA DOS NODES:');
    console.log('═'.repeat(70));
    
    nodes.forEach((node, index) => {
      console.log(`\n📍 NODE ${index + 1}: ${node.id}`);
      console.log('─'.repeat(40));
      
      const nodeData = node.data || {};
      
      // Informações básicas do node
      console.log(`🏷️  Nome/Label: ${nodeData.label || 'Sem nome'}`);
      console.log(`🔧 Tipo: ${nodeData.name || nodeData.type || 'Indefinido'}`);
      console.log(`📂 Categoria: ${nodeData.category || 'N/A'}`);
      console.log(`📍 Posição: x:${node.position?.x || 0}, y:${node.position?.y || 0}`);
      console.log(`📏 Tamanho: ${node.width || 'auto'} x ${node.height || 'auto'}`);
      
      // Versão e classe base
      if (nodeData.version) console.log(`🔢 Versão: ${nodeData.version}`);
      if (nodeData.baseClasses) console.log(`🏗️  Classes Base: ${nodeData.baseClasses.join(', ')}`);
      
      // Descrição/Funcionalidade
      if (nodeData.description) {
        console.log(`📖 Descrição: ${nodeData.description}`);
      }
      
      // Parâmetros de entrada
      if (nodeData.inputParams && nodeData.inputParams.length > 0) {
        console.log(`⚙️  Parâmetros de Entrada:`);
        nodeData.inputParams.forEach(param => {
          console.log(`   • ${param.label || param.name}: ${param.type} ${param.optional ? '(opcional)' : '(obrigatório)'}`);
          if (param.default) console.log(`     Default: ${param.default}`);
          if (param.description) console.log(`     ${param.description}`);
        });
      }
      
      // Valores configurados (inputs)
      if (nodeData.inputs && Object.keys(nodeData.inputs).length > 0) {
        console.log(`🔧 Configurações Atuais:`);
        Object.entries(nodeData.inputs).forEach(([key, value]) => {
          if (typeof value === 'string' && value.length > 100) {
            console.log(`   • ${key}: ${value.substring(0, 100)}...`);
          } else {
            console.log(`   • ${key}: ${value}`);
          }
        });
      }
      
      // Âncoras de entrada
      if (nodeData.inputAnchors && nodeData.inputAnchors.length > 0) {
        console.log(`📥 Entradas Aceitas:`);
        nodeData.inputAnchors.forEach(anchor => {
          console.log(`   • ${anchor.label}: ${anchor.type}`);
        });
      }
      
      // Âncoras de saída
      if (nodeData.outputAnchors && nodeData.outputAnchors.length > 0) {
        console.log(`📤 Saídas Disponíveis:`);
        nodeData.outputAnchors.forEach(anchor => {
          console.log(`   • ${anchor.label}: ${anchor.type}`);
        });
      }
      
      // Função específica baseada no tipo
      const nodeType = nodeData.name || nodeData.type || '';
      console.log(`\n🎯 FUNÇÃO ESPECÍFICA:`);
      
      switch (nodeType.toLowerCase()) {
        case 'chatopenai':
          console.log('   🤖 MODELO DE IA: Conecta com OpenAI GPT para gerar respostas inteligentes');
          if (nodeData.inputs?.modelName) console.log(`   📋 Modelo: ${nodeData.inputs.modelName}`);
          if (nodeData.inputs?.temperature) console.log(`   🌡️  Temperatura: ${nodeData.inputs.temperature} (criatividade)`);
          break;
          
        case 'conversationchain':
          console.log('   💬 CHAIN DE CONVERSA: Gerencia o fluxo de conversação completo');
          console.log('   🔄 Mantém contexto entre mensagens');
          if (nodeData.inputs?.systemMessagePrompt) {
            console.log('   📝 Prompt do Sistema configurado');
          }
          break;
          
        case 'buffermemory':
          console.log('   🧠 MEMÓRIA: Armazena histórico de conversas');
          console.log('   💾 Permite que o bot lembre de mensagens anteriores');
          break;
          
        case 'prompttemplate':
          console.log('   📝 TEMPLATE: Define estrutura das prompts enviadas para IA');
          console.log('   🎨 Formata mensagens de entrada');
          break;
          
        case 'llmchain':
          console.log('   ⛓️  CHAIN LLM: Combina modelo de linguagem com prompt template');
          console.log('   🔗 Conecta prompt formatado com modelo de IA');
          break;
          
        case 'retriever':
        case 'vectorstore':
          console.log('   🔍 BUSCA: Recupera informações relevantes de documentos');
          console.log('   📚 Permite consulta em base de conhecimento');
          break;
          
        case 'document':
        case 'textloader':
          console.log('   📄 DOCUMENTO: Carrega e processa documentos de texto');
          console.log('   📖 Fonte de informações para o bot');
          break;
          
        default:
          if (nodeType.includes('agent')) {
            console.log('   🕵️ AGENTE: Sistema inteligente que toma decisões');
            console.log('   🎯 Pode usar ferramentas e executar ações');
          } else if (nodeType.includes('tool')) {
            console.log('   🔧 FERRAMENTA: Executa funções específicas');
            console.log('   ⚡ Ação externa controlada pelo agente');
          } else {
            console.log(`   ❓ TIPO: ${nodeType} - Funcionalidade específica`);
          }
      }
      
      console.log('─'.repeat(40));
    });
    
    // 4. Analisar conexões
    if (edges.length > 0) {
      console.log('\n🔗 CONEXÕES ENTRE NODES:');
      console.log('═'.repeat(50));
      
      edges.forEach((edge, index) => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
        console.log(`${index + 1}. ${sourceNode?.data?.label || edge.source}`);
        console.log(`   ↓ conecta com`);
        console.log(`   ${targetNode?.data?.label || edge.target}`);
        
        if (edge.sourceHandle) console.log(`   📤 Saída: ${edge.sourceHandle}`);
        if (edge.targetHandle) console.log(`   📥 Entrada: ${edge.targetHandle}`);
        console.log('');
      });
    }
    
    // 5. Fluxo de execução
    console.log('\n🌊 FLUXO DE EXECUÇÃO:');
    console.log('═'.repeat(50));
    
    const startNodes = nodes.filter(node => 
      edges.every(edge => edge.target !== node.id) || 
      node.data?.name?.toLowerCase().includes('trigger') ||
      node.data?.category?.toLowerCase().includes('trigger')
    );
    
    const endNodes = nodes.filter(node => 
      edges.every(edge => edge.source !== node.id) ||
      node.data?.name?.toLowerCase().includes('chain') ||
      node.data?.name?.toLowerCase().includes('agent')
    );
    
    console.log('🚀 Nodes Iniciais:');
    startNodes.forEach(node => {
      console.log(`   • ${node.data?.label || node.id} (${node.data?.name || 'tipo indefinido'})`);
    });
    
    console.log('🏁 Nodes Finais:');
    endNodes.forEach(node => {
      console.log(`   • ${node.data?.label || node.id} (${node.data?.name || 'tipo indefinido'})`);
    });
    
    // 6. Configuração do chatbot
    if (chatflow.chatbotConfig) {
      const botConfig = JSON.parse(chatflow.chatbotConfig);
      console.log('\n🤖 CONFIGURAÇÃO DO CHATBOT:');
      console.log('═'.repeat(50));
      console.log(`💬 Mensagem de Boas-vindas: "${botConfig.welcomeMessage || 'Não configurada'}"`);
      console.log(`🎨 Cor de Fundo: ${botConfig.backgroundColor || 'padrão'}`);
      console.log(`📝 Tamanho da Fonte: ${botConfig.fontSize || 'padrão'}`);
      
      if (botConfig.botMessage) {
        console.log(`🤖 Cor Bot: ${botConfig.botMessage.backgroundColor || 'padrão'}`);
      }
      if (botConfig.userMessage) {
        console.log(`👤 Cor Usuário: ${botConfig.userMessage.backgroundColor || 'padrão'}`);
      }
    }
    
    console.log('\n🎯 RESUMO FUNCIONAL:');
    console.log('═'.repeat(50));
    console.log(`Este chatflow "${chatflow.name}" é composto por ${nodes.length} nodes interconectados`);
    console.log('que trabalham juntos para criar um assistente conversacional.');
    console.log('Cada node tem uma função específica no processamento das mensagens,');
    console.log('desde a entrada do usuário até a geração da resposta final.');
    
    return {
      success: true,
      chatflowName: chatflow.name,
      totalNodes: nodes.length,
      totalEdges: edges.length,
      isDeployed: chatflow.deployed,
      nodes: nodes.map(n => ({
        id: n.id,
        label: n.data?.label,
        type: n.data?.name || n.data?.type,
        category: n.data?.category
      }))
    };
    
  } catch (error) {
    console.error('❌ Erro ao analisar chatflow:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

// Executar análise
analyzeChatflowNodes().then(result => {
  if (result.success) {
    console.log('\n✅ ANÁLISE COMPLETA FINALIZADA!');
    console.log(`Chatflow "${result.chatflowName}" analisado com sucesso.`);
    console.log(`${result.totalNodes} nodes e ${result.totalEdges} conexões identificados.`);
  } else {
    console.log('\n❌ Falha na análise:', result.error);
  }
}).catch(console.error);