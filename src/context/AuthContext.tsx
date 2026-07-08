import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { Product } from '../config/products';

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
}

export interface OrderItem {
  id: number;
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

interface AuthContextType {
  user: User | null;
  users: User[];
  orders: Order[];
  products: Product[];
  tickets: SupportTicket[];
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (name: string, phone: string, address: string, city: string, zip: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string | number) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  addTicket: (message: string) => Promise<void>;
  resolveTicket: (ticketId: string) => Promise<void>;
  placeOrder: (order: Omit<Order, 'id' | 'date' | 'status'>) => Promise<Order>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

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
      setProducts(mappedProds);

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

  return (
    <AuthContext.Provider value={{
      user, users, orders, products, tickets,
      login, signup, logout, updateProfile,
      addProduct, updateProduct, deleteProduct,
      updateOrderStatus, addTicket, resolveTicket, placeOrder
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
