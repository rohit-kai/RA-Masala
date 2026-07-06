import { Route, Routes } from "react-router-dom"
import Home from "./views/Home"
import Welcome from "./views/Welcome"
import OurStory from "./views/OurStory"
import Brands from "./views/Brands"
import RoutePaths from "./config"

// Auth & Cart Contexts
import { AuthProvider } from "./context/AuthContext"
import { CartProvider } from "./context/CartContext"

// E-commerce Views
import Cart from "./views/shop/Cart"
import Checkout from "./views/shop/Checkout"
import Invoice from "./views/shop/Invoice"

// User & Auth Views
import Login from "./views/auth/Login"
import Signup from "./views/auth/Signup"
import MyAccount from "./views/user/MyAccount"

// Admin Views
import AdminDashboard from "./views/admin/AdminDashboard"
import AdminProducts from "./views/admin/AdminProducts"
import AdminCustomers from "./views/admin/AdminCustomers"

function App() {

  return (
    <AuthProvider>
      <CartProvider>
        <Routes>

          <Route path={RoutePaths.welcome} element={<Welcome />}></Route>
          <Route path={RoutePaths.home} element={<Home />}></Route>
          <Route path={RoutePaths.ourstory} element={<OurStory />}></Route>
          <Route path={RoutePaths.brands} element={<Brands />}></Route>

          {/* E-commerce Routes */}
          <Route path={RoutePaths.cart} element={<Cart />}></Route>
          <Route path={RoutePaths.checkout} element={<Checkout />}></Route>
          <Route path="/invoice/:orderId" element={<Invoice />}></Route>

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
      </CartProvider>
    </AuthProvider>
  )
}

export default App
