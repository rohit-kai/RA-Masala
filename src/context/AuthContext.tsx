import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, INITIAL_PRODUCTS } from '../config/products';

export interface User {
  id: string;
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
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  date: string;
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
  customerName: string;
  customerEmail: string;
  message: string;
  date: string;
  status: 'Open' | 'Resolved';
}

interface AuthContextType {
  user: User | null;
  users: User[];
  orders: Order[];
  products: Product[];
  tickets: SupportTicket[];
  login: (email: string, password: string) => { success: boolean; message: string };
  signup: (name: string, email: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  updateProfile: (name: string, phone: string, address: string, city: string, zip: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: number) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  addTicket: (message: string) => void;
  resolveTicket: (ticketId: string) => void;
  placeOrder: (order: Omit<Order, 'id' | 'date' | 'status'>) => Order;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Load initial data
  useEffect(() => {
    // Products
    const storedProducts = localStorage.getItem('ra_products');
    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    } else {
      localStorage.setItem('ra_products', JSON.stringify(INITIAL_PRODUCTS));
      setProducts(INITIAL_PRODUCTS);
    }

    // Users
    const storedUsers = localStorage.getItem('ra_users');
    const defaultUsers: User[] = [
      { id: 'u1', name: 'Ramesh Patel', email: 'ramesh@gmail.com', role: 'customer', phone: '9876543210', address: '123, Spice Bazaar', city: 'Mumbai', zip: '400001' },
      { id: 'u2', name: 'Sunita Deshmukh', email: 'sunita@gmail.com', role: 'customer', phone: '9822334455', address: '45, Ghati Lane', city: 'Pune', zip: '411002' },
      { id: 'admin', name: 'RA Masala Admin', email: 'admin@ramasala.com', role: 'admin' }
    ];
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      localStorage.setItem('ra_users', JSON.stringify(defaultUsers));
      setUsers(defaultUsers);
    }

    // Current Session
    const currentSession = localStorage.getItem('ra_current_user');
    if (currentSession) {
      setUser(JSON.parse(currentSession));
    }

    // Orders
    const storedOrders = localStorage.getItem('ra_orders');
    const defaultOrders: Order[] = [
      {
        id: 'ORD-89472',
        customerId: 'u1',
        customerName: 'Ramesh Patel',
        customerEmail: 'ramesh@gmail.com',
        items: [
          { id: 1, name: 'Onion Garlic Masala', price: 80, quantity: 2, image: '' },
          { id: 2, name: 'Authentic Garam Masala', price: 120, quantity: 1, image: '' }
        ],
        subtotal: 280,
        tax: 14,
        shipping: 40,
        total: 334,
        date: '2026-07-02T14:30:00.000Z',
        status: 'Shipped',
        paymentMethod: 'UPI',
        shippingAddress: { name: 'Ramesh Patel', phone: '9876543210', address: '123, Spice Bazaar', city: 'Mumbai', zip: '400001' }
      },
      {
        id: 'ORD-90214',
        customerId: 'u2',
        customerName: 'Sunita Deshmukh',
        customerEmail: 'sunita@gmail.com',
        items: [
          { id: 5, name: 'Kolhapuri Ghati Masala', price: 90, quantity: 3, image: '' }
        ],
        subtotal: 270,
        tax: 13.5,
        shipping: 40,
        total: 323.5,
        date: '2026-07-05T09:15:00.000Z',
        status: 'Processing',
        paymentMethod: 'COD',
        shippingAddress: { name: 'Sunita Deshmukh', phone: '9822334455', address: '45, Ghati Lane', city: 'Pune', zip: '411002' }
      }
    ];
    if (storedOrders) {
      setOrders(JSON.parse(storedOrders));
    } else {
      localStorage.setItem('ra_orders', JSON.stringify(defaultOrders));
      setOrders(defaultOrders);
    }

    // Support tickets
    const storedTickets = localStorage.getItem('ra_tickets');
    const defaultTickets: SupportTicket[] = [
      { id: 'T-1', customerName: 'Ramesh Patel', customerEmail: 'ramesh@gmail.com', message: 'Do you deliver to Delhi? How long does it take?', date: '2026-07-03', status: 'Open' },
      { id: 'T-2', customerName: 'Sunita Deshmukh', customerEmail: 'sunita@gmail.com', message: 'Loving the Kolhapuri Ghati Masala! Will buy again.', date: '2026-07-05', status: 'Resolved' }
    ];
    if (storedTickets) {
      setTickets(JSON.parse(storedTickets));
    } else {
      localStorage.setItem('ra_tickets', JSON.stringify(defaultTickets));
      setTickets(defaultTickets);
    }
  }, []);

  const login = (email: string, password: string) => {
    // For simplicity, checking email. Admin password is admin123, user is user123 (or any for demo)
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!foundUser) {
      return { success: false, message: 'User not found' };
    }
    if (foundUser.role === 'admin' && password !== 'admin123') {
      return { success: false, message: 'Invalid Admin Password. Hint: admin123' };
    }
    // Set current user
    setUser(foundUser);
    localStorage.setItem('ra_current_user', JSON.stringify(foundUser));
    return { success: true, message: 'Logged in successfully' };
  };

  const signup = (name: string, email: string, password: string) => {
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return { success: false, message: 'Email already registered' };
    }
    const newUser: User = {
      id: 'u_' + Date.now(),
      name,
      email,
      role: 'customer'
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('ra_users', JSON.stringify(updatedUsers));
    setUser(newUser);
    localStorage.setItem('ra_current_user', JSON.stringify(newUser));
    return { success: true, message: 'Signed up successfully' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ra_current_user');
  };

  const updateProfile = (name: string, phone: string, address: string, city: string, zip: string) => {
    if (!user) return;
    const updatedUser = { ...user, name, phone, address, city, zip };
    setUser(updatedUser);
    localStorage.setItem('ra_current_user', JSON.stringify(updatedUser));

    const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
    setUsers(updatedUsers);
    localStorage.setItem('ra_users', JSON.stringify(updatedUsers));
  };

  const addProduct = (newProd: Omit<Product, 'id'>) => {
    const id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const item: Product = { ...newProd, id };
    const updated = [item, ...products];
    setProducts(updated);
    localStorage.setItem('ra_products', JSON.stringify(updated));
  };

  const updateProduct = (updatedProd: Product) => {
    const updated = products.map(p => p.id === updatedProd.id ? updatedProd : p);
    setProducts(updated);
    localStorage.setItem('ra_products', JSON.stringify(updated));
  };

  const deleteProduct = (id: number) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    localStorage.setItem('ra_products', JSON.stringify(updated));
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
    setOrders(updated);
    localStorage.setItem('ra_orders', JSON.stringify(updated));
  };

  const addTicket = (message: string) => {
    const ticket: SupportTicket = {
      id: 'T-' + (tickets.length + 1),
      customerName: user ? user.name : 'Guest User',
      customerEmail: user ? user.email : 'guest@ramasala.com',
      message,
      date: new Date().toISOString().split('T')[0],
      status: 'Open'
    };
    const updated = [ticket, ...tickets];
    setTickets(updated);
    localStorage.setItem('ra_tickets', JSON.stringify(updated));
  };

  const resolveTicket = (ticketId: string) => {
    const updated = tickets.map(t => t.id === ticketId ? { ...t, status: 'Resolved' as const } : t);
    setTickets(updated);
    localStorage.setItem('ra_tickets', JSON.stringify(updated));
  };

  const placeOrder = (orderData: Omit<Order, 'id' | 'date' | 'status'>) => {
    const newOrder: Order = {
      ...orderData,
      id: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
      date: new Date().toISOString(),
      status: 'Pending'
    };
    const updated = [newOrder, ...orders];
    setOrders(updated);
    localStorage.setItem('ra_orders', JSON.stringify(updated));

    // Deduct stock
    const updatedProducts = products.map(p => {
      const item = orderData.items.find(i => i.id === p.id);
      if (item) {
        return { ...p, stock: Math.max(0, p.stock - item.quantity) };
      }
      return p;
    });
    setProducts(updatedProducts);
    localStorage.setItem('ra_products', JSON.stringify(updatedProducts));

    return newOrder;
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
