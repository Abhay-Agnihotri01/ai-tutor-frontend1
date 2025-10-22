import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, Play, Search, Filter, SortAsc, Heart, Globe, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/common/LoadingScreen';
import Button from '../components/common/Button';
import StarRating from '../components/common/StarRating';
import RatingModal from '../components/common/RatingModal';
import VideoThumbnail from '../components/common/VideoThumbnail';

const MyLearning = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recently-enrolled');
  const [filterBy, setFilterBy] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [ratingModal, setRatingModal] = useState({ isOpen: false, course: null, existingRating: null });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchEnrolledCourses();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortCourses();
  }, [enrolledCourses, searchTerm, sortBy, filterBy]);

  const fetchEnrolledCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }
      
      console.log('User ID:', user?.id);
      console.log('Fetching enrollments...');
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/enrollments/my-courses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('API Response:', { status: response.status, data });
      
      if (response.ok) {
        console.log('Enrolled courses data:', data.enrollments);
        console.log('First course thumbnail:', data.enrollments?.[0]?.Course?.thumbnail);
        console.log('Enrolled courses loaded:', data.enrollments?.length);
        setEnrolledCourses(data.enrollments || []);
      } else {
        if (response.status === 401) {
          navigate('/login');
        }
        setEnrolledCourses([]);
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      setEnrolledCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCourses = () => {
    let filtered = [...enrolledCourses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(enrollment =>
        enrollment.Course?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.Course?.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filterBy !== 'all') {
      if (filterBy === 'completed') {
        filtered = filtered.filter(e => e.progress === 100);
      } else if (filterBy === 'in-progress') {
        filtered = filtered.filter(e => e.progress > 0 && e.progress < 100);
      } else if (filterBy === 'not-started') {
        filtered = filtered.filter(e => e.progress === 0);
      } else {
        filtered = filtered.filter(e => e.Course?.category === filterBy);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recently-enrolled':
          return new Date(b.enrolledAt) - new Date(a.enrolledAt);
        case 'recently-accessed':
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        case 'title-az':
          return a.Course?.title.localeCompare(b.Course?.title);
        case 'title-za':
          return b.Course?.title.localeCompare(a.Course?.title);
        case 'progress':
          return b.progress - a.progress;
        default:
          return 0;
      }
    });

    setFilteredCourses(filtered);
  };

  const handleGlobalSearch = () => {
    if (globalSearchTerm.trim()) {
      navigate(`/courses?search=${encodeURIComponent(globalSearchTerm)}`);
    }
  };

  const getUniqueCategories = () => {
    const categories = enrolledCourses.map(e => e.Course?.category).filter(Boolean);
    return [...new Set(categories)];
  };

  const handleRateClick = async (course) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/ratings/course/${course.id}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      setRatingModal({
        isOpen: true,
        course,
        existingRating: data.rating
      });
    } catch (error) {
      console.error('Error fetching user rating:', error);
      setRatingModal({
        isOpen: true,
        course,
        existingRating: null
      });
    }
  };

  const handleRatingSubmit = async ({ rating, review }) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await fetch(`${apiUrl}/api/ratings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId: ratingModal.course.id,
          rating,
          review
        })
      });
      
      // Refresh enrolled courses to get updated ratings
      fetchEnrolledCourses();
      setRatingModal({ isOpen: false, course: null, existingRating: null });
    } catch (error) {
      console.error('Error submitting rating:', error);
      throw error;
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen theme-bg-primary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold theme-text-primary mb-2">My Learning</h1>
              <p className="theme-text-secondary">Track your progress and continue learning</p>
            </div>
            
            {/* Global Search */}
            <div className="mt-4 lg:mt-0">
              <div className="flex space-x-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search all courses..."
                    value={globalSearchTerm}
                    onChange={(e) => setGlobalSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGlobalSearch()}
                    className="pl-10 pr-4 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
                  />
                  <Globe className="absolute left-3 top-2.5 w-4 h-4 theme-text-muted" />
                </div>
                <Button onClick={handleGlobalSearch} size="sm">
                  Search All
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          {enrolledCourses.length > 0 && (
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              {/* Local Search */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search your courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 theme-text-muted" />
              </div>

              {/* Sort and Filter Controls */}
              <div className="flex items-center space-x-3">
                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="pl-8 pr-8 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
                  >
                    <option value="recently-enrolled">Recently Enrolled</option>
                    <option value="recently-accessed">Recently Accessed</option>
                    <option value="title-az">Title A-Z</option>
                    <option value="title-za">Title Z-A</option>
                    <option value="progress">Progress</option>
                  </select>
                  <SortAsc className="absolute left-2 top-2.5 w-4 h-4 theme-text-muted pointer-events-none" />
                </div>

                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                    showFilters 
                      ? 'bg-primary-100 dark:bg-primary-900 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                      : 'theme-bg-secondary theme-border theme-text-primary hover:theme-bg-tertiary'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
              </div>
            </div>
          )}

          {/* Filter Options */}
          {showFilters && (
            <div className="theme-card p-4 rounded-lg mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <button
                  onClick={() => setFilterBy('all')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterBy === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'theme-bg-secondary theme-text-primary hover:theme-bg-tertiary'
                  }`}
                >
                  All Courses
                </button>
                <button
                  onClick={() => setFilterBy('completed')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterBy === 'completed'
                      ? 'bg-primary-600 text-white'
                      : 'theme-bg-secondary theme-text-primary hover:theme-bg-tertiary'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setFilterBy('in-progress')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterBy === 'in-progress'
                      ? 'bg-primary-600 text-white'
                      : 'theme-bg-secondary theme-text-primary hover:theme-bg-tertiary'
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setFilterBy('not-started')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterBy === 'not-started'
                      ? 'bg-primary-600 text-white'
                      : 'theme-bg-secondary theme-text-primary hover:theme-bg-tertiary'
                  }`}
                >
                  Not Started
                </button>
                {getUniqueCategories().map(category => (
                  <button
                    key={category}
                    onClick={() => setFilterBy(category)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                      filterBy === category
                        ? 'bg-primary-600 text-white'
                        : 'theme-bg-secondary theme-text-primary hover:theme-bg-tertiary'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {enrolledCourses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="theme-card p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                    <BookOpen className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm theme-text-muted">Total Courses</p>
                    <p className="text-xl font-bold theme-text-primary">{enrolledCourses.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="theme-card p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm theme-text-muted">Completed</p>
                    <p className="text-xl font-bold theme-text-primary">
                      {enrolledCourses.filter(e => e.progress === 100).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="theme-card p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <Play className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm theme-text-muted">In Progress</p>
                    <p className="text-xl font-bold theme-text-primary">
                      {enrolledCourses.filter(e => e.progress > 0 && e.progress < 100).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="theme-card p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm theme-text-muted">Total Hours</p>
                    <p className="text-xl font-bold theme-text-primary">
                      {enrolledCourses.reduce((total, e) => total + (e.Course?.actualDuration || e.Course?.duration || 0), 0)}h
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {filteredCourses.length === 0 && enrolledCourses.length > 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 theme-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold theme-text-primary mb-2">No courses found</h3>
            <p className="theme-text-secondary mb-6">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterBy('all');
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 theme-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold theme-text-primary mb-2">No courses enrolled yet</h3>
            <p className="theme-text-secondary mb-6">Start your learning journey by enrolling in courses</p>
            <Link 
              to="/courses" 
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((enrollment) => {
              const course = enrollment.Course;
              const progressPercent = enrollment.progress || 0;
              const isCompleted = progressPercent === 100;
              

              
              return (
                <div key={enrollment.id} className="theme-card rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600">
                    {course?.thumbnail && (
                      <img 
                        src={course.thumbnail}
                        alt={course?.title || 'Course thumbnail'}
                        className="w-full h-full object-cover"
                        style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center text-white" style={{ zIndex: 0 }}>
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-2">{course?.title?.charAt(0) || 'C'}</div>
                        <div className="text-sm opacity-80">{course?.category || 'Course'}</div>
                      </div>
                    </div>
                    <Link 
                      to={`/learn/${course?.id}`}
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-40 transition-all group"
                    >
                      <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg group-hover:bg-opacity-100 group-hover:scale-110 transition-all">
                        <Play className="w-8 h-8 text-gray-800 ml-1" />
                      </div>
                    </Link>
                    <div className="absolute top-4 right-4">
                      <div className={`px-2 py-1 rounded text-xs font-medium shadow-sm ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-900 bg-opacity-80 text-white'
                      }`}>
                        {isCompleted ? 'Completed' : `${progressPercent}% Complete`}
                      </div>
                    </div>
                    {isCompleted && (
                      <div className="absolute top-4 left-4">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold theme-text-primary flex-1">
                        {course?.title || 'Course Title'}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        course?.level === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        course?.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {course?.level || 'Beginner'}
                      </span>
                    </div>
                    
                    <p className="theme-text-secondary text-sm mb-4 line-clamp-2">
                      {course?.description || 'Course description'}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 text-sm theme-text-muted">
                        <Clock className="w-4 h-4" />
                        <span>{course?.actualDuration || course?.duration || 0}h</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm theme-text-muted">
                        <BookOpen className="w-4 h-4" />
                        <span>{course?.actualLessons || course?.lessons || 0} lessons</span>
                      </div>
                      <div className="text-sm theme-text-muted">
                        Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm theme-text-secondary mb-1">
                        <span>Progress</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 shadow-inner">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isCompleted ? 'bg-green-500' : 'bg-primary-600'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <StarRating rating={course?.rating || 0} readonly size="sm" />
                      <button
                        onClick={() => handleRateClick(course)}
                        className="text-xs theme-text-muted hover:text-primary-600 transition-colors flex items-center space-x-1"
                      >
                        <Star className="w-3 h-3" />
                        <span>Rate</span>
                      </button>
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        to={`/learn/${course?.id}`}
                        className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors text-center text-sm font-medium flex items-center justify-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>{isCompleted ? 'Review' : 'Continue Learning'}</span>
                      </Link>
                      <Link
                        to={`/courses/${course?.id}`}
                        className="px-4 py-2 theme-bg-secondary hover:theme-bg-tertiary rounded-lg transition-colors text-sm font-medium theme-text-primary"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <RatingModal
          isOpen={ratingModal.isOpen}
          onClose={() => setRatingModal({ isOpen: false, course: null, existingRating: null })}
          courseTitle={ratingModal.course?.title}
          onSubmit={handleRatingSubmit}
          existingRating={ratingModal.existingRating}
        />
      </div>
    </div>
  );
};

export default MyLearning;