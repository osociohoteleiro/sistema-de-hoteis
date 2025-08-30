import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Hotels from './pages/Hotels';
import EditHotel from './pages/EditHotel';
import Settings from './pages/Settings';
import AI from './pages/AI';
import AIConfiguracoes from './pages/AIConfiguracoes';
import TestUpload from './components/TestUpload';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="hoteis" element={<Hotels />} />
            <Route path="hoteis/editar/:hotelUuid" element={<EditHotel />} />
            <Route path="ia" element={<AI />} />
            <Route path="ia/configuracoes" element={<AIConfiguracoes />} />
            <Route path="configuracoes" element={<Settings />} />
            <Route path="teste-upload" element={<TestUpload />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App
