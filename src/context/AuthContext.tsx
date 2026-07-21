import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { Product, INITIAL_PRODUCTS } from '../config/products';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
  isActive?: boolean;
}

export interface OrderItem {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  _id?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  date: string;
  createdAt?: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Cancelled';
  paymentMethod: string;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
  };
}

export interface SupportTicket {
  id: string;
  _id?: string;
  customerName: string;
  customerEmail: string;
  message: string;
  date?: string;
  createdAt?: string;
  status: 'Open' | 'Resolved';
}

export interface Payment {
  _id?: string;
  orderId: string;
  amount: number;
  method: string;
  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  transactionId?: string;
  createdAt?: string;
}

export interface Shipping {
  _id?: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  status: 'Order Placed' | 'In Transit' | 'Out for Delivery' | 'Delivered';
  createdAt?: string;
}

export interface Discount {
  _id?: string;
  code: string;
  discountType: 'percentage' | 'flat';
  value: number;
  minPurchase: number;
  active: boolean;
  expiryDate?: string;
}

export interface Review {
  _id?: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

export interface InventoryLog {
  _id?: string;
  productId: string;
  productName: string;
  changeType: 'sale' | 'restock' | 'correction';
  quantityChanged: number;
  newStock: number;
  createdAt?: string;
}

export interface SecurityLog {
  _id?: string;
  adminName: string;
  adminEmail: string;
  targetName: string;
  targetEmail: string;
  action: 'activated' | 'deactivated' | 'system_lockout';
  details: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  orders: Order[];
  products: Product[];
  tickets: SupportTicket[];
  payments: Payment[];
  shippingList: Shipping[];
  discounts: Discount[];
  reviews: Review[];
  inventoryLogs: InventoryLog[];
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (name: string, phone: string, address: string, city: string, zip: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string | number) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  addTicket: (message: string) => Promise<void>;
  resolveTicket: (ticketId: string) => Promise<void>;
  placeOrder: (order: Omit<Order, 'id' | 'date' | 'status'>) => Promise<Order>;
  updatePaymentStatus: (id: string, status: Payment['status']) => Promise<void>;
  updateShipping: (id: string, carrier: string, trackingNumber: string, status: Shipping['status']) => Promise<void>;
  addDiscount: (discount: Omit<Discount, '_id'>) => Promise<void>;
  updateDiscount: (discount: Discount) => Promise<void>;
  deleteDiscount: (id: string) => Promise<void>;
  addReview: (review: Omit<Review, '_id'>) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  toggleUserStatus: (userId: string, isActive: boolean) => Promise<void>;
  securityLogs: SecurityLog[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [shippingList, setShippingList] = useState<Shipping[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);

  // Fetch all databases from MongoDB on mount
  const loadData = async () => {
    try {
      // Products
      const prodRes = await axios.get('/api/products');
      // Map MongoDB _id string to numeric id or just store both for compatibility
      const mappedProds = prodRes.data.map((p: any) => ({
        ...p,
        id: p._id // Use MongoDB ObjectID string as id
      }));
      if (mappedProds && mappedProds.length > 0) {
        setProducts(mappedProds);
      } else {
        setProducts(INITIAL_PRODUCTS);
      }

      // Orders
      const orderRes = await axios.get('/api/orders');
      setOrders(orderRes.data);

      // Users
      const userRes = await axios.get('/api/users');
      const mappedUsers = userRes.data.map((u: any) => ({
        ...u,
        id: u._id
      }));
      setUsers(mappedUsers);

      // Tickets
      const ticketRes = await axios.get('/api/tickets');
      const mappedTickets = ticketRes.data.map((t: any) => ({
        ...t,
        id: t._id,
        date: new Date(t.createdAt).toISOString().split('T')[0]
      }));
      setTickets(mappedTickets);

      // Payments
      const payRes = await axios.get('/api/payments');
      setPayments(payRes.data);

      // Shipping
      const shipRes = await axios.get('/api/shipping');
      setShippingList(shipRes.data);

      // Discounts
      const discRes = await axios.get('/api/discounts');
      setDiscounts(discRes.data);

      // Reviews
      const revRes = await axios.get('/api/reviews');
      setReviews(revRes.data);

      // Inventory Logs
      const logRes = await axios.get('/api/inventory-logs');
      setInventoryLogs(logRes.data);

      // Security Logs
      const secRes = await axios.get('/api/security-logs');
      setSecurityLogs(secRes.data);
    } catch (error) {
      console.error('Error fetching MongoDB data:', error);
    }
  };

  useEffect(() => {
    loadData();

    // Session recovery
    const currentSession = localStorage.getItem('ra_current_user');
    if (currentSession) {
      setUser(JSON.parse(currentSession));
    }

    // Auto-update database contents (products, insertion, deletion) every 5 seconds
    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post('/api/users/login', { email, password });
      const loggedUser = {
        ...res.data,
        id: res.data._id
      };
      setUser(loggedUser);
      localStorage.setItem('ra_current_user', JSON.stringify(loggedUser));
      // Reload users list
      loadData();
      return { success: true, message: 'Logged in successfully' };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const res = await axios.post('/api/users/signup', { name, email, password });
      const loggedUser = {
        ...res.data,
        id: res.data._id
      };
      setUser(loggedUser);
      localStorage.setItem('ra_current_user', JSON.stringify(loggedUser));
      loadData();
      return { success: true, message: 'Signed up successfully' };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Signup failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ra_current_user');
    localStorage.removeItem('ra_cart');
    localStorage.removeItem('ra_wishlist');
  };

  const updateProfile = async (name: string, phone: string, address: string, city: string, zip: string) => {
    if (!user) return;
    try {
      const res = await axios.put('/api/users/profile', {
        id: user.id || user._id,
        name,
        phone,
        address,
        city,
        zip
      });
      const updatedUser = {
        ...res.data,
        id: res.data._id
      };
      setUser(updatedUser);
      localStorage.setItem('ra_current_user', JSON.stringify(updatedUser));
      loadData();
    } catch (error) {
      console.error('Error updating profile in MongoDB:', error);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return { success: false, message: 'User not logged in' };
    try {
      const res = await axios.put('/api/users/change-password', {
        id: user.id || user._id,
        currentPassword,
        newPassword
      });
      return { success: true, message: res.data.message };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Error updating password' };
    }
  };

  const addProduct = async (newProd: Omit<Product, 'id'>) => {
    try {
      await axios.post('/api/products', newProd);
      loadData();
    } catch (error) {
      console.error('Error adding product to MongoDB:', error);
    }
  };

  const updateProduct = async (updatedProd: Product) => {
    try {
      const dbId = updatedProd._id || updatedProd.id;
      await axios.put(`/api/products/${dbId}`, updatedProd);
      loadData();
    } catch (error) {
      console.error('Error updating product in MongoDB:', error);
    }
  };

  const deleteProduct = async (id: string | number) => {
    try {
      await axios.delete(`/api/products/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting product from MongoDB:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await axios.put(`/api/orders/${orderId}/status`, { status });
      loadData();
    } catch (error) {
      console.error('Error updating order status in MongoDB:', error);
    }
  };

  const addTicket = async (message: string) => {
    try {
      await axios.post('/api/tickets', {
        customerName: user ? user.name : 'Guest User',
        customerEmail: user ? user.email : 'guest@ramasala.com',
        message
      });
      loadData();
    } catch (error) {
      console.error('Error submitting support ticket:', error);
    }
  };

  const resolveTicket = async (ticketId: string) => {
    try {
      await axios.put(`/api/tickets/${ticketId}/resolve`);
      loadData();
    } catch (error) {
      console.error('Error resolving support ticket:', error);
    }
  };

  const placeOrder = async (orderData: Omit<Order, 'id' | 'date' | 'status'>) => {
    try {
      const res = await axios.post('/api/orders', orderData);
      loadData();
      return res.data;
    } catch (error) {
      console.error('Error placing order in MongoDB:', error);
      throw error;
    }
  };

  const updatePaymentStatus = async (id: string, status: Payment['status']) => {
    try {
      await axios.put(`/api/payments/${id}/status`, { status });
      loadData();
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const updateShipping = async (id: string, carrier: string, trackingNumber: string, status: Shipping['status']) => {
    try {
      await axios.put(`/api/shipping/${id}`, { carrier, trackingNumber, status });
      loadData();
    } catch (error) {
      console.error('Error updating shipping:', error);
    }
  };

  const addDiscount = async (discountData: Omit<Discount, '_id'>) => {
    try {
      await axios.post('/api/discounts', discountData);
      loadData();
    } catch (error) {
      console.error('Error adding discount:', error);
    }
  };

  const updateDiscount = async (discountData: Discount) => {
    try {
      await axios.put(`/api/discounts/${discountData._id}`, discountData);
      loadData();
    } catch (error) {
      console.error('Error updating discount:', error);
    }
  };

  const deleteDiscount = async (id: string) => {
    try {
      await axios.delete(`/api/discounts/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting discount:', error);
    }
  };

  const addReview = async (reviewData: Omit<Review, '_id'>) => {
    try {
      await axios.post('/api/reviews', reviewData);
      loadData();
    } catch (error) {
      console.error('Error adding review:', error);
    }
  };

  const deleteReview = async (id: string) => {
    try {
      await axios.delete(`/api/reviews/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await axios.put(`/api/users/${userId}/status`, {
        isActive,
        adminName: user ? user.name : 'System Administrator',
        adminEmail: user ? user.email : 'admin@ramasala.com'
      });
      loadData();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, users, orders, products, tickets,
      payments, shippingList, discounts, reviews, inventoryLogs,
      login, signup, logout, updateProfile, changePassword,
      addProduct, updateProduct, deleteProduct,
      updateOrderStatus, addTicket, resolveTicket, placeOrder,
      updatePaymentStatus, updateShipping, addDiscount, updateDiscount, deleteDiscount,
      addReview, deleteReview, toggleUserStatus, securityLogs
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
