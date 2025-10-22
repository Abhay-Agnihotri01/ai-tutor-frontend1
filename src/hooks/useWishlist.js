import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export const useWishlist = () => {
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchWishlistCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setWishlistCount(data.count);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist count:', error);
    }
  };

  const addToWishlist = async (courseId) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wishlist/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ courseId })
      });
      const data = await response.json();
      
      if (data.success) {
        setWishlistCount(prev => prev + 1);
        toast.success('Course added to wishlist');
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      toast.error('Failed to add to wishlist');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (courseId) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wishlist/remove/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setWishlistCount(prev => Math.max(0, prev - 1));
        toast.success('Course removed from wishlist');
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      toast.error('Failed to remove from wishlist');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkWishlistStatus = async (courseId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wishlist/status/${courseId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      return data.success ? data.inWishlist : false;
    } catch (error) {
      console.error('Failed to check wishlist status:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchWishlistCount();
  }, []);

  return {
    wishlistCount,
    addToWishlist,
    removeFromWishlist,
    checkWishlistStatus,
    refreshWishlist: fetchWishlistCount,
    loading
  };
};