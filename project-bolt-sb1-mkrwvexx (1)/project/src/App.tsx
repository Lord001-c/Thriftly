import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ListingPage from './pages/ListingPage';
import SellPage from './pages/SellPage';
import SellerPage from './pages/SellerPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import SellerDashboardPage from './pages/seller/dashboard/page';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/listing/:id" element={<ProtectedRoute><ListingPage /></ProtectedRoute>} />
          <Route path="/sell" element={<ProtectedRoute><SellPage /></ProtectedRoute>} />
          <Route path="/seller/:id" element={<ProtectedRoute><SellerPage /></ProtectedRoute>} />
          <Route path="/seller/dashboard" element={<ProtectedRoute><SellerDashboardPage /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
