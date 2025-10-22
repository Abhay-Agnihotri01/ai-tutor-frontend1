import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft, Star, Play, Clock, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../components/common/Button';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setWishlist(data.wishlist);
      }
    } catch (error) {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (courseId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wishlist/remove/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setWishlist(prev => prev.filter(item => item.courses.id !== courseId));
        toast.success('Course removed from wishlist');
      }
    } catch (error) {
      toast.error('Failed to remove course');
    }
  };

  const addToCart = async (courseId) => {
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
        toast.success('Course added to cart');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const moveToCart = async (courseId) => {
    try {
      await addToCart(courseId);
      await removeFromWishlist(courseId);
      toast.success('Course moved to cart');
    } catch (error) {
      toast.error('Failed to move to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 hover:theme-bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 theme-text-primary" />
          </button>
          <div>
            <h1 className="text-3xl font-bold theme-text-primary flex items-center">
              <Heart className="w-8 h-8 mr-3 text-red-500" />
              My Wishlist
            </h1>
            <p className="theme-text-secondary">{wishlist.length} course{wishlist.length !== 1 ? 's' : ''} saved for later</p>
          </div>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-24 h-24 theme-text-muted mx-auto mb-6" />
            <h2 className="text-2xl font-semibold theme-text-primary mb-4">Your wishlist is empty</h2>
            <p className="theme-text-secondary mb-8">Save courses you're interested in and come back to them later</p>
            <Link to="/courses">
              <Button>Explore Courses</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <div key={item.id} className="theme-card rounded-lg overflow-hidden border theme-border hover:shadow-lg transition-all duration-300 group">
                {/* Course Image */}
                <div className="relative">
                  <img
                    src={item.courses.thumbnail ? (item.courses.thumbnail.startsWith('http') ? item.courses.thumbnail : `http://localhost:5000${item.courses.thumbnail}`) : `data:image/svg+xml;base64,${btoa(`<svg width="400" height="225" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#6366f1"/><text x="50%" y="50%" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dy=".3em">Course</text></svg>`)}`}
                    alt={item.courses.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = `data:image/svg+xml;base64,${btoa(`<svg width="400" height="225" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#6366f1"/><text x="50%" y="50%" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dy=".3em">Course</text></svg>`)}`;
                    }}
                  />
                  


                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(item.courses.id)}
                    className="absolute top-3 right-3 p-2 bg-white bg-opacity-90 rounded-full hover:bg-red-50 transition-colors group"
                    title="Remove from wishlist"
                  >
                    <Heart className="w-5 h-5 text-red-500 fill-current" />
                  </button>

                  {/* Course Status */}
                  {!item.courses.isPublished && (
                    <div className="absolute top-3 left-3 px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded">
                      Coming Soon
                    </div>
                  )}
                </div>

                {/* Course Content */}
                <div className="p-4">
                  <div className="mb-2">
                    <span className="text-xs font-medium text-primary-600 uppercase tracking-wide">
                      {item.courses.category}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold theme-text-primary mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                    <Link to={`/courses/${item.courses.id}`}>
                      {item.courses.title}
                    </Link>
                  </h3>
                  
                  <p className="theme-text-secondary text-sm mb-3 line-clamp-2">
                    {item.courses.shortDescription}
                  </p>

                  {/* Course Meta */}
                  <div className="flex items-center justify-between text-sm theme-text-muted mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        4.5
                      </span>
                      <span className="capitalize">{item.courses.level}</span>
                    </div>
                    <span className="text-xs">
                      Added {new Date(item.addedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Instructor */}
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-2">
                      <span className="text-primary-600 text-sm font-medium">
                        {item.courses.users?.firstName?.[0]}{item.courses.users?.lastName?.[0]}
                      </span>
                    </div>
                    <span className="text-sm theme-text-secondary">
                      {item.courses.users?.firstName} {item.courses.users?.lastName}
                    </span>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {item.courses.discountPrice && item.courses.discountPrice < item.courses.price ? (
                        <>
                          <span className="text-lg font-bold text-green-600">
                            ${item.courses.discountPrice}
                          </span>
                          <span className="text-sm theme-text-muted line-through">
                            ${item.courses.price}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold theme-text-primary">
                          ${item.courses.price || 'Free'}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => addToCart(item.courses.id)}
                        className="p-2 theme-bg-secondary hover:theme-bg-tertiary rounded-lg transition-colors"
                        title="Add to cart"
                      >
                        <ShoppingCart className="w-4 h-4 theme-text-primary" />
                      </button>
                      <button
                        onClick={() => removeFromWishlist(item.courses.id)}
                        className="p-2 theme-bg-secondary hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4 theme-text-muted hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {wishlist.length > 0 && (
          <div className="mt-12 text-center">
            <div className="theme-card p-6 rounded-lg border theme-border">
              <h3 className="text-lg font-semibold theme-text-primary mb-4">Quick Actions</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={async () => {
                    for (const item of wishlist) {
                      await addToCart(item.courses.id);
                    }
                    toast.success('All courses added to cart');
                  }}
                  variant="outline"
                  className="flex items-center"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add All to Cart
                </Button>
                <Link to="/courses">
                  <Button variant="outline">
                    Continue Browsing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;