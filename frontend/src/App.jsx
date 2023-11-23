import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Event from './pages/Event';
import Checkout from './pages/Checkout';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';

function NavBar() {
  const { isLoggedIn, logout } = useAuth();
  return (
    <nav className="bg-[#dc3558] px-6 py-3 flex justify-between items-center">
      <a href="/" className="text-xl font-bold text-white">🎟️ SeatSniper</a>
      <div>
        {isLoggedIn ? (
          <button onClick={logout} className="px-4 py-1.5 border border-white text-white text-sm rounded hover:bg-white hover:text-[#dc3558] transition">Logout</button>
        ) : (
          <a href="/login" className="px-4 py-1.5 border border-white text-white text-sm rounded hover:bg-white hover:text-[#dc3558] transition">Sign In</a>
        )}
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <AuthProvider>
        <div className="min-h-screen bg-white text-gray-900">
          <NavBar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Home />} />
            <Route path="/event/:eventId" element={<Event />} />
            <Route path="/checkout/:bookingId" element={
              <ProtectedRoute><Checkout /></ProtectedRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}