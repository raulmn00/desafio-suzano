import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './auth/LoginPage';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { AuditoriaPage } from './features/auditoria/pages/AuditoriaPage';
import { ClientesPage } from './features/clientes/pages/ClientesPage';
import { ItensPage } from './features/itens/pages/ItensPage';
import { AgendamentoPage } from './features/ordens-venda/pages/AgendamentoPage';
import { MonitoramentoPage } from './features/ordens-venda/pages/MonitoramentoPage';
import { OrdemDetailPage } from './features/ordens-venda/pages/OrdemDetailPage';
import { OrdensPage } from './features/ordens-venda/pages/OrdensPage';
import { TiposTransportePage } from './features/tipos-transporte/pages/TiposTransportePage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/ordens" replace />} />
          <Route path="/ordens" element={<OrdensPage />} />
          <Route path="/ordens/:id" element={<OrdemDetailPage />} />
          <Route path="/monitoramento" element={<MonitoramentoPage />} />
          <Route path="/agendamento" element={<AgendamentoPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/tipos-transporte" element={<TiposTransportePage />} />
          <Route path="/itens" element={<ItensPage />} />
          <Route path="/auditoria" element={<AuditoriaPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/ordens" replace />} />
    </Routes>
  );
}
