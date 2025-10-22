import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export const useCart = () => {
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCartCount(data.count);
      }
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
    }
  };

  const addToCart = async (courseId) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ courseId })
      });
      const data = await response.json();
      
      if (data.success) {
        setCartCount(prev => prev + 1);
        toast.success('Course added to cart');
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      toast.error('Failed to add to cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (courseId) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cart/remove/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setCartCount(prev => Math.max(0, prev - 1));
        toast.success('Course removed from cart');
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      toast.error('Failed to remove from cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, []);

  return {
    cartCount,
    addToCart,
    removeFromCart,
    refreshCart: fetchCartCount,
    loading
  };
};