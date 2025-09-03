import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Reservas from './pages/Reservas';
import Calendario from './pages/Calendario';
import CalendarioFullCalendar from './pages/CalendarioFullCalendar';
import CheckIn from './pages/CheckIn';
import CheckOut from './pages/CheckOut';
import CalendarioEstilos from './pages/CalendarioEstilos';
import CalendarioGantt from './pages/CalendarioGantt';
import Hospedes from './pages/Hospedes';
import Quartos from './pages/Quartos';
import Tarifario from './pages/Tarifario';
import Financeiro from './pages/Financeiro';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'reservas', element: <Reservas /> },
      { path: 'calendario', element: <CalendarioFullCalendar /> },
      { path: 'calendario-antigo', element: <Calendario /> },
      { path: 'calendario-estilos', element: <CalendarioEstilos /> },
      { path: 'calendario-gantt', element: <CalendarioGantt /> },
      { path: 'checkin', element: <CheckIn /> },
      { path: 'checkout', element: <CheckOut /> },
      { path: 'hospedes', element: <Hospedes /> },
      { path: 'quartos', element: <Quartos /> },
      { path: 'tarifario', element: <Tarifario /> },
      { path: 'financeiro', element: <Financeiro /> },
      { path: 'relatorios', element: <Relatorios /> },
      { path: 'configuracoes', element: <Configuracoes /> },
    ],
  },
]);

export default router;