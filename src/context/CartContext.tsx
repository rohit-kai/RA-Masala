import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../config/products';
import { useAuth } from './AuthContext';
import axios from 'axios';

export interface CartItem {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number | string) => void;
  updateQuantity: (productId: number | string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from DB or localStorage on mount/user change
  useEffect(() => {
    const loadCart = async () => {
      if (user) {
        const userId = user.id || user._id;
        try {
          const res = await axios.get(`/api/cart/${userId}`);
          const dbItems = res.data.items || [];
          
          const mappedDbItems: CartItem[] = dbItems.map((item: any) => ({
            id: isNaN(Number(item.productId)) ? item.productId : Number(item.productId),
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          }));

          // Read guest items directly from localStorage to merge
          const storedCart = localStorage.getItem('ra_cart');
          const guestItems: CartItem[] = storedCart ? JSON.parse(storedCart) : [];
          
          const mergedItems = [...mappedDbItems];
          let hasNewGuestItems = false;

          for (const guestItem of guestItems) {
            const existingIdx = mergedItems.findIndex(item => String(item.id) === String(guestItem.id));
            if (existingIdx > -1) {
              if (mergedItems[existingIdx].quantity < guestItem.quantity) {
                mergedItems[existingIdx].quantity = guestItem.quantity;
                hasNewGuestItems = true;
              }
            } else {
              mergedItems.push(guestItem);
              hasNewGuestItems = true;
            }
          }

          setCartItems(mergedItems);
          localStorage.setItem('ra_cart', JSON.stringify(mergedItems));

          // If we added guest items to the DB cart, sync it back to DB
          if (hasNewGuestItems && guestItems.length > 0) {
            const dbPayload = mergedItems.map(item => ({
              productId: String(item.id),
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image
            }));
            await axios.post(`/api/cart/${userId}`, { items: dbPayload });
          }
        } catch (err) {
          console.error('Error fetching user cart from DB:', err);
        }
      } else {
        const storedCart = localStorage.getItem('ra_cart');
        if (storedCart) {
          setCartItems(JSON.parse(storedCart));
        } else {
          setCartItems([]);
        }
      }
    };

    loadCart();
  }, [user]);

  // Save cart to localStorage and DB on change
  const saveCart = async (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('ra_cart', JSON.stringify(items));

    if (user) {
      const userId = user.id || user._id;
      try {
        const dbPayload = items.map(item => ({
          productId: String(item.id),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        }));
        await axios.post(`/api/cart/${userId}`, { items: dbPayload });
      } catch (err) {
        console.error('Error syncing cart to database:', err);
      }
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    const existingIndex = cartItems.findIndex(item => String(item.id) === String(product.id));
    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += quantity;
      saveCart(updated);
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        image: product.image
      };
      saveCart([...cartItems, newItem]);
    }
  };

  const removeFromCart = (productId: number | string) => {
    const updated = cartItems.filter(item => String(item.id) !== String(productId));
    saveCart(updated);
  };

  const updateQuantity = (productId: number | string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updated = cartItems.map(item => 
      String(item.id) === String(productId) ? { ...item, quantity } : item
    );
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
