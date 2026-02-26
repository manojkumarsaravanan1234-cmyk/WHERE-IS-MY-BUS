import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import DriverMode from './pages/DriverMode';
import LiveView from './pages/LiveView';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import authAPI from './services/auth';

const AdminRoute = ({ children }) => {
    const isAuthenticated = authAPI.isAuthenticated();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    <Route path="/driver" element={<DriverMode />} />
                    <Route path="/track/:routeId" element={<LiveView />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

                {/* Cyber Decorative Element */}
                <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent pointer-events-none z-[100]"></div>
            </Router>
        </div>
    );
}

export default App;
