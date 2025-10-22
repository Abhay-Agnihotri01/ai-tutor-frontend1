import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, Users, Play, BookOpen, Award, MessageSquare, Heart, ShoppingCart } from 'lucide-react';
import Button from '../components/common/Button';
import StarRating from '../components/common/StarRating';
import VideoThumbnail from '../components/common/VideoThumbnail';
import PaymentModal from '../components/common/PaymentModal';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const CourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [inCart, setInCart] = useState(false);
  const { isAuthenticated } = useAuth();
  const { addToCart, loading: cartLoading } = useCart();
  const { addToWishlist, removeFromWishlist, checkWishlistStatus, loading: wishlistLoading } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourse();
    fetchRatings();
    checkEnrollment();
    if (isAuthenticated) {
      checkWishlistStatus(id).then(setInWishlist);
      checkCartStatus();
    }
  }, [id, isAuthenticated]);

  const fetchCourse = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://ai-tutor-backend-gq6g.onrender.com';
      const response = await axios.get(`${apiUrl}/api/courses/${id}`);
      setCourse(response.data.course);
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      setRatingsLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'https://ai-tutor-backend-gq6g.onrender.com';
      const response = await axios.get(`${apiUrl}/api/ratings/course/${id}?limit=5`);
      setRatings(response.data.ratings);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setRatingsLoading(false);
    }
  };

  const checkEnrollment = async () => {
    if (!isAuthenticated) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://ai-tutor-backend-gq6g.onrender.com';
      const response = await axios.get(`${apiUrl}/api/enrollments/my-courses`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const enrolled = response.data.enrollments.some(enrollment => 
        enrollment.Course?.id === id
      );
      setIsEnrolled(enrolled);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const checkCartStatus = async () => {
    if (!isAuthenticated) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://ai-tutor-backend-gq6g.onrender.com';
      const response = await axios.get(`${apiUrl}/api/cart`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        const inCart = response.data.cart.some(item => item.courses.id === id);
        setInCart(inCart);
        console.log('Cart status check:', { courseId: id, inCart, cartItems: response.data.cart.length });
      }
    } catch (error) {
      console.error('Error checking cart status:', error);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to enroll in courses');
      return;
    }
    
    if (isEnrolled) {
      navigate(`/learn/${id}`);
      return;
    }
    
    // For free courses, enroll directly without payment modal
    if (course.price === 0) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://ai-tutor-backend-gq6g.onrender.com';
        const response = await axios.post(`${apiUrl}/api/enrollments/enroll`, 
          { courseId: id },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (response.data.success) {
          toast.success('Enrolled in free course successfully!');
          setIsEnrolled(true);
          setTimeout(() => {
            navigate(`/learn/${id}`);
          }, 1000);
        }
      } catch (error) {
        console.error('Free enrollment error:', error);
        toast.error(error.response?.data?.message || 'Failed to enroll in course');
      }
      return;
    }
    
    setShowPaymentModal(true);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add courses to cart');
      return;
    }
    const success = await addToCart(id);
    if (success) {
      setInCart(true);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add courses to wishlist');
      return;
    }
    
    if (inWishlist) {
      const success = await removeFromWishlist(id);
      if (success) setInWishlist(false);
    } else {
      const success = await addToWishlist(id);
      if (success) setInWishlist(true);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setIsEnrolled(true);
    setTimeout(() => {
      navigate(`/learn/${id}`);
    }, 1000);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold theme-text-primary mb-2">Course not found</h2>
          <p className="theme-text-secondary">The course you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Course Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm font-medium">
                  {course.category}
                </span>
                <span className="px-3 py-1 theme-bg-secondary theme-text-primary rounded-full text-sm font-medium capitalize">
                  {course.level}
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold theme-text-primary mb-4">
                {course.title}
              </h1>
              
              <p className="text-lg theme-text-secondary mb-6">
                {course.description}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 text-sm theme-text-secondary">
                <div className="flex items-center">
                  <StarRating rating={course.rating || 0} readonly size="sm" />
                  <span className="ml-2">({(course.enrollmentCount || 0).toLocaleString()} students)</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-1" />
                  <span>{formatDuration(course.duration || 0)}</span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-1" />
                  <span>{course.language || 'English'}</span>
                </div>
              </div>
            </div>

            {/* Course Video/Image */}
            <div className="mb-8">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                {course.chapters?.[0]?.videos?.[0] ? (
                  <VideoThumbnail
                    videoUrl={course.chapters[0].videos[0].videoUrl}
                    thumbnailUrl={course.chapters[0].videos[0].thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full"
                    showPlayIcon={true}
                  />
                ) : (
                  <>
                    <img
                      src={course.thumbnail ? (course.thumbnail.startsWith('http') ? course.thumbnail : `${import.meta.env.VITE_API_URL || 'https://ai-tutor-backend-gq6g.onrender.com'}${course.thumbnail}`) : 'https://via.placeholder.com/400x225/6366f1/ffffff?text=Course'}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x225/6366f1/ffffff?text=Course';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all">
                        <Play className="w-8 h-8 text-gray-900 ml-1" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Course Content */}
            <div className="theme-card rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold theme-text-primary mb-4">
                What you'll learn
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Master the fundamentals and advanced concepts',
                  'Build real-world projects from scratch',
                  'Learn industry best practices',
                  'Get hands-on experience with tools',
                  'Understand core principles and patterns',
                  'Prepare for job interviews'
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <Award className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="theme-text-secondary">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="theme-card rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold theme-text-primary mb-4">
                Student Reviews
              </h2>
              {ratingsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : ratings.length > 0 ? (
                <div className="space-y-4">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="border-b theme-border pb-4 last:border-b-0">
                      <div className="flex items-start space-x-3">
                        <img
                          src={
                            rating.user.avatar && rating.user.avatar.startsWith('http')
                              ? rating.user.avatar
                              : rating.user.avatar
                              ? `${import.meta.env.VITE_API_URL || 'https://ai-tutor-backend-gq6g.onrender.com'}${rating.user.avatar}`
                              : `https://ui-avatars.com/api/?name=${rating.user.firstName}+${rating.user.lastName}&background=6366f1&color=ffffff&size=40`
                          }
                          alt={`${rating.user.firstName} ${rating.user.lastName}`}
                          className="w-10 h-10 rounded-full"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${rating.user.firstName}+${rating.user.lastName}&background=6366f1&color=ffffff&size=40`;
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium theme-text-primary">
                              {rating.user.firstName} {rating.user.lastName}
                            </h4>
                            <StarRating rating={rating.rating} readonly size="sm" showValue={false} />
                          </div>
                          {rating.review && (
                            <p className="theme-text-secondary text-sm">
                              {rating.review}
                            </p>
                          )}
                          <p className="text-xs theme-text-muted mt-1">
                            {new Date(rating.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 theme-text-muted mx-auto mb-2" />
                  <p className="theme-text-secondary">No reviews yet. Be the first to review this course!</p>
                </div>
              )}
            </div>

            {/* Instructor */}
            {course.instructor && (
              <div className="theme-card rounded-lg p-6">
                <h2 className="text-2xl font-bold theme-text-primary mb-4">
                  Your Instructor
                </h2>
                <div className="flex items-start space-x-4">
                  <img
                    src={
                      course.instructor.avatar && course.instructor.avatar.startsWith('http')
                        ? course.instructor.avatar
                        : course.instructor.avatar
                        ? `${import.meta.env.VITE_API_URL || 'https://ai-tutor-backend-gq6g.onrender.com'}${course.instructor.avatar}`
                        : `https://ui-avatars.com/api/?name=${course.instructor.firstName || 'Instructor'}+${course.instructor.lastName || ''}&background=6366f1&color=ffffff&size=64`
                    }
                    alt={`${course.instructor.firstName || 'Instructor'} ${course.instructor.lastName || ''}`}
                    className="w-16 h-16 rounded-full"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${course.instructor.firstName || 'Instructor'}+${course.instructor.lastName || ''}&background=6366f1&color=ffffff&size=64`;
                    }}
                  />
                  <div>
                    <h3 className="text-lg font-semibold theme-text-primary">
                      {course.instructor.firstName || 'Instructor'} {course.instructor.lastName || ''}
                    </h3>
                    <p className="theme-text-secondary mb-2">
                      Expert {course.category || 'Course'} Instructor
                    </p>
                    <p className="theme-text-secondary">
                      Experienced professional with years of industry experience and a passion for teaching.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="theme-card rounded-lg p-6">
                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    {course.price === 0 ? (
                      <span className="text-3xl font-bold text-green-600">
                        Free
                      </span>
                    ) : course.discountPrice ? (
                      <>
                        <span className="text-3xl font-bold theme-text-primary">
                          ${course.discountPrice}
                        </span>
                        <span className="text-lg theme-text-muted line-through">
                          ${course.price}
                        </span>
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-sm font-medium">
                          {Math.round(((course.price - course.discountPrice) / course.price) * 100)}% OFF
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold theme-text-primary">
                        ${course.price}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {isEnrolled ? (
                  <Button onClick={handleEnroll} className="w-full mb-4" size="lg">
                    Continue Learning
                  </Button>
                ) : (
                  <div className="space-y-3 mb-4">
                    {course.price === 0 ? (
                      <Button onClick={handleEnroll} className="w-full" size="lg">
                        Enroll for Free
                      </Button>
                    ) : (
                      <>
                        <Button onClick={handleAddToCart} className="w-full" size="lg" disabled={cartLoading || inCart}>
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          {inCart ? 'Already in Cart' : 'Add to Cart'}
                        </Button>
                        <Button onClick={handleEnroll} variant="outline" className="w-full" size="lg">
                          Buy Now
                        </Button>
                      </>
                    )}
                    
                    <button
                      onClick={handleWishlistToggle}
                      disabled={wishlistLoading}
                      className={`w-full flex items-center justify-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${
                        inWishlist 
                          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' 
                          : 'theme-bg-secondary theme-border theme-text-muted hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
                      <span>{inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>
                    </button>
                  </div>
                )}

                {/* Trust Indicators */}
                {!isEnrolled && (
                  <div className="mb-6 p-4 theme-bg-secondary rounded-lg">
                    <div className="space-y-2 text-sm theme-text-muted">
                      <p>✓ 30-day money-back guarantee</p>
                      <p>✓ Lifetime access</p>
                      <p>✓ Certificate of completion</p>
                    </div>
                  </div>
                )}

                {/* Course Includes */}
                <div className="space-y-3 text-sm">
                  <h3 className="font-semibold theme-text-primary">This course includes:</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Play className="w-4 h-4 mr-2 theme-text-muted" />
                      <span className="theme-text-secondary">{formatDuration(course.duration || 0)} on-demand video</span>
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-2 theme-text-muted" />
                      <span className="theme-text-secondary">Downloadable resources</span>
                    </div>
                    <div className="flex items-center">
                      <Award className="w-4 h-4 mr-2 theme-text-muted" />
                      <span className="theme-text-secondary">Certificate of completion</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 theme-text-muted" />
                      <span className="theme-text-secondary">Access to community</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        course={course}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default CourseDetail;