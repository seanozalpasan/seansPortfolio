import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Pages
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Overview from './pages/admin/Overview';
import GalleriesPage from './pages/admin/GalleriesPage';
import ResumePage from './pages/admin/ResumePage';
import ContactsPage from './pages/admin/ContactsPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import ProjectsPage from './pages/admin/ProjectsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Redirect root to admin */}
          <Route path="/" element={<Navigate to="/admin" replace />} />

          {/* Admin Login */}
          <Route path="/admin/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="galleries" element={<GalleriesPage />} />
            <Route path="resume" element={<ResumePage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
