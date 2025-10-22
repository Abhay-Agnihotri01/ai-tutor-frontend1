import { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Play, Check } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

const CourseActions = ({ course, isEnrolled = false }) => {
  const [inWishlist, setInWishlist] = useState(false);
  const [inCart, setInCart] = useState(false);
  const { addToCart, removeFromCart, loading: cartLoading } = useCart();
  const { addToWishlist, removeFromWishlist, checkWishlistStatus, loading: wishlistLoading } = useWishlist();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && course?.id) {
      checkWishlistStatus(course.id).then(setInWishlist);
    }
  }, [course?.id, isAuthenticated, checkWishlistStatus]);

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) return;
    
    if (inWishlist) {
      const success = await removeFromWishlist(course.id);
      if (success) setInWishlist(false);
    } else {
      const success = await addToWishlist(course.id);
      if (success) setInWishlist(true);
    }
  };

  const handleCartAction = async () => {
    if (!isAuthenticated) return;
    
    if (inCart) {
      const success = await removeFromCart(course.id);
      if (success) setInCart(false);
    } else {
      const success = await addToCart(course.id);
      if (success) setInCart(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center space-x-3">
        <Button className="flex-1">
          Sign Up to Enroll
        </Button>
      </div>
    );
  }

  if (isEnrolled) {
    return (
      <div className="flex items-center space-x-3">
        <Button className="flex-1 bg-green-600 hover:bg-green-700">
          <Check className="w-5 h-5 mr-2" />
          Enrolled - Continue Learning
        </Button>
      </div>
    );
  }

  const price = course?.discountPrice || course?.price || 0;
  const originalPrice = course?.price || 0;
  const isFree = price === 0;

  return (
    <div className="space-y-4">
      {/* Price Display */}
      <div className="flex items-center space-x-3">
        {isFree ? (
          <span className="text-2xl font-bold text-green-600">Free</span>
        ) : (
          <>
            <span className="text-3xl font-bold theme-text-primary">${price}</span>
            {course?.discountPrice && course.discountPrice < originalPrice && (
              <span className="text-lg theme-text-muted line-through">${originalPrice}</span>
            )}
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <Button 
          onClick={handleCartAction}
          disabled={cartLoading}
          className="flex-1"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          {inCart ? 'Remove from Cart' : (isFree ? 'Enroll Now' : 'Add to Cart')}
        </Button>
        
        <button
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          className={`p-3 rounded-lg border transition-all duration-200 ${
            inWishlist 
              ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
              : 'theme-bg-secondary theme-border theme-text-muted hover:text-red-500'
          }`}
          title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Trust Indicators */}
      <div className="text-sm theme-text-muted space-y-1">
        <p>✓ 30-day money-back guarantee</p>
        <p>✓ Lifetime access</p>
        <p>✓ Certificate of completion</p>
      </div>
    </div>
  );
};

export default CourseActions;