import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import Layout from './pages/Layout';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Customers from './pages/Customers';
import EmailTemplates from './pages/EmailTemplates';
import Enquiries from './pages/Enquiries';
import ReportingSettings from './pages/ReportingSettings';
import TemplateEditor from './pages/TemplateEditor';
import IptvPackages from './pages/IptvPackages';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Subscriptions from './pages/Subscriptions';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/templates" element={<EmailTemplates />} />
            <Route path="/templates/:id" element={<TemplateEditor />} />
            <Route path="/enquiries" element={<Enquiries />} />
            <Route path="/settings" element={<ReportingSettings />} />
            <Route path="/packages" element={<IptvPackages />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
