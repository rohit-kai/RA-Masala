import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import Swal from 'sweetalert2';

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  image: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (product: any) => Promise<void>;
  removeFromWishlist: (productId: string | number) => Promise<void>;
  isInWishlist: (productId: string | number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  // Load wishlist from DB or localStorage
  useEffect(() => {
    const loadWishlist = async () => {
      if (user) {
        const userId = user.id || user._id;
        try {
          const res = await axios.get(`/api/wishlist/${userId}`);
          const dbItems = res.data.items || [];
          
          // Read guest wishlist items from localStorage to merge
          const storedWishlist = localStorage.getItem('ra_wishlist');
          const guestItems: WishlistItem[] = storedWishlist ? JSON.parse(storedWishlist) : [];

          const mergedItems = [...dbItems];
          let hasNewGuestItems = false;

          for (const guestItem of guestItems) {
            const exists = mergedItems.some(item => String(item.productId) === String(guestItem.productId));
            if (!exists) {
              mergedItems.push(guestItem);
              hasNewGuestItems = true;
            }
          }

          setWishlistItems(mergedItems);
          localStorage.setItem('ra_wishlist', JSON.stringify(mergedItems));

          // Sync merged guest items back to DB
          if (hasNewGuestItems && guestItems.length > 0) {
            for (const item of guestItems) {
              await axios.post(`/api/wishlist/${userId}/add`, item);
            }
          }
        } catch (err) {
          console.error('Error fetching wishlist from DB:', err);
        }
      } else {
        const storedWishlist = localStorage.getItem('ra_wishlist');
        if (storedWishlist) {
          setWishlistItems(JSON.parse(storedWishlist));
        } else {
          setWishlistItems([]);
        }
      }
    };

    loadWishlist();
  }, [user]);

  const addToWishlist = async (product: any) => {
    const productId = String(product._id || product.id);
    const exists = wishlistItems.some(item => String(item.productId) === productId);
    
    if (exists) {
      Swal.fire({
        icon: 'info',
        title: 'Already in Wishlist',
        text: `${product.name} is already in your wishlist!`,
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    const newItem: WishlistItem = {
      productId,
      name: product.name,
      price: product.price,
      image: product.image
    };

    const updated = [...wishlistItems, newItem];
    setWishlistItems(updated);
    localStorage.setItem('ra_wishlist', JSON.stringify(updated));

    if (user) {
      const userId = user.id || user._id;
      try {
        await axios.post(`/api/wishlist/${userId}/add`, newItem);
      } catch (err) {
        console.error('Error adding to DB wishlist:', err);
      }
    }

    Swal.fire({
      icon: 'success',
      title: 'Added to Wishlist',
      text: `${product.name} has been added to your wishlist.`,
      timer: 1500,
      showConfirmButton: false
    });
  };

  const removeFromWishlist = async (productId: string | number) => {
    const updated = wishlistItems.filter(item => String(item.productId) !== String(productId));
    setWishlistItems(updated);
    localStorage.setItem('ra_wishlist', JSON.stringify(updated));

    if (user) {
      const userId = user.id || user._id;
      try {
        await axios.delete(`/api/wishlist/${userId}/remove/${productId}`);
      } catch (err) {
        console.error('Error removing from DB wishlist:', err);
      }
    }

    Swal.fire({
      icon: 'success',
      title: 'Removed',
      text: 'Item removed from your wishlist.',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const isInWishlist = (productId: string | number) => {
    return wishlistItems.some(item => String(item.productId) === String(productId));
  };

  return (
    <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};
