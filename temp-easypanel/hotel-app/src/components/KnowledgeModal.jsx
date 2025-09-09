import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

const KnowledgeModal = ({ isOpen, onClose, hotelUuid }) => {
  const { fetchKnowledgeData, updateKnowledgeData, loading } = useApp();
  const [knowledgeText, setKnowledgeText] = useState('');
  const [initialText, setInitialText] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Load knowledge data when modal opens
  useEffect(() => {
    if (isOpen && hotelUuid) {
      loadKnowledgeData();
    }
  }, [isOpen, hotelUuid]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isOpen && event.ctrlKey && event.key === 's') {
        event.preventDefault();
        if (hasChanges && !loading) {
          handleSave();
        }
      }
      if (isOpen && event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, hasChanges, loading]);

  // Track changes to enable/disable save button
  useEffect(() => {
    setHasChanges(knowledgeText !== initialText);
  }, [knowledgeText, initialText]);

  const loadKnowledgeData = async () => {
    try {
      console.log('🔄 Iniciando carregamento de conhecimento para hotel:', hotelUuid);
      const data = await fetchKnowledgeData(hotelUuid);
      console.log('=== DEBUGGING KNOWLEDGE DATA ===');
      console.log('1. Dados recebidos da API:', data);
      console.log('2. Tipo dos dados:', typeof data);
      console.log('3. É array?', Array.isArray(data));
      
      // Extrai apenas o conteúdo no formato pergunta/resposta/separador
      let formattedText = '';
      
      if (typeof data === 'string') {
        console.log('4. Dados são string direta');
        formattedText = data;
      } else if (data && typeof data === 'object') {
        console.log('5. Dados são objeto, explorando propriedades...');
        
        // Se for array, pega o primeiro item ou combina todos
        if (Array.isArray(data)) {
          console.log('6. Dados são array com', data.length, 'itens');
          if (data.length > 0) {
            const firstItem = data[0];
            console.log('7. Primeiro item do array:', firstItem);
            if (typeof firstItem === 'string') {
              formattedText = firstItem;
            } else if (firstItem && typeof firstItem === 'object') {
              formattedText = firstItem.knowledge || firstItem.text || firstItem.content || 
                            firstItem.data || firstItem.message || firstItem.response || 
                            firstItem.conteudo || '';
            }
          }
        } else {
          // Objeto simples
          console.log('8. Objeto simples, tentando extrair campos...');
          const possibleFields = ['knowledge', 'text', 'content', 'data', 'message', 'response', 'conteudo'];
          
          for (const field of possibleFields) {
            if (data[field]) {
              console.log(`9. Encontrado campo "${field}":`, data[field]);
              formattedText = data[field];
              break;
            }
          }
          
          // Se não encontrou em campos específicos, tenta todas as propriedades
          if (!formattedText) {
            console.log('10. Nenhum campo específico encontrado, listando todas as propriedades:');
            Object.keys(data).forEach(key => {
              console.log(`    - ${key}:`, data[key]);
            });
            
            // Pega o primeiro valor que seja string
            for (const key of Object.keys(data)) {
              if (typeof data[key] === 'string' && data[key].length > 0) {
                console.log(`11. Usando campo "${key}" como conteúdo`);
                formattedText = data[key];
                break;
              }
            }
          }
        }
      }
      
      console.log('12. Texto final extraído:', formattedText);
      
      // Remove quebras de linha extras e formata consistentemente
      if (formattedText) {
        formattedText = formattedText.trim();
      }
      
      console.log('13. Texto após limpeza:', formattedText);
      console.log('=== FIM DEBUG ===');
      
      setKnowledgeText(formattedText);
      setInitialText(formattedText);
    } catch (error) {
      console.error('Erro ao carregar conhecimento:', error);
      toast.error(`Erro ao carregar conhecimento: ${error.message}`);
      setKnowledgeText('');
      setInitialText('');
    }
  };

  const handleSave = async () => {
    if (!hotelUuid) {
      toast.error('Hotel UUID é obrigatório para salvar');
      return;
    }

    if (!knowledgeText.trim()) {
      toast.error('O conhecimento não pode estar vazio');
      return;
    }

    try {
      await updateKnowledgeData(hotelUuid, knowledgeText);
      setInitialText(knowledgeText);
      setHasChanges(false);
      toast.success('Conhecimento da IA atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar conhecimento:', error);
      if (error.message.includes('não configurado')) {
        toast.error('Endpoint de atualização não configurado. Configure em: Configurações → API Endpoints → Conhecimento IA');
      } else {
        toast.error(`Erro ao salvar conhecimento: ${error.message}`);
      }
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm(
        'Você tem alterações não salvas. Tem certeza que deseja fechar?'
      );
      if (!confirmClose) return;
    }
    
    setKnowledgeText('');
    setInitialText('');
    setHasChanges(false);
    onClose();
  };

  const handleTextChange = (e) => {
    setKnowledgeText(e.target.value);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999]">
      <div className="w-full h-full max-w-7xl max-h-full bg-sidebar-900 border border-white/20 shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-500/20 rounded-lg">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Configurar Conhecimento da IA</h2>
              <p className="text-sidebar-300 text-sm">
                Gerencie o conhecimento base que a IA utilizará para responder perguntas
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Status indicator */}
            <div className="flex items-center space-x-2">
              {loading && (
                <>
                  <svg className="w-4 h-4 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-blue-300 text-sm">Carregando...</span>
                </>
              )}
              
              {hasChanges && !loading && (
                <>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-yellow-300 text-sm">Alterações não salvas</span>
                </>
              )}
              
              {!hasChanges && !loading && (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-300 text-sm">Salvo</span>
                </>
              )}
            </div>
            
            <button
              onClick={handleClose}
              className="text-sidebar-400 hover:text-white transition-colors p-1"
              title="Fechar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex flex-col p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-white mb-2">
              Conhecimento Base da IA
            </label>
            <p className="text-sidebar-400 text-sm mb-4">
              Digite o conhecimento no formato <span className="text-white font-medium">Pergunta: / Resposta: / ++++</span>.
              Cada entrada deve ter uma pergunta, resposta e ser separada por <span className="text-white font-medium">++++</span>.
            </p>
          </div>

          {/* Textarea */}
          <div className="flex-1 flex flex-col">
            <textarea
              value={knowledgeText}
              onChange={handleTextChange}
              className="flex-1 w-full px-4 py-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm leading-relaxed"
              placeholder="Pergunta: Onde fica o hotel?
Resposta: Estamos na cidade do Rio de Janeiro

++++

Pergunta: O hotel tem Wifi?
Resposta: Sim, temos Wifi em todas as áreas do hotel.

++++

Pergunta: Qual o horário do check-in?
Resposta: O check-in é a partir das 14:00h

++++"
              disabled={loading}
            />
          </div>

          {/* Character count */}
          <div className="flex items-center justify-between mt-4 text-sm text-sidebar-400">
            <span>
              {knowledgeText.length.toLocaleString()} caracteres
            </span>
            <span>
              {knowledgeText.split(/\s+/).filter(word => word.length > 0).length.toLocaleString()} palavras
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10 bg-white/5">
          <div className="flex items-center space-x-4 text-sm text-sidebar-400">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Use Ctrl+S para salvar rapidamente</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="px-6 py-2 text-sidebar-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20"
              disabled={loading}
            >
              Cancelar
            </button>
            
            <button
              onClick={loadKnowledgeData}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              disabled={loading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Recarregar</span>
            </button>
            
            <button
              onClick={handleSave}
              className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 font-medium ${
                hasChanges && !loading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-600 cursor-not-allowed text-gray-300'
              }`}
              disabled={!hasChanges || loading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default KnowledgeModal;