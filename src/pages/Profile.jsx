import { useState, useEffect, useRef } from 'react';
import { User, Mail, Calendar, Award, BookOpen, Camera, Star, TrendingUp, Clock, Target, Trophy, Zap, Globe, Shield, Bell, Settings, Download, Share2, Edit3, MapPin, Briefcase, GraduationCap, Heart, Eye, MessageSquare, BarChart3, Activity, Flame, Users, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [learningStreak, setLearningStreak] = useState(0);
  const [certificates, setCertificates] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [skillProgress, setSkillProgress] = useState([]);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    linkedin: user?.linkedin || '',
    twitter: user?.twitter || '',
    github: user?.github || '',
    profession: user?.profession || '',
    experience: user?.experience || '',
    interests: user?.interests || []
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [stats, setStats] = useState({
    totalHours: 0,
    completedCourses: 0,
    currentStreak: 0,
    totalPoints: 0,
    rank: 'Beginner',
    nextRankProgress: 0
  });
  const [instructorStats, setInstructorStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    avgRating: 0,
    totalReviews: 0,
    monthlyEarnings: 0,
    topCourse: null,
    recentEnrollments: []
  });
  const [instructorCourses, setInstructorCourses] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      if (user.role === 'instructor') {
        fetchInstructorData();
      } else {
        fetchEnrollments();
      }
    }
  }, [user]);

  const fetchInstructorData = async () => {
    try {
      const [coursesRes, statsRes] = await Promise.all([
        axios.get('/api/instructor/courses', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('/api/instructor/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      setInstructorCourses(coursesRes.data.courses || []);
      setInstructorStats({
        totalCourses: coursesRes.data.courses?.length || 0,
        totalStudents: statsRes.data.stats?.totalStudents || 0,
        totalRevenue: statsRes.data.stats?.totalRevenue || 0,
        avgRating: statsRes.data.stats?.avgRating || 0,
        totalReviews: 0,
        monthlyEarnings: statsRes.data.stats?.totalRevenue || 0,
        topCourse: coursesRes.data.courses?.[0] || null,
        recentEnrollments: []
      });
    } catch (error) {
      console.error('Error fetching instructor data:', error);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const response = await axios.get('/api/enrollments/my-courses', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setEnrollments(response.data.enrollments || []);
      
      // Calculate real stats from enrollments
      const enrollments = response.data.enrollments || [];
      const completedCount = enrollments.filter(e => e.progress === 100).length;
      const totalHours = enrollments.reduce((total, enrollment) => {
        const course = enrollment.Course || enrollment.course;
        return total + Math.floor((course?.duration || 0) / 60);
      }, 0);
      
      // Calculate points based on progress (10 points per % of progress)
      const totalPoints = enrollments.reduce((total, enrollment) => {
        return total + (enrollment.progress * 10);
      }, 0);
      
      // Calculate rank based on points
      let rank = 'Beginner';
      let nextRankProgress = 0;
      if (totalPoints >= 5000) {
        rank = 'Expert';
        nextRankProgress = 100;
      } else if (totalPoints >= 2000) {
        rank = 'Advanced';
        nextRankProgress = ((totalPoints - 2000) / 3000) * 100;
      } else if (totalPoints >= 500) {
        rank = 'Intermediate';
        nextRankProgress = ((totalPoints - 500) / 1500) * 100;
      } else {
        nextRankProgress = (totalPoints / 500) * 100;
      }
      
      // Calculate streak (simplified - could be enhanced with actual login data)
      const currentStreak = enrollments.length > 0 ? Math.min(enrollments.length * 2, 30) : 0;
      
      setStats({
        totalHours,
        completedCourses: completedCount,
        currentStreak,
        totalPoints: Math.round(totalPoints),
        rank,
        nextRankProgress: Math.min(nextRankProgress, 100)
      });
      
      // Set recent activity based on enrollments
      const recentActivities = enrollments.slice(0, 5).map((enrollment, index) => {
        const course = enrollment.Course || enrollment.course;
        return {
          title: enrollment.progress === 100 ? 'Course Completed' : 'Course In Progress',
          description: `${course?.title || 'Unknown Course'} - ${enrollment.progress}% complete`,
          time: `${index + 1} day${index !== 0 ? 's' : ''} ago`
        };
      });
      setRecentActivity(recentActivities);
      
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const getCompletedCount = () => {
    return enrollments.filter(e => e.progress === 100).length;
  };

  const getTotalHours = () => {
    return enrollments.reduce((total, enrollment) => {
      const course = enrollment.course;
      if (course?.duration) {
        return total + Math.floor(course.duration / 60);
      }
      return total;
    }, 0);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('email', formData.email);
      
      if (avatarFile) {
        formDataToSend.append('avatar', avatarFile);
      }

      console.log('Sending profile update...');
      const response = await axios.put('/api/auth/profile', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Profile update response:', response.data);
      
      if (response.data.success) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        setAvatarFile(null);
        setAvatarPreview(null);
        // Reload page to refresh auth context
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || ''
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold theme-text-primary mb-2">Access Denied</h2>
          <p className="theme-text-secondary">Please login to view your profile.</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return user?.role === 'instructor' ? (
          <div className="space-y-8">
            {/* Teaching Performance */}
            <div className="theme-card p-6 rounded-lg">
              <h3 className="text-xl font-bold theme-text-primary mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-primary-600" />
                Teaching Performance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold theme-text-primary">{instructorStats.totalCourses}</p>
                  <p className="text-sm theme-text-secondary">Courses Created</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold theme-text-primary">{instructorStats.totalStudents}</p>
                  <p className="text-sm theme-text-secondary">Total Students</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold theme-text-primary">{instructorStats.avgRating.toFixed(1)}</p>
                  <p className="text-sm theme-text-secondary">Average Rating</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold theme-text-primary">${instructorStats.totalRevenue}</p>
                  <p className="text-sm theme-text-secondary">Total Revenue</p>
                </div>
              </div>
            </div>

            {/* Revenue Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="theme-card p-6 rounded-lg">
                <h3 className="text-xl font-bold theme-text-primary mb-6 flex items-center">
                  <BarChart3 className="w-6 h-6 mr-2 text-green-500" />
                  Revenue Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 theme-bg-secondary rounded-lg">
                    <div>
                      <p className="text-sm theme-text-secondary">This Month</p>
                      <p className="text-2xl font-bold text-green-600">${instructorStats.monthlyEarnings}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-600">+12.5%</p>
                      <p className="text-xs theme-text-muted">vs last month</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 theme-bg-secondary rounded-lg">
                    <div>
                      <p className="text-sm theme-text-secondary">All Time</p>
                      <p className="text-2xl font-bold theme-text-primary">${instructorStats.totalRevenue}</p>
                    </div>
                    <Link to="/instructor/analytics" className="text-primary-600 hover:text-primary-700 text-sm">
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>

              <div className="theme-card p-6 rounded-lg">
                <h3 className="text-xl font-bold theme-text-primary mb-6 flex items-center">
                  <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
                  Top Performing Course
                </h3>
                {instructorStats.topCourse ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={instructorStats.topCourse.thumbnail || 'https://via.placeholder.com/80x60/6366f1/ffffff?text=Course'}
                        alt={instructorStats.topCourse.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold theme-text-primary">{instructorStats.topCourse.title}</h4>
                        <p className="text-sm theme-text-secondary">{instructorStats.topCourse.students} students</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-green-600">${instructorStats.topCourse.revenue || 0}</p>
                        <p className="text-xs theme-text-secondary">Revenue</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-yellow-600">{instructorStats.topCourse.rating || 0}⭐</p>
                        <p className="text-xs theme-text-secondary">Rating</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 theme-text-muted mx-auto mb-3" />
                    <p className="theme-text-secondary">No courses created yet</p>
                    <Link to="/instructor/course/create" className="text-primary-600 hover:text-primary-700 text-sm">Create your first course</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Learning Progress */}
            <div className="theme-card p-6 rounded-lg">
              <h3 className="text-xl font-bold theme-text-primary mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-primary-600" />
                Learning Progress
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold theme-text-primary">{stats.totalHours}h</p>
                  <p className="text-sm theme-text-secondary">Total Learning Time</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold theme-text-primary">{stats.completedCourses}</p>
                  <p className="text-sm theme-text-secondary">Courses Completed</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                    <Flame className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold theme-text-primary">{stats.currentStreak}</p>
                  <p className="text-sm theme-text-secondary">Day Streak</p>
                </div>
              </div>
            </div>

            {/* Current Rank & Progress */}
            <div className="theme-card p-6 rounded-lg">
              <h3 className="text-xl font-bold theme-text-primary mb-6 flex items-center">
                <Star className="w-6 h-6 mr-2 text-yellow-500" />
                Learning Rank
              </h3>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-primary-600">{stats.rank}</p>
                  <p className="text-sm theme-text-secondary">{stats.totalPoints} XP</p>
                </div>
                <div className="text-right">
                  <p className="text-sm theme-text-secondary">Next: Expert</p>
                  <p className="text-xs theme-text-muted">{Math.round(stats.nextRankProgress)}% to next rank</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${stats.nextRankProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="theme-card p-6 rounded-lg">
              <h3 className="text-xl font-bold theme-text-primary mb-6 flex items-center">
                <Activity className="w-6 h-6 mr-2 text-green-500" />
                Recent Activity
              </h3>
              <div className="space-y-4">
                {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 theme-bg-secondary rounded-lg">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium theme-text-primary">{activity.title}</p>
                      <p className="text-sm theme-text-secondary">{activity.description}</p>
                    </div>
                    <span className="text-xs theme-text-muted">{activity.time}</span>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 theme-text-muted mx-auto mb-3" />
                    <p className="theme-text-secondary">No recent activity</p>
                    <Link to="/courses" className="text-primary-600 hover:text-primary-700 text-sm">Start learning now</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'courses':
        return user?.role === 'instructor' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold theme-text-primary">My Courses</h3>
              <Link to="/instructor/course/create">
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instructorCourses.map((course) => (
                <div key={course.id} className="theme-card rounded-lg overflow-hidden border theme-border hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={course.thumbnail || 'https://via.placeholder.com/300x180/6366f1/ffffff?text=Course'}
                      alt={course.title}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute top-3 right-3">
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
                    <h4 className="font-semibold theme-text-primary mb-2 line-clamp-2">{course.title}</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold text-blue-600">{course.students || 0}</p>
                        <p className="text-xs theme-text-secondary">Students</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-green-600">${course.revenue || 0}</p>
                        <p className="text-xs theme-text-secondary">Revenue</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm ml-1">{course.rating || 0}</span>
                      </div>
                      <span className="text-xs theme-text-muted">${course.price}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Link to={`/instructor/course/${course.id}/builder`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Link to={`/courses/${course.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold theme-text-primary">My Courses</h3>
              <Link to="/courses">
                <Button variant="outline" size="sm">Browse More</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="theme-card p-4 rounded-lg border theme-border">
                  <div className="flex items-start space-x-4">
                    <img
                      src={enrollment.Course?.thumbnail || 'https://via.placeholder.com/80x60/6366f1/ffffff?text=Course'}
                      alt={enrollment.Course?.title}
                      className="w-20 h-15 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold theme-text-primary mb-1">{enrollment.Course?.title}</h4>
                      <p className="text-sm theme-text-secondary mb-2">Progress: {enrollment.progress}%</p>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                        <div 
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${enrollment.progress}%` }}
                        ></div>
                      </div>
                      <Link to={`/learn/${enrollment.Course?.id}`}>
                        <Button size="sm" className="w-full">
                          {enrollment.progress === 100 ? 'Review' : 'Continue'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'achievements':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold theme-text-primary">Achievements & Certificates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Dynamic achievements based on real progress */}
              {[
                { 
                  icon: Trophy, 
                  title: 'First Course Completed', 
                  description: 'Complete your first course', 
                  earned: stats.completedCourses >= 1, 
                  date: stats.completedCourses >= 1 ? new Date().toLocaleDateString() : null 
                },
                { 
                  icon: Flame, 
                  title: 'Learning Streak', 
                  description: `Learn for ${stats.currentStreak} days`, 
                  earned: stats.currentStreak >= 7, 
                  date: stats.currentStreak >= 7 ? new Date().toLocaleDateString() : null 
                },
                { 
                  icon: Star, 
                  title: 'Course Collector', 
                  description: 'Enroll in 5+ courses', 
                  earned: enrollments.length >= 5 
                },
                { 
                  icon: Target, 
                  title: 'Dedicated Learner', 
                  description: `Complete ${stats.completedCourses} courses`, 
                  earned: stats.completedCourses >= 3 
                },
              ].map((achievement, index) => (
                <div key={index} className={`theme-card p-6 rounded-lg border-2 transition-all ${
                  achievement.earned 
                    ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' 
                    : 'border-gray-200 dark:border-gray-700 opacity-60'
                }`}>
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      achievement.earned 
                        ? 'bg-yellow-400 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 theme-text-muted'
                    }`}>
                      <achievement.icon className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold theme-text-primary mb-2">{achievement.title}</h4>
                    <p className="text-sm theme-text-secondary mb-3">{achievement.description}</p>
                    {achievement.earned && achievement.date && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">Earned on {achievement.date}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-8">
            {/* Profile Information */}
            <div className="theme-card p-6 rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold theme-text-primary">Profile Information</h3>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="space-x-2">
                    <Button onClick={handleSave} size="sm">Save</Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">Cancel</Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                    <Input
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                  <div className="space-y-2">
                    <label className="block text-sm font-medium theme-text-primary">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full px-3 py-2 border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent theme-card theme-text-primary"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Input
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="City, Country"
                  />
                  <Input
                    label="Profession"
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Your job title"
                  />
                  <Input
                    label="Website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="theme-card p-6 rounded-lg">
              <h3 className="text-xl font-bold theme-text-primary mb-6">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="LinkedIn"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="https://linkedin.com/in/username"
                />
                <Input
                  label="Twitter"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="https://twitter.com/username"
                />
                <Input
                  label="GitHub"
                  name="github"
                  value={formData.github}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="https://github.com/username"
                />
              </div>
            </div>

            {/* Privacy & Notifications */}
            <div className="theme-card p-6 rounded-lg">
              <h3 className="text-xl font-bold theme-text-primary mb-6">Privacy & Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 theme-bg-secondary rounded-lg">
                  <div>
                    <h4 className="font-medium theme-text-primary">Email Notifications</h4>
                    <p className="text-sm theme-text-secondary">Receive updates about your courses</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-primary-600" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 theme-bg-secondary rounded-lg">
                  <div>
                    <h4 className="font-medium theme-text-primary">Profile Visibility</h4>
                    <p className="text-sm theme-text-secondary">Make your profile visible to other learners</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-primary-600" defaultChecked />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="theme-card rounded-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-purple-700 px-8 py-12 relative">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
                <div className="relative">
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Profile Preview" className="w-32 h-32 rounded-full object-cover" />
                    ) : user.avatar ? (
                      <img 
                        src={user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatar}`} 
                        alt="Profile" 
                        className="w-32 h-32 rounded-full object-cover" 
                      />
                    ) : (
                      <span className="text-4xl font-bold text-primary-600">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </span>
                    )}
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 bg-primary-600 text-white p-3 rounded-full hover:bg-primary-700 transition-colors shadow-lg"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                
                <div className="flex-1 text-white">
                  <h1 className="text-4xl font-bold mb-2">{user.firstName} {user.lastName}</h1>
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-bold capitalize shadow-xl border-2 border-white">
                      ✨ {user.role}
                    </span>
                    <span className="flex items-center text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-4 py-2 rounded-full shadow-xl border-2 border-white dark:border-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-300" />
                      <span className="font-semibold text-gray-800 dark:text-white">{formData.location || 'Location not set'}</span>
                    </span>
                  </div>
                  <p className="text-primary-100 mb-4 max-w-2xl">
                    {formData.bio || 'No bio added yet. Share something about yourself!'}
                  </p>
                  <div className="flex items-center space-x-6 text-sm">
                    {user?.role === 'instructor' ? (
                      <>
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          <span>{instructorStats.totalCourses} Courses</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          <span>{instructorStats.totalStudents} Students</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          <span>{instructorStats.avgRating.toFixed(1)} Rating</span>
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          <span>${instructorStats.totalRevenue} Earned</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          <span>{enrollments.length} Courses</span>
                        </div>
                        <div className="flex items-center">
                          <Trophy className="w-4 h-4 mr-1" />
                          <span>{getCompletedCount()} Completed</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{getTotalHours()}h Learned</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <button className="flex items-center justify-center bg-white dark:bg-black text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 font-semibold px-6 py-3 rounded-lg shadow-lg border border-gray-300 dark:border-gray-600">
                    <Share2 className="w-4 h-4 mr-2 text-black dark:text-white" />
                    <span className="text-black dark:text-white font-semibold">Share Profile</span>
                  </button>
                  <button className="flex items-center justify-center bg-white dark:bg-black text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 font-semibold px-6 py-3 rounded-lg shadow-lg border border-gray-300 dark:border-gray-600">
                    <Download className="w-4 h-4 mr-2 text-black dark:text-white" />
                    <span className="text-black dark:text-white font-semibold">Download CV</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="theme-card rounded-lg mb-8">
          <div className="border-b theme-border">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'courses', label: 'My Courses', icon: BookOpen },
                { id: 'achievements', label: 'Achievements', icon: Trophy },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent theme-text-secondary hover:theme-text-primary'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Profile;