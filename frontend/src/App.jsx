import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Projects from './pages/public/Projects';
import Hobbies from './pages/public/Hobbies';
import Contact from './pages/public/Contact';

// Admin Pages
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Overview from './pages/admin/Overview';
import GalleriesPage from './pages/admin/GalleriesPage';
import ResumePage from './pages/admin/ResumePage';
import ContactsPage from './pages/admin/ContactsPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import ProjectsPage from './pages/admin/ProjectsPage';

// Public Layout wrapper with Navbar and Footer
const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing Page - NO Navbar/Footer */}
          <Route path="/" element={<Home />} />

          {/* Public Routes with Layout */}
          <Route element={<PublicLayout />}>
            <Route path="/about" element={<About />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/hobbies" element={<Hobbies />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

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

          {/* 404 - Redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
