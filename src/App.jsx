import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import HukumDashboard from './pages/HukumDashboard';
import SethjiDashboard from './pages/SethjiDashboard';
import FamilyDashboard from './pages/FamilyDashboard';
import ProfilePage from './pages/ProfilePage';
import RequestedItems from './pages/RequestedItems';
import AnalyticsPage from './pages/AnalyticsPage';
import NotificationToast from './components/NotificationToast';

function PrivateRoute({ children, allowedRoles }) {
  const { currentUser, userRole } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If roles are specified and user role is not in the array, redirect to default
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" />;
  }

  return children;
}

function MainRouting() {
  const { currentUser, userRole } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (userRole === 'Admin') return <AdminDashboard />;
  if (userRole === 'Hukum') return <HukumDashboard />;
  if (userRole === 'Sethji') return <SethjiDashboard />;
  
  return <div>Loading role...</div>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <NotificationToast />
        <div className="app-container">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<MainRouting />} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            {/* Direct routes for direct access if needed */}
            <Route path="/admin" element={<PrivateRoute allowedRoles={['Admin']}><AdminDashboard /></PrivateRoute>} />
            <Route path="/family" element={<PrivateRoute allowedRoles={['Admin']}><FamilyDashboard /></PrivateRoute>} />
            <Route path="/requests" element={<PrivateRoute allowedRoles={['Admin']}><RequestedItems /></PrivateRoute>} />
            <Route path="/hukum" element={<PrivateRoute allowedRoles={['Hukum']}><HukumDashboard /></PrivateRoute>} />
            <Route path="/sethji" element={<PrivateRoute allowedRoles={['Sethji']}><SethjiDashboard /></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
