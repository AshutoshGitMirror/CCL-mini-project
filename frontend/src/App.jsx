import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, homeFor, useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import RecruiterDashboard from './pages/RecruiterDashboard.jsx';
import OfficerDashboard from './pages/OfficerDashboard.jsx';
import TalentPool from './pages/TalentPool.jsx';
import Analytics from './pages/Analytics.jsx';

function Protected({ roles, children }) {
  const { isAuthed, user } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout><Landing /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/register" element={<Layout><Register /></Layout>} />

        <Route path="/student" element={<Layout><Protected roles={['STUDENT']}><StudentDashboard /></Protected></Layout>} />
        <Route path="/recruiter" element={<Layout><Protected roles={['RECRUITER', 'OFFICER']}><RecruiterDashboard /></Protected></Layout>} />
        <Route path="/officer" element={<Layout><Protected roles={['OFFICER']}><OfficerDashboard /></Protected></Layout>} />
        <Route path="/talent-pool" element={<Layout><Protected roles={['RECRUITER', 'OFFICER']}><TalentPool /></Protected></Layout>} />
        <Route path="/analytics" element={<Layout><Protected roles={['RECRUITER', 'OFFICER']}><Analytics /></Protected></Layout>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
