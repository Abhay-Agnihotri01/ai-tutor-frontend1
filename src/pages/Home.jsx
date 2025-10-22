import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Users, Award } from 'lucide-react';
import CourseCard from '../components/course/CourseCard';
import CategoriesSection from '../components/common/CategoriesSection';
import Button from '../components/common/Button';
import axios from 'axios';

const Home = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchFeaturedCourses();
      hasFetched.current = true;
    }
  }, []);

  const fetchFeaturedCourses = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${apiUrl}/api/courses?limit=3`);
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="theme-hero text-white py-20 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-slide-up">
              Learn Without Limits
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
              Discover thousands of courses from expert instructors and advance your career
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{animationDelay: '0.4s'}}>
              <Link to="/courses">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Explore Courses
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary-600">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <CategoriesSection />

      {/* Stats Section */}
      <section className="py-16 theme-bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center animate-scale-in" style={{animationDelay: '0.1s'}}>
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-3xl font-bold theme-text-primary mb-2">10,000+</h3>
              <p className="theme-text-muted">Online Courses</p>
            </div>
            <div className="flex flex-col items-center animate-scale-in" style={{animationDelay: '0.2s'}}>
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-3xl font-bold theme-text-primary mb-2">50,000+</h3>
              <p className="theme-text-muted">Active Students</p>
            </div>
            <div className="flex flex-col items-center animate-scale-in" style={{animationDelay: '0.3s'}}>
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-3xl font-bold theme-text-primary mb-2">1,000+</h3>
              <p className="theme-text-muted">Expert Instructors</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold theme-text-primary mb-4">
              Featured Courses
            </h2>
            <p className="text-lg theme-text-secondary max-w-2xl mx-auto">
              Discover our most popular courses taught by industry experts
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="theme-bg-tertiary rounded-lg h-80 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/courses">
              <Button size="lg">View All Courses</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 dark:bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of students already learning on our platform
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary">
              Start Learning Today
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;