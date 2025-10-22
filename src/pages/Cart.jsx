import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Heart, ArrowLeft, CreditCard, Tag, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../components/common/Button';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cart`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setCart(data.cart);
        setTotal(parseFloat(data.total));
      }
    } catch (error) {
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (courseId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cart/remove/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setCart(prev => prev.filter(item => item.courses.id !== courseId));
        toast.success('Course removed from cart');
        fetchCart(); // Refresh to update total
      }
    } catch (error) {
      toast.error('Failed to remove course');
    }
  };

  const moveToWishlist = async (courseId) => {
    try {
      // Add to wishlist
      const wishlistResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/wishlist/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ courseId })
      });

      if (wishlistResponse.ok) {
        // Remove from cart
        await removeFromCart(courseId);
        toast.success('Course moved to wishlist');
      }
    } catch (error) {
      toast.error('Failed to move to wishlist');
    }
  };

  const proceedToCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      toast.loading('Processing checkout...');
      
      // Create order for all courses in cart
      const response = await fetch('http://localhost:5000/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          courses: cart.map(item => ({
            courseId: item.courses.id,
            price: item.courses.discountPrice || item.courses.price
          })),
          totalAmount: total
        })
      });

      const orderData = await response.json();
      
      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      // Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'LearnHub',
        description: `Purchase ${cart.length} course${cart.length > 1 ? 's' : ''}`,
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await fetch('http://localhost:5000/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                courses: cart.map(item => item.courses.id)
              })
            });

            const verifyData = await verifyResponse.json();
            
            if (verifyData.success) {
              toast.dismiss();
              toast.success('Payment successful! You are now enrolled in the courses.');
              setCart([]);
              setTotal(0);
              navigate('/my-learning');
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            toast.dismiss();
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || ''
        },
        theme: {
          color: '#6366f1'
        },
        modal: {
          ondismiss: function() {
            toast.dismiss();
            toast.error('Payment cancelled');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || 'Failed to process checkout');
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
              <ShoppingCart className="w-8 h-8 mr-3" />
              Shopping Cart
            </h1>
            <p className="theme-text-secondary">{cart.length} course{cart.length !== 1 ? 's' : ''} in your cart</p>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-24 h-24 theme-text-muted mx-auto mb-6" />
            <h2 className="text-2xl font-semibold theme-text-primary mb-4">Your cart is empty</h2>
            <p className="theme-text-secondary mb-8">Discover amazing courses and add them to your cart</p>
            <Link to="/courses">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="theme-card p-6 rounded-lg border theme-border">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Course Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.courses.thumbnail ? 
                          (item.courses.thumbnail.startsWith('http') ? item.courses.thumbnail : `http://localhost:5000${item.courses.thumbnail}`) : 
                          `data:image/svg+xml;base64,${btoa(`<svg width="200" height="120" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#6366f1"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="white" text-anchor="middle" dy=".3em">Course</text></svg>`)}`
                        }
                        alt={item.courses.title}
                        className="w-full md:w-48 h-28 object-cover rounded-lg"
                      />
                    </div>

                    {/* Course Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold theme-text-primary line-clamp-2">
                          {item.courses.title}
                        </h3>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => moveToWishlist(item.courses.id)}
                            className="p-2 hover:theme-bg-secondary rounded-lg transition-colors"
                            title="Move to wishlist"
                          >
                            <Heart className="w-5 h-5 theme-text-muted hover:text-red-500" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.courses.id)}
                            className="p-2 hover:theme-bg-secondary rounded-lg transition-colors"
                            title="Remove from cart"
                          >
                            <Trash2 className="w-5 h-5 theme-text-muted hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="theme-text-secondary text-sm mb-2 line-clamp-2">
                        {item.courses.shortDescription}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm theme-text-muted mb-3">
                        <span className="flex items-center">
                          <Tag className="w-4 h-4 mr-1" />
                          {item.courses.category}
                        </span>
                        <span className="capitalize">{item.courses.level}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm theme-text-muted">By</span>
                          <span className="text-sm font-medium theme-text-primary">
                            {item.courses.users?.firstName} {item.courses.users?.lastName}
                          </span>
                        </div>
                        
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
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="theme-card p-6 rounded-lg border theme-border sticky top-8">
                <h3 className="text-xl font-semibold theme-text-primary mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="theme-text-secondary truncate mr-2">
                        {item.courses.title}
                      </span>
                      <span className="theme-text-primary font-medium">
                        ${item.courses.discountPrice || item.courses.price || '0'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t theme-border pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold theme-text-primary">Total:</span>
                    <span className="text-2xl font-bold text-green-600">${total.toFixed(2)}</span>
                  </div>
                  {total > 50 && (
                    <p className="text-sm text-green-600 mt-2">🎉 You saved on bulk purchase!</p>
                  )}
                </div>

                <Button 
                  onClick={proceedToCheckout}
                  className="w-full mb-4 flex items-center justify-center"
                  disabled={cart.length === 0}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Proceed to Checkout
                </Button>

                <div className="text-center">
                  <Link 
                    to="/courses" 
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Continue Shopping
                  </Link>
                </div>

                {/* Trust Indicators */}
                <div className="mt-6 pt-6 border-t theme-border">
                  <div className="space-y-2 text-sm theme-text-muted">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>30-day money-back guarantee</span>
                    </div>
                    <div className="flex items-center">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      <span>Secure checkout</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;