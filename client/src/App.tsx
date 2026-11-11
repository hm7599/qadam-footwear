import React, { useState, useEffect, lazy, Suspense } from 'react';
import { MotionConfig } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { CompareProvider } from './context/CompareContext';
import { CurrencyProvider } from './context/CurrencyContext';

import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { FlipToCartAnimation } from './components/cart/FlipToCartAnimation';
import { CartDrawer } from './components/cart/CartDrawer';
import { PushPromptModal } from './components/common/PushPromptModal';
import { ChatWidget } from './components/common/ChatWidget';
import { InstallAppBanner } from './components/common/InstallAppBanner';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { UpdatePrompt } from './components/common/UpdatePrompt';
import { applyPwaMode } from './utils/pwa';
import { CompareDrawer } from './components/common/CompareDrawer';
import { VisitorTracker } from './components/common/VisitorTracker';
import { applyMeta, ROUTE_META } from './utils/seo';

/** Default title/description per route; product pages set their own */
const RouteMeta: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname.startsWith('/product/')) return;
    applyMeta(ROUTE_META.find(r => r.match.test(pathname))?.meta || {});
  }, [pathname]);
  return null;
};

import { HomePage } from './pages/HomePage';
const ShopAllPage = lazy(() => import('./pages/ShopAllPage').then(m => ({ default: m.ShopAllPage })));
const MensCollectionPage = lazy(() => import('./pages/MensCollectionPage').then(m => ({ default: m.MensCollectionPage })));
const NewArrivalsPage = lazy(() => import('./pages/NewArrivalsPage').then(m => ({ default: m.NewArrivalsPage })));
const BestSellersPage = lazy(() => import('./pages/BestSellersPage').then(m => ({ default: m.BestSellersPage })));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage').then(m => ({ default: m.ProductDetailsPage })));
const CartPage = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then(m => ({ default: m.OrdersPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then(m => ({ default: m.WishlistPage })));
const ContactUsPage = lazy(() => import('./pages/ContactUsPage').then(m => ({ default: m.ContactUsPage })));
const SizeGuidePage = lazy(() => import('./pages/SizeGuidePage').then(m => ({ default: m.SizeGuidePage })));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage').then(m => ({ default: m.OrderTrackingPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsAndConditionsPage = lazy(() => import('./pages/TermsAndConditionsPage').then(m => ({ default: m.TermsAndConditionsPage })));
const RecoverCartPage = lazy(() => import('./pages/RecoverCartPage').then(m => ({ default: m.RecoverCartPage })));

const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage').then(m => ({ default: m.AdminOverviewPage })));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage').then(m => ({ default: m.AdminProductsPage })));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage').then(m => ({ default: m.AdminOrdersPage })));
const AdminNotificationsPage = lazy(() => import('./pages/admin/AdminNotificationsPage').then(m => ({ default: m.AdminNotificationsPage })));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminHeroPage = lazy(() => import('./pages/admin/AdminHeroPage').then(m => ({ default: m.AdminHeroPage })));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage').then(m => ({ default: m.AdminCategoriesPage })));
const AdminWhatsAppPage = lazy(() => import('./pages/admin/AdminWhatsAppPage').then(m => ({ default: m.AdminWhatsAppPage })));
const AdminChatPage = lazy(() => import('./pages/admin/AdminChatPage').then(m => ({ default: m.AdminChatPage })));
const AdminLivePage = lazy(() => import('./pages/admin/AdminLivePage').then(m => ({ default: m.AdminLivePage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));
const AdminBackupPage = lazy(() => import('./pages/admin/AdminBackupPage').then(m => ({ default: m.AdminBackupPage })));
const AdminSecurityPage = lazy(() => import('./pages/admin/AdminSecurityPage').then(m => ({ default: m.AdminSecurityPage })));
const AdminMarketingPage = lazy(() => import('./pages/admin/AdminMarketingPage').then(m => ({ default: m.AdminMarketingPage })));
import { AdminRoute } from './components/admin/AdminRoute';

import { api } from './utils/api';
import { Product } from './types';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import { useCart } from './context/CartContext';
import { DialogHost } from './components/common/Dialog';

// Opens the checkout modal, then settles the user on the cart page
const CheckoutModalRoute: React.FC = () => {
  const { setIsCheckoutOpen } = useCart();
  useEffect(() => {
    setIsCheckoutOpen(true);
  }, [setIsCheckoutOpen]);
  return <Navigate to="/cart" replace />;
};

// Scroll to top helper on route navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Layout Controller to show/hide Navbar and Footer on Admin routes
const LayoutShell: React.FC<{ products: Product[] }> = ({ products }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Switch between the customer app and the admin app manifest
  useEffect(() => { applyPwaMode(isAdminRoute); }, [isAdminRoute]);

  return (
    <>
      <ScrollToTop />
      {!isAdminRoute && <Navbar products={products} />}
      
      {/* Signature Flip-to-Cart Animation Floating Element */}
      <FlipToCartAnimation />
      
      {/* Common Overlays */}
      <CartDrawer />
      <Suspense fallback={null}><CheckoutPage modal /></Suspense>
      <VisitorTracker products={products} />
      <RouteMeta />
      <PushPromptModal />
      <CompareDrawer />
      {!isAdminRoute && <ChatWidget products={products} />}
      {!isAdminRoute && <InstallAppBanner />}
      <UpdatePrompt variant={isAdminRoute ? 'admin' : 'customer'} />

      <Suspense fallback={<div className="flex min-h-screen items-center justify-center" aria-busy="true"><span className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" /></div>}>
      <Routes>
        {/* Customer Pages */}
        <Route path="/" element={<HomePage products={products} />} />
        <Route path="/shop" element={<ShopAllPage products={products} />} />
        <Route path="/mens" element={<MensCollectionPage products={products} />} />
        <Route path="/womens" element={<Navigate to="/shop" replace />} />
        <Route path="/new-arrivals" element={<NewArrivalsPage products={products} />} />
        <Route path="/best-sellers" element={<BestSellersPage products={products} />} />
        <Route path="/product/:slug" element={<ProductDetailsPage products={products} />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutModalRoute />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/contact" element={<ContactUsPage />} />
        <Route path="/size-guide" element={<SizeGuidePage />} />
        <Route path="/track-order" element={<OrderTrackingPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsAndConditionsPage />} />
        <Route path="/recover-cart/:token" element={<RecoverCartPage />} />

        {/* Admin Portal */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <Routes>
                <Route path="" element={<AdminOverviewPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="notifications" element={<AdminNotificationsPage />} />
                <Route path="hero" element={<AdminHeroPage />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
                <Route path="whatsapp" element={<AdminWhatsAppPage />} />
                <Route path="live" element={<AdminLivePage />} />
                <Route path="chat" element={<AdminChatPage />} />
                <Route path="security" element={<AdminSecurityPage />} />
                <Route path="backups" element={<AdminBackupPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="settings/:tab" element={<AdminSettingsPage />} />
                <Route path="marketing" element={<AdminMarketingPage />} />
                <Route path="marketing/:tab" element={<AdminMarketingPage />} />
              </Routes>
            </AdminRoute>
          }
        />
      </Routes>
      </Suspense>

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <MobileBottomNav />}
    </>
  );
};

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  useEffect(() => {
    async function loadInitialProducts() {
      try {
        const list = await api.getProducts();
        setProducts(list);
      } catch (err) {
        console.warn('Failed to fetch initial products:', err);
      }
    }
    loadInitialProducts();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
    <Router>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <WishlistProvider>
              <CompareProvider>
                <NotificationProvider>
                  <LayoutShell products={products} />
                  <DialogHost />
                </NotificationProvider>
              </CompareProvider>
            </WishlistProvider>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </Router>
    </MotionConfig>
  );
}
