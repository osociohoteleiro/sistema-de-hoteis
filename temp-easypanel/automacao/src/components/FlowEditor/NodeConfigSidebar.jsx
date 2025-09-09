import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const NodeConfigSidebar = ({ 
  isVisible, 
  nodeId, 
  nodeType, 
  nodeData, 
  onClose, 
  onSave 
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [selectedSubtype, setSelectedSubtype] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // Estados para ações
  const [actionType, setActionType] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [fieldValue, setFieldValue] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookMethod, setWebhookMethod] = useState('POST');
  const [webhookHeaders, setWebhookHeaders] = useState('');
  const [webhookBody, setWebhookBody] = useState('');
  const [sequenceName, setSequenceName] = useState('');
  const [httpUrl, setHttpUrl] = useState('');
  const [httpMethod, setHttpMethod] = useState('GET');
  const [httpHeaders, setHttpHeaders] = useState('');
  const [httpBody, setHttpBody] = useState('');

  // Resetar estados quando a sidebar for aberta
  useEffect(() => {
    if (isVisible) {
      setSelectedSubtype(null);
      setMessageText('');
      setSelectedTemplate('');
      
      // Reset action states
      setActionType('');
      setFieldName('');
      setFieldValue('');
      setWebhookUrl('');
      setWebhookMethod('POST');
      setWebhookHeaders('');
      setWebhookBody('');
      setSequenceName('');
      setHttpUrl('');
      setHttpMethod('GET');
      setHttpHeaders('');
      setHttpBody('');
    }
  }, [isVisible]);

  // Lista de templates disponíveis (mockup)
  const messageTemplates = [
    { id: 'welcome', name: 'Mensagem de Boas-vindas', content: 'Olá! Bem-vindo(a) ao nosso atendimento. Como posso ajudá-lo(a) hoje?' },
    { id: 'goodbye', name: 'Mensagem de Despedida', content: 'Obrigado(a) pelo contato! Tenha um ótimo dia!' },
    { id: 'business_hours', name: 'Horário de Funcionamento', content: 'Nosso horário de atendimento é de segunda a sexta, das 9h às 18h.' },
    { id: 'contact_info', name: 'Informações de Contato', content: 'Entre em contato conosco:\n📞 Telefone: (11) 1234-5678\n📧 Email: contato@empresa.com' }
  ];

  // Função para fechar com animação
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 400);
  };

  // Função para salvar as configurações
  const handleSave = () => {
    console.log('🎯 NodeConfigSidebar - handleSave chamado', { nodeType, selectedSubtype, actionType, nodeId });
    
    if (nodeType === 'Mensagem' && selectedSubtype) {
      let configData = {};
      
      if (selectedSubtype === 'text') {
        if (!messageText.trim()) {
          alert('Por favor, digite uma mensagem antes de salvar.');
          return;
        }
        configData = {
          type: 'text',
          content: messageText,
          label: 'Mensagem de Texto'
        };
        console.log('💬 Configuração de texto:', configData);
      } else if (selectedSubtype === 'template') {
        if (!selectedTemplate) {
          alert('Por favor, selecione um template antes de salvar.');
          return;
        }
        const templateData = messageTemplates.find(t => t.id === selectedTemplate);
        configData = {
          type: 'template',
          templateId: selectedTemplate,
          content: templateData.content,
          label: templateData.name
        };
        console.log('📋 Configuração de template:', configData);
      }
      
      // Chamar a função onSave passada pelo componente pai
      console.log('🔄 Chamando onSave com:', { nodeId, configData });
      if (onSave) {
        onSave(nodeId, configData);
      } else {
        console.error('❌ onSave não está definido!');
        handleClose();
      }
    } else if (nodeType === 'Ação' && actionType) {
      let configData = {};
      
      switch (actionType) {
        case 'set_field':
          if (!fieldName.trim() || !fieldValue.trim()) {
            alert('Por favor, preencha o nome e valor do campo.');
            return;
          }
          configData = {
            type: 'set_field',
            fieldName: fieldName,
            fieldValue: fieldValue,
            label: `Definir ${fieldName}`
          };
          break;
          
        case 'clear_field':
          if (!fieldName.trim()) {
            alert('Por favor, preencha o nome do campo.');
            return;
          }
          configData = {
            type: 'clear_field',
            fieldName: fieldName,
            label: `Limpar ${fieldName}`
          };
          break;
          
        case 'webhook':
          if (!webhookUrl.trim()) {
            alert('Por favor, preencha a URL do webhook.');
            return;
          }
          configData = {
            type: 'webhook',
            url: webhookUrl,
            method: webhookMethod,
            headers: webhookHeaders,
            body: webhookBody,
            label: 'Disparar Webhook'
          };
          break;
          
        case 'sequence':
          if (!sequenceName.trim()) {
            alert('Por favor, preencha o nome da sequência.');
            return;
          }
          configData = {
            type: 'sequence',
            sequenceName: sequenceName,
            label: `Cadastrar em ${sequenceName}`
          };
          break;
          
        case 'http_request':
          if (!httpUrl.trim()) {
            alert('Por favor, preencha a URL da requisição.');
            return;
          }
          configData = {
            type: 'http_request',
            url: httpUrl,
            method: httpMethod,
            headers: httpHeaders,
            body: httpBody,
            label: 'Requisição HTTP'
          };
          break;
          
        default:
          alert('Tipo de ação inválido.');
          return;
      }
      
      console.log('⚡ Configuração de ação:', configData);
      if (onSave) {
        onSave(nodeId, configData);
      } else {
        console.error('❌ onSave não está definido!');
        handleClose();
      }
    } else {
      console.log('❌ Condições não atendidas:', { nodeType, selectedSubtype, actionType });
      handleClose();
    }
  };

  // Função para renderizar o conteúdo específico do tipo de nó
  const renderNodeConfig = () => {
    if (nodeType === 'Mensagem') {
      // Se ainda não selecionou um subtipo, mostrar as opções
      if (!selectedSubtype) {
        return (
          <div className="message-subtype-selector">
            <div className="subtype-title">
              Selecione o tipo de mensagem:
            </div>
            
            <div className="subtype-options">
              <button
                className="subtype-option"
                onClick={() => setSelectedSubtype('text')}
              >
                <div className="subtype-icon">💬</div>
                <div className="subtype-info">
                  <div className="subtype-name">Mensagem</div>
                  <div className="subtype-description">Criar uma mensagem de texto personalizada</div>
                </div>
              </button>
              
              <button
                className="subtype-option"
                onClick={() => setSelectedSubtype('template')}
              >
                <div className="subtype-icon">📋</div>
                <div className="subtype-info">
                  <div className="subtype-name">Template</div>
                  <div className="subtype-description">Selecionar um template pré-definido</div>
                </div>
              </button>
            </div>
          </div>
        );
      }
      
      // Se selecionou mensagem de texto
      if (selectedSubtype === 'text') {
        return (
          <div className="message-text-config">
            <button
              className="back-button"
              onClick={() => setSelectedSubtype(null)}
            >
              ← Voltar
            </button>
            
            <div className="config-section">
              <label className="config-label">Texto da Mensagem:</label>
              <textarea
                className="config-textarea"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Digite a mensagem que será enviada..."
                rows="6"
              />
            </div>
          </div>
        );
      }
      
      // Se selecionou template
      if (selectedSubtype === 'template') {
        const selectedTemplateData = messageTemplates.find(t => t.id === selectedTemplate);
        
        return (
          <div className="message-template-config">
            <button
              className="back-button"
              onClick={() => setSelectedSubtype(null)}
            >
              ← Voltar
            </button>
            
            <div className="config-section">
              <label className="config-label">Selecione um Template:</label>
              <select
                className="config-select"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <option value="">Escolha um template...</option>
                {messageTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedTemplateData && (
              <div className="template-preview">
                <label className="config-label">Pré-visualização:</label>
                <div className="template-preview-content">
                  {selectedTemplateData.content}
                </div>
              </div>
            )}
          </div>
        );
      }
    }

    if (nodeType === 'Ação') {
      // Se ainda não selecionou um tipo de ação, mostrar as opções
      if (!actionType) {
        return (
          <div className="action-selector">
            <div className="subtype-title">
              Selecione o tipo de ação:
            </div>
            
            <div className="subtype-options">
              <button
                className="subtype-option"
                onClick={() => setActionType('set_field')}
              >
                <div className="subtype-icon">📝</div>
                <div className="subtype-info">
                  <div className="subtype-name">Definir Campo</div>
                  <div className="subtype-description">Definir ou alterar o valor de um campo do usuário</div>
                </div>
              </button>
              
              <button
                className="subtype-option"
                onClick={() => setActionType('clear_field')}
              >
                <div className="subtype-icon">🧹</div>
                <div className="subtype-info">
                  <div className="subtype-name">Limpar Campo</div>
                  <div className="subtype-description">Limpar o valor de um campo do usuário</div>
                </div>
              </button>
              
              <button
                className="subtype-option"
                onClick={() => setActionType('webhook')}
              >
                <div className="subtype-icon">🔗</div>
                <div className="subtype-info">
                  <div className="subtype-name">Disparar Webhook</div>
                  <div className="subtype-description">Enviar dados para um webhook externo</div>
                </div>
              </button>
              
              <button
                className="subtype-option"
                onClick={() => setActionType('sequence')}
              >
                <div className="subtype-icon">📋</div>
                <div className="subtype-info">
                  <div className="subtype-name">Cadastrar em Sequência</div>
                  <div className="subtype-description">Adicionar usuário a uma sequência de automação</div>
                </div>
              </button>
              
              <button
                className="subtype-option"
                onClick={() => setActionType('http_request')}
              >
                <div className="subtype-icon">🌐</div>
                <div className="subtype-info">
                  <div className="subtype-name">Requisição HTTP</div>
                  <div className="subtype-description">Fazer uma chamada HTTP para API externa</div>
                </div>
              </button>
            </div>
          </div>
        );
      }

      // Configurações específicas para cada tipo de ação
      if (actionType === 'set_field') {
        return (
          <div className="action-config">
            <button
              className="back-button"
              onClick={() => setActionType('')}
            >
              ← Voltar
            </button>
            
            <div className="config-section">
              <label className="config-label">Nome do Campo:</label>
              <input
                type="text"
                className="config-input"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="Ex: nome, email, telefone"
              />
            </div>
            
            <div className="config-section">
              <label className="config-label">Valor do Campo:</label>
              <input
                type="text"
                className="config-input"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                placeholder="Valor a ser definido"
              />
            </div>
          </div>
        );
      }

      if (actionType === 'clear_field') {
        return (
          <div className="action-config">
            <button
              className="back-button"
              onClick={() => setActionType('')}
            >
              ← Voltar
            </button>
            
            <div className="config-section">
              <label className="config-label">Nome do Campo:</label>
              <input
                type="text"
                className="config-input"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="Ex: nome, email, telefone"
              />
            </div>
          </div>
        );
      }

      if (actionType === 'webhook') {
        return (
          <div className="action-config">
            <button
              className="back-button"
              onClick={() => setActionType('')}
            >
              ← Voltar
            </button>
            
            <div className="config-section">
              <label className="config-label">URL do Webhook:</label>
              <input
                type="url"
                className="config-input"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://api.exemplo.com/webhook"
              />
            </div>
            
            <div className="config-section">
              <label className="config-label">Método HTTP:</label>
              <select
                className="config-select"
                value={webhookMethod}
                onChange={(e) => setWebhookMethod(e.target.value)}
              >
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            
            <div className="config-section">
              <label className="config-label">Headers (JSON):</label>
              <textarea
                className="config-textarea"
                value={webhookHeaders}
                onChange={(e) => setWebhookHeaders(e.target.value)}
                placeholder='{"Content-Type": "application/json"}'
                rows="3"
              />
            </div>
            
            <div className="config-section">
              <label className="config-label">Body (JSON):</label>
              <textarea
                className="config-textarea"
                value={webhookBody}
                onChange={(e) => setWebhookBody(e.target.value)}
                placeholder='{"campo": "valor"}'
                rows="4"
              />
            </div>
          </div>
        );
      }

      if (actionType === 'sequence') {
        return (
          <div className="action-config">
            <button
              className="back-button"
              onClick={() => setActionType('')}
            >
              ← Voltar
            </button>
            
            <div className="config-section">
              <label className="config-label">Nome da Sequência:</label>
              <input
                type="text"
                className="config-input"
                value={sequenceName}
                onChange={(e) => setSequenceName(e.target.value)}
                placeholder="Nome da sequência de automação"
              />
            </div>
          </div>
        );
      }

      if (actionType === 'http_request') {
        return (
          <div className="action-config">
            <button
              className="back-button"
              onClick={() => setActionType('')}
            >
              ← Voltar
            </button>
            
            <div className="config-section">
              <label className="config-label">URL da Requisição:</label>
              <input
                type="url"
                className="config-input"
                value={httpUrl}
                onChange={(e) => setHttpUrl(e.target.value)}
                placeholder="https://api.exemplo.com/endpoint"
              />
            </div>
            
            <div className="config-section">
              <label className="config-label">Método HTTP:</label>
              <select
                className="config-select"
                value={httpMethod}
                onChange={(e) => setHttpMethod(e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            
            <div className="config-section">
              <label className="config-label">Headers (JSON):</label>
              <textarea
                className="config-textarea"
                value={httpHeaders}
                onChange={(e) => setHttpHeaders(e.target.value)}
                placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
                rows="3"
              />
            </div>
            
            {httpMethod !== 'GET' && (
              <div className="config-section">
                <label className="config-label">Body (JSON):</label>
                <textarea
                  className="config-textarea"
                  value={httpBody}
                  onChange={(e) => setHttpBody(e.target.value)}
                  placeholder='{"campo": "valor"}'
                  rows="4"
                />
              </div>
            )}
          </div>
        );
      }
    }
    
    // Para outros tipos de nós, mostrar o placeholder original
    return (
      <div className="config-placeholder">
        <div className="config-placeholder-icon">
          {getNodeIcon(nodeType)}
        </div>
        <div>
          Configurações para o componente <strong>{nodeType}</strong> serão implementadas aqui.
        </div>
      </div>
    );
  };

  if (!isVisible || !nodeType) return null;

  return createPortal(
    <>
      <style>{`
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: 99998;
          animation: fadeIn 0.3s ease-in-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInFromRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        @keyframes slideOutToRight {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        .sidebar {
          position: fixed;
          top: 0;
          right: 0;
          width: 400px;
          height: 100vh;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
          backdrop-filter: blur(20px);
          border-left: 2px solid rgba(84, 122, 241, 0.2);
          box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
          z-index: 99999;
          display: flex;
          flex-direction: column;
          animation: ${isClosing ? 'slideOutToRight' : 'slideInFromRight'} 0.4s ease-out forwards;
        }

        .sidebar-overlay.closing {
          animation: fadeOut 0.3s ease-in-out forwards;
        }

        .sidebar-header {
          background: linear-gradient(145deg, #547af1 0%, #2d47d3 100%);
          color: white;
          padding: 20px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sidebar-title {
          font-size: 18px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sidebar-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: all 0.2s ease;
        }

        .sidebar-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        .sidebar-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .config-placeholder {
          text-align: center;
          color: #64748b;
          font-size: 14px;
          margin-top: 40px;
        }

        .config-placeholder-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .sidebar-footer {
          padding: 20px;
          border-top: 1px solid rgba(84, 122, 241, 0.2);
          background: rgba(248, 250, 252, 0.5);
        }

        .sidebar-actions {
          display: flex;
          gap: 12px;
        }

        .sidebar-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sidebar-btn-primary {
          background: linear-gradient(145deg, #547af1 0%, #2d47d3 100%);
          color: white;
        }

        .sidebar-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(84, 122, 241, 0.3);
        }

        .sidebar-btn-secondary {
          background: rgba(100, 116, 139, 0.1);
          color: #64748b;
          border: 1px solid rgba(100, 116, 139, 0.2);
        }

        .sidebar-btn-secondary:hover {
          background: rgba(100, 116, 139, 0.2);
        }

        /* Estilos para seleção de subtipo de mensagem */
        .message-subtype-selector {
          padding: 0;
        }

        .subtype-title {
          font-size: 16px;
          font-weight: 600;
          color: #2d47d3;
          margin-bottom: 20px;
          text-align: center;
        }

        .subtype-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .subtype-option {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.8);
          border: 2px solid rgba(84, 122, 241, 0.2);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .subtype-option:hover {
          background: rgba(84, 122, 241, 0.1);
          border-color: rgba(84, 122, 241, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(84, 122, 241, 0.2);
        }

        .subtype-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, rgba(84, 122, 241, 0.1) 0%, rgba(45, 71, 211, 0.1) 100%);
          border-radius: 50%;
          border: 2px solid rgba(84, 122, 241, 0.2);
        }

        .subtype-info {
          flex: 1;
        }

        .subtype-name {
          font-size: 16px;
          font-weight: 600;
          color: #2d47d3;
          margin-bottom: 4px;
        }

        .subtype-description {
          font-size: 13px;
          color: #64748b;
          line-height: 1.4;
        }

        /* Estilos para configuração específica */
        .message-text-config,
        .message-template-config {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .back-button {
          align-self: flex-start;
          background: rgba(100, 116, 139, 0.1);
          border: 1px solid rgba(100, 116, 139, 0.2);
          color: #64748b;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .back-button:hover {
          background: rgba(100, 116, 139, 0.2);
        }

        .config-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .config-label {
          font-size: 14px;
          font-weight: 600;
          color: #2d47d3;
        }

        .config-textarea {
          padding: 12px;
          border: 2px solid rgba(84, 122, 241, 0.2);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          color: #2d47d3;
          resize: vertical;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .config-textarea:focus {
          outline: none;
          border-color: rgba(84, 122, 241, 0.5);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 0 0 3px rgba(84, 122, 241, 0.1);
        }

        .config-select {
          padding: 12px;
          border: 2px solid rgba(84, 122, 241, 0.2);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          color: #2d47d3;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .config-select:focus {
          outline: none;
          border-color: rgba(84, 122, 241, 0.5);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 0 0 3px rgba(84, 122, 241, 0.1);
        }

        .template-preview {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .template-preview-content {
          padding: 16px;
          background: rgba(84, 122, 241, 0.05);
          border: 2px solid rgba(84, 122, 241, 0.1);
          border-radius: 8px;
          font-size: 14px;
          color: #2d47d3;
          line-height: 1.5;
          white-space: pre-line;
        }

        /* Estilos para configuração de ação */
        .action-selector,
        .action-config {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .config-input {
          padding: 12px;
          border: 2px solid rgba(84, 122, 241, 0.2);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          color: #2d47d3;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .config-input:focus {
          outline: none;
          border-color: rgba(84, 122, 241, 0.5);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 0 0 3px rgba(84, 122, 241, 0.1);
        }
      `}</style>

      <div className={`sidebar-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose} />
      
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">
            {getNodeIcon(nodeType)} Configurar {nodeType}
          </div>
          <button className="sidebar-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="sidebar-content">
          {renderNodeConfig()}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-actions">
            <button 
              className="sidebar-btn sidebar-btn-secondary"
              onClick={handleClose}
            >
              Cancelar
            </button>
            <button 
              className="sidebar-btn sidebar-btn-primary"
              onClick={() => {
                handleSave();
              }}
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

const getNodeIcon = (nodeType) => {
  const icons = {
    'Mensagem': '💬',
    'Pergunta': '❓',
    'Ação': '⚡',
    'Condição': '🔀',
    'Email': '📧',
    'Ir Para': '🔄',
  };
  return icons[nodeType] || '⚙️';
};

export default NodeConfigSidebar;