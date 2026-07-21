import { Route, Routes } from "react-router-dom"
import Home from "./views/Home"
import Welcome from "./views/Welcome"
import OurStory from "./views/OurStory"
import Brands from "./views/Brands"
import Recipes from "./views/Recipes"
import BreakfastRecipes from "./views/recipescate/BreakfastRecipes"
import DessertRecipes from "./views/recipescate/DessertRecipes"
import DinnerRecipes from "./views/recipescate/DinnerRecipes"
import FestiveRecipes from "./views/recipescate/FestiveRecipes"
import LunchRecipes from "./views/recipescate/LunchRecipes"
import ReadyMixRecipes from "./views/recipescate/ReadyMixRecipes"
import RoutePaths from "./config"
import Contact from "./views/Contact"

// Auth, Cart & Wishlist Contexts
import { AuthProvider } from "./context/AuthContext"
import { CartProvider } from "./context/CartContext"
import { WishlistProvider } from "./context/WishlistContext"

// E-commerce Views
import Cart from "./views/shop/Cart"
import Checkout from "./views/shop/Checkout"
import Invoice from "./views/shop/Invoice"
import Wishlist from "./views/shop/Wishlist"
import ProductDetail from "./views/shop/ProductDetail"
import Shop from "./views/shop/Shop"

// User & Auth Views
import Login from "./views/auth/Login"
import Signup from "./views/auth/Signup"
import MyAccount from "./views/user/MyAccount"

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from "./context/AuthContext"

// Admin Views
import AdminDashboard from "./views/admin/AdminDashboard"
import AdminProducts from "./views/admin/AdminProducts"
import AdminCustomers from "./views/admin/AdminCustomers"

function AppContent() {
  const { user } = useAuth();
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await axios.get('/api/maintenance/status');
        setIsMaintenance(res.data.isMaintenanceMode);
      } catch (err) {
        console.error('Error checking maintenance mode:', err);
      }
    };
    checkMaintenance();
    // Check status every 5 seconds for real-time responsiveness
    const interval = setInterval(checkMaintenance, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isMaintenance && user?.role !== 'admin') {
    return (
      <Routes>
        <Route path="*" element={<Login isMaintenanceMode={true} />}></Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path={RoutePaths.welcome} element={<Welcome />}></Route>
      <Route path={RoutePaths.home} element={<Home />}></Route>
      <Route path={RoutePaths.ourstory} element={<OurStory />}></Route>
      <Route path={RoutePaths.brands} element={<Brands />}></Route>
      <Route path={RoutePaths.contact} element={<Contact />}></Route>
      <Route path={RoutePaths.recipes} element={<Recipes />}></Route>
      <Route path={RoutePaths.breakfastRecipes} element={<BreakfastRecipes />}></Route>
      <Route path={RoutePaths.dessertRecipes} element={<DessertRecipes />}></Route>
      <Route path={RoutePaths.dinnerRecipes} element={<DinnerRecipes />}></Route>
      <Route path={RoutePaths.festiveRecipes} element={<FestiveRecipes />}></Route>
      <Route path={RoutePaths.lunchRecipes} element={<LunchRecipes />}></Route>
      <Route path={RoutePaths.readyMixRecipes} element={<ReadyMixRecipes />}></Route>

      {/* E-commerce Routes */}
      <Route path={RoutePaths.cart} element={<Cart />}></Route>
      <Route path={RoutePaths.checkout} element={<Checkout />}></Route>
      <Route path="/invoice/:orderId" element={<Invoice />}></Route>
      <Route path={RoutePaths.wishlist} element={<Wishlist />}></Route>
      <Route path={RoutePaths.productView} element={<ProductDetail />}></Route>
      <Route path={RoutePaths.shop} element={<Shop />}></Route>

      {/* User Routes */}
      <Route path={RoutePaths.login} element={<Login />}></Route>
      <Route path={RoutePaths.signup} element={<Signup />}></Route>
      <Route path={RoutePaths.userAccount} element={<MyAccount />}></Route>

      {/* Admin Routes */}
      <Route path={RoutePaths.admin} element={<AdminDashboard />}></Route>
      <Route path={RoutePaths.adminProducts} element={<AdminProducts />}></Route>
      <Route path={RoutePaths.adminCustomers} element={<AdminCustomers />}></Route>

      <Route path="*" element={<Welcome />}></Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <AppContent />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App;
