import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { WishlistProvider } from './lib/wishlist';
import ProtectedRoute from './components/ProtectedRoute';
import BuyerLayout from './layouts/BuyerLayout';
import SellerLayout from './layouts/SellerLayout';

// Buyer pages
import HomePage from './pages/HomePage';
import ListingPage from './pages/ListingPage';
import SellPage from './pages/SellPage';
import SellerPage from './pages/SellerPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import WishlistPage from './pages/WishlistPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import OrderDetailPage from './pages/orders/[id]/page';
import ConfirmDeliveryPage from './pages/ConfirmDeliveryPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
// Admin pages
import AdminPayoutsPage from './pages/admin/PayoutsPage';
// Seller pages
import SellerDashboardPage from './pages/seller/dashboard/page';
import SellerListingsPage from './pages/seller/listings/page';
import SellerOrdersPage from './pages/seller/orders/page';
import SellerPayoutsPage from './pages/seller/payouts/page';
import SellerProfilePage from './pages/seller/profile/page';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WishlistProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/confirm/:orderId" element={<ConfirmDeliveryPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Buyer routes — buyer navbar */}
            <Route element={<BuyerLayout />}>
              <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/listing/:id" element={<ProtectedRoute><ListingPage /></ProtectedRoute>} />
              <Route path="/sell" element={<ProtectedRoute><SellPage /></ProtectedRoute>} />
              <Route path="/seller/:id" element={<ProtectedRoute><SellerPage /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            </Route>

            {/* Seller routes — seller sidebar */}
            <Route element={<SellerLayout />}>
              <Route path="/seller/dashboard" element={<ProtectedRoute><SellerDashboardPage /></ProtectedRoute>} />
              <Route path="/seller/listings" element={<ProtectedRoute><SellerListingsPage /></ProtectedRoute>} />
              <Route path="/seller/orders" element={<ProtectedRoute><SellerOrdersPage /></ProtectedRoute>} />
              <Route path="/seller/payouts" element={<ProtectedRoute><SellerPayoutsPage /></ProtectedRoute>} />
              <Route path="/seller/profile" element={<ProtectedRoute><SellerProfilePage /></ProtectedRoute>} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin/payouts" element={<AdminPayoutsPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
