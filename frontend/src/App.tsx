import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './routes/LoginPage';
import { SignupPage } from './routes/SignupPage';
import { OverviewPage } from './routes/OverviewPage';
import { HostsListPage } from './routes/HostsListPage';
import { AddHostPage } from './routes/AddHostPage';
import { HostDetailPage } from './routes/HostDetailPage';
import { DomainsListPage } from './routes/DomainsListPage';
import { DomainDetailPage } from './routes/DomainDetailPage';
import { ServiceDetailPage } from './routes/ServiceDetailPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<OverviewPage />} />
        <Route path="/hosts" element={<HostsListPage />} />
        <Route path="/hosts/new" element={<AddHostPage />} />
        <Route path="/hosts/:id" element={<HostDetailPage />} />
        <Route path="/domains" element={<DomainsListPage />} />
        <Route path="/domains/:id" element={<DomainDetailPage />} />
        <Route path="/services/:id" element={<ServiceDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
