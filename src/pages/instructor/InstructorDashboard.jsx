import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Plus, BookOpen, Users, DollarSign, TrendingUp, Eye, Edit, Trash2, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const InstructorDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    avgRating: 0
  });
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user?.role === 'instructor') {
      fetchInstructorData();
    }
  }, [isAuthenticated, user?.role]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'instructor') {
    return <Navigate to="/" replace />;
  }

  const handlePublishCourse = async (courseId) => {
    try {
      const response = await axios.patch(`/api/instructor/courses/${courseId}/publish`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, isPublished: response.data.course.isPublished }
          : course
      ));
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to publish course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      await axios.delete(`/api/instructor/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setCourses(prev => prev.filter(course => course.id !== courseId));
      toast.success('Course deleted successfully');
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  const fetchInstructorData = async () => {
    try {
      const response = await axios.get('/api/instructor/courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setCourses(response.data.courses || []);
      
      // Calculate stats from real data
      const courses = response.data.courses || [];
      setStats({
        totalCourses: courses.length,
        totalStudents: courses.reduce((sum, course) => sum + (course.students || 0), 0),
        totalRevenue: courses.reduce((sum, course) => sum + (course.revenue || 0), 0),
        avgRating: courses.length > 0 ? courses.reduce((sum, course) => sum + (course.rating || 0), 0) / courses.length : 0
      });
    } catch (error) {
      console.error('Failed to fetch instructor data:', error);
      toast.error('Failed to load courses');
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold theme-text-primary mb-2">
              Instructor Dashboard
            </h1>
            <p className="theme-text-secondary">
              Welcome back, {user?.firstName}! Manage your courses and track your success.
            </p>
          </div>
          <Link to="/instructor/course/create">
            <Button className="mt-4 lg:mt-0">
              <Plus className="w-4 h-4 mr-2" />
              Create New Course
            </Button>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/instructor/courses" className="theme-card p-4 rounded-lg hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h3 className="font-semibold theme-text-primary">Manage Courses</h3>
                <p className="text-sm theme-text-secondary">Edit and organize your courses</p>
              </div>
            </div>
          </Link>
          
          <Link to="/instructor/analytics" className="theme-card p-4 rounded-lg hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <h3 className="font-semibold theme-text-primary">Revenue Analytics</h3>
                <p className="text-sm theme-text-secondary">Track earnings and performance</p>
              </div>
            </div>
          </Link>
          
          <Link to="/instructor/course/create" className="theme-card p-4 rounded-lg hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <Plus className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <h3 className="font-semibold theme-text-primary">Create Course</h3>
                <p className="text-sm theme-text-secondary">Start a new course</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="theme-card p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm theme-text-muted">Total Courses</p>
                <p className="text-2xl font-bold theme-text-primary">{stats.totalCourses}</p>
              </div>
            </div>
          </div>

          <div className="theme-card p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm theme-text-muted">Total Students</p>
                <p className="text-2xl font-bold theme-text-primary">{stats.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="theme-card p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm theme-text-muted">Total Revenue</p>
                <p className="text-2xl font-bold theme-text-primary">${stats.totalRevenue}</p>
              </div>
            </div>
          </div>

          <div className="theme-card p-6 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm theme-text-muted">Avg Rating</p>
                <p className="text-2xl font-bold theme-text-primary">{stats.avgRating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Courses */}
        <div className="theme-card rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold theme-text-primary">My Courses</h2>
            <Link to="/instructor/courses">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 theme-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold theme-text-primary mb-2">
                No courses yet
              </h3>
              <p className="theme-text-secondary mb-6">
                Create your first course to start teaching and earning
              </p>
              <Link to="/instructor/course/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Course
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div key={course.id} className="border theme-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video relative">
                    <img
                      src={course.thumbnail ? (
                        course.thumbnail.startsWith('http') 
                          ? course.thumbnail 
                          : `${import.meta.env.VITE_API_URL || 'https://ai-tutor-backend-gq6g.onrender.com'}${course.thumbnail}`
                      ) : `data:image/svg+xml;base64,${btoa(`<svg width="400" height="225" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#6366f1"/><text x="50%" y="50%" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dy=".3em">Course</text></svg>`)}`}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `data:image/svg+xml;base64,${btoa(`<svg width="400" height="225" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#6366f1"/><text x="50%" y="50%" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dy=".3em">Course</text></svg>`)}`;
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        course.isPublished 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold theme-text-primary mb-2">{course.title}</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm theme-text-secondary">
                      <div>
                        <span className="font-medium">{course.students}</span> students
                      </div>
                      <div>
                        <span className="font-medium">${course.revenue}</span> revenue
                      </div>
                      <div>
                        <span className="font-medium">{course.rating || 0}</span> ⭐ rating
                      </div>
                      <div>
                        <Link 
                          to={`/instructor/course/${course.id}/reviews`}
                          className="text-primary-600 hover:text-primary-700 text-xs"
                        >
                          View Reviews
                        </Link>
                      </div>
                    </div>

                    <div className="flex space-x-2 mb-2">
                      <Button
                        size="sm"
                        onClick={() => handlePublishCourse(course.id)}
                        className={`flex-1 ${
                          course.isPublished 
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {course.isPublished ? 'Unpublish' : 'Publish'}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Link to={`/instructor/course/${course.id}/edit`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Link to={`/instructor/course/${course.id}/builder`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            Build
                          </Button>
                        </Link>
                      </div>
                      <div className="flex space-x-2">
                        <Link to={`/courses/${course.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 flex-1"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
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

export default InstructorDashboard;