import { Star, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import StarRating from '../common/StarRating';

const CourseCard = ({ course }) => {
  const {
    id,
    title,
    shortDescription,
    thumbnail,
    price,
    discountPrice,
    level,
    duration,
    enrollmentCount,
    rating,
    instructor
  } = course;

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Link to={`/courses/${id}`} className="group">
      <div className="theme-card rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105 overflow-hidden h-full flex flex-col animate-slide-up">
        {/* Thumbnail */}
        <div className="relative overflow-hidden">
          <img
            src={thumbnail ? (thumbnail.startsWith('http') ? thumbnail : `http://localhost:5000${thumbnail}`) : `data:image/svg+xml;base64,${btoa(`<svg width="400" height="225" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#6366f1"/><text x="50%" y="50%" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dy=".3em">Course</text></svg>`)}`}
            alt={title}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.target.src = `data:image/svg+xml;base64,${btoa(`<svg width="400" height="225" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#6366f1"/><text x="50%" y="50%" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dy=".3em">Course</text></svg>`)}`;
            }}
          />
          {discountPrice && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
              {Math.round(((price - discountPrice) / price) * 100)}% OFF
            </div>
          )}
          <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs capitalize">
            {level}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-lg theme-text-primary mb-2 line-clamp-2 group-hover:text-primary-600 min-h-[3.5rem]">
            {title}
          </h3>
          
          <p className="theme-text-secondary text-sm mb-3 line-clamp-2 min-h-[2.5rem]">
            {shortDescription || 'Learn essential skills with this comprehensive course'}
          </p>

          {/* Instructor */}
          {instructor && (
            <div className="flex items-center mb-3">
              <img
                src={
                  instructor.avatar && instructor.avatar.startsWith('http')
                    ? instructor.avatar
                    : instructor.avatar
                    ? `http://localhost:5000${instructor.avatar}`
                    : `https://ui-avatars.com/api/?name=${instructor.firstName}+${instructor.lastName}&background=6366f1&color=ffffff&size=32`
                }
                alt={`${instructor.firstName} ${instructor.lastName}`}
                className="w-6 h-6 rounded-full mr-2"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${instructor.firstName}+${instructor.lastName}&background=6366f1&color=ffffff&size=32`;
                }}
              />
              <span className="text-sm theme-text-muted">
                {instructor.firstName} {instructor.lastName}
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-sm theme-text-muted mb-3">
            <div className="flex items-center space-x-4">
              <StarRating rating={rating || 0} readonly size="sm" showValue={false} />
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>{formatDuration(duration || 60)}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>{(enrollmentCount || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center space-x-2">
              {price === 0 ? (
                <span className="text-lg font-bold text-green-600">
                  Free
                </span>
              ) : discountPrice ? (
                <>
                  <span className="text-lg font-bold theme-text-primary">
                    ${discountPrice}
                  </span>
                  <span className="text-sm theme-text-muted line-through">
                    ${price}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold theme-text-primary">
                  ${price}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;