import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Workspaces from './pages/Workspaces';
import WorkspaceBots from './pages/WorkspaceBots';
import WorkspaceChatAoVivo from './pages/WorkspaceChatAoVivo';
import WorkspaceSettings from './pages/WorkspaceSettings';
import BotFlows from './pages/BotFlows';
import WhatsAppCloud from './pages/WhatsAppCloudOAuth';
import WhatsAppOAuthCallback from './pages/WhatsAppOAuthCallback';
import WhatsAppApp from './pages/WhatsAppApp';
import FlowiseManagement from './pages/FlowiseManagement';

const Settings = () => (
  <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-8 shadow-blue-elegant">
    <h2 className="text-2xl font-bold text-midnight-950 mb-4">Configurações</h2>
    <p className="text-steel-700 text-base">Configurações do sistema em desenvolvimento. Personalize preferências e parâmetros do sistema.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Rotas principais dentro do Layout */}
        <Route path="/" element={<Layout />}>
          {/* Redirecionar root para dashboard */}
          <Route index element={<Dashboard />} />
          
          {/* Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* Workspaces */}
          <Route path="workspaces" element={<Workspaces />} />

          {/* Workspace Chat ao Vivo (rota padrão do workspace) */}
          <Route path="workspace/:workspaceUuid/chat-ao-vivo" element={<WorkspaceChatAoVivo />} />

          {/* Workspace Bots */}
          <Route path="workspace/:workspaceUuid/bots" element={<WorkspaceBots />} />

          {/* Workspace Settings */}
          <Route path="workspace/:workspaceUuid/settings" element={<WorkspaceSettings />} />

          {/* Bot Flows */}
          <Route path="bot/:botUuid/flows" element={<BotFlows />} />

          {/* WhatsApp Cloud API */}
          <Route path="workspace/:workspaceUuid/whatsapp-cloud" element={<WhatsAppCloud />} />

          {/* WhatsApp App (Evolution API) */}
          <Route path="workspace/:workspaceUuid/whatsapp-app" element={<WhatsAppApp />} />

          {/* Direct WhatsApp route (mantido para compatibilidade) */}
          <Route path="whatsapp" element={<WhatsAppApp />} />

          {/* Redirecionamento de workspace para chat-ao-vivo */}
          <Route path="workspace/:workspaceUuid" element={<Navigate to="chat-ao-vivo" replace />} />

          {/* Flowise Management */}
          <Route path="flowise" element={<FlowiseManagement />} />

          {/* Configurações */}
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Rota de callback OAuth do WhatsApp (fora do Layout) */}
        <Route path="whatsapp-oauth-callback" element={<WhatsAppOAuthCallback />} />

        {/* Rota 404 para páginas não encontradas */}
        <Route path="*" element={
          <div className="min-h-screen bg-gradient-blue-depth flex items-center justify-center p-8">
            <div className="text-center bg-gradient-card-blue backdrop-blur-md p-10 rounded-2xl border border-sapphire-200/40 shadow-blue-elegant max-w-md">
              <div className="text-6xl mb-6">🔍</div>
              <h2 className="text-2xl font-bold text-midnight-950 mb-4">Página não encontrada</h2>
              <p className="text-steel-700 mb-8 text-base leading-relaxed">A página que você está procurando não existe ou foi movida.</p>
              <button 
                onClick={() => window.history.back()} 
                className="bg-gradient-sapphire hover:bg-midnight-700 text-white text-sm font-medium px-6 py-3 rounded-lg transition-minimal shadow-sapphire-glow hover:shadow-blue-soft"
              >
                Voltar ao Sistema
              </button>
            </div>
          </div>
        } />
      </Routes>
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'linear-gradient(145deg, rgba(240, 244, 255, 0.95) 0%, rgba(225, 234, 254, 0.85) 100%)',
            color: '#191e51',
            border: '1px solid rgba(84, 122, 241, 0.3)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 16px rgba(45, 71, 211, 0.1)'
          },
          success: {
            iconTheme: {
              primary: '#547af1',
              secondary: '#FFFFFF'
            }
          },
          error: {
            iconTheme: {
              primary: '#2d47d3',
              secondary: '#FFFFFF'
            }
          }
        }}
      />
    </Router>
  );
}

export default App