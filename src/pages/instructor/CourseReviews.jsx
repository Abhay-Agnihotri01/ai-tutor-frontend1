import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ArrowLeft, User } from 'lucide-react';
import StarRating from '../../components/common/StarRating';
import { toast } from 'react-hot-toast';

const CourseReviews = () => {
  const { courseId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [course, setCourse] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchReviews();
  }, [courseId]);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/ratings/instructor/course/${courseId}/reviews`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviews(data.reviews);
      setCourse(data.course);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to load reviews');
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg-primary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/instructor/dashboard" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-3xl font-bold theme-text-primary mb-2">
            Course Reviews: {course?.title}
          </h1>
          
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {/* Average Rating */}
              <div className="theme-card p-6 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold theme-text-primary mb-2">
                    {stats.averageRating || 0}
                  </div>
                  <StarRating rating={stats.averageRating || 0} readonly />
                  <p className="text-sm theme-text-secondary mt-2">
                    Based on {stats.totalReviews} reviews
                  </p>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="theme-card p-6 rounded-lg md:col-span-2">
                <h3 className="font-semibold theme-text-primary mb-4">Rating Distribution</h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(rating => {
                    const count = stats.ratingDistribution[rating] || 0;
                    const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                    
                    return (
                      <div key={rating} className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1 w-12">
                          <span className="text-sm theme-text-secondary">{rating}</span>
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        </div>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm theme-text-secondary w-8">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold theme-text-primary">
            Student Reviews ({stats?.totalReviews || 0})
          </h2>
          
          {reviews.length === 0 ? (
            <div className="theme-card p-8 rounded-lg text-center">
              <Star className="w-12 h-12 theme-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold theme-text-primary mb-2">No Reviews Yet</h3>
              <p className="theme-text-secondary">
                Your course hasn't received any reviews from students yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="theme-card p-6 rounded-lg">
                  <div className="flex items-start space-x-4">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      {review.user?.avatar ? (
                        <img 
                          src={review.user.avatar} 
                          alt={`${review.user.firstName} ${review.user.lastName}`}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                      )}
                    </div>
                    
                    {/* Review Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold theme-text-primary">
                            {review.user?.firstName} {review.user?.lastName}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <StarRating rating={review.rating} readonly size="sm" />
                            <span className="text-sm theme-text-secondary">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {review.review && (
                        <p className="theme-text-secondary leading-relaxed">
                          {review.review}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseReviews;