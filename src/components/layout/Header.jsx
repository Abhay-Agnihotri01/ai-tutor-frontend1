import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, Menu, X, User, LogOut, Search, BookOpen, Play, Award, Bell, ShoppingCart, Heart, ChevronDown, Globe, Briefcase, Code, Palette, Camera, Music, Dumbbell, TrendingUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import Button from '../common/Button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isDark, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const menuRef = useRef(null);
  const categoriesRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchRef = useRef(null);

  const categories = [
    { name: 'Development', icon: Code, subcategories: ['Web Development', 'Mobile Development', 'Programming Languages', 'Game Development', 'Database Design', 'Software Testing'] },
    { name: 'Business', icon: Briefcase, subcategories: ['Entrepreneurship', 'Communication', 'Management', 'Sales', 'Strategy', 'Operations'] },
    { name: 'Finance & Accounting', icon: TrendingUp, subcategories: ['Accounting & Bookkeeping', 'Cryptocurrency', 'Finance', 'Financial Modeling', 'Investing & Trading', 'Money Management'] },
    { name: 'IT & Software', icon: Globe, subcategories: ['IT Certifications', 'Network & Security', 'Hardware', 'Operating Systems', 'Other IT & Software'] },
    { name: 'Office Productivity', icon: Briefcase, subcategories: ['Microsoft', 'Apple', 'Google', 'SAP', 'Oracle', 'Other Office Productivity'] },
    { name: 'Personal Development', icon: User, subcategories: ['Personal Transformation', 'Personal Productivity', 'Leadership', 'Career Development', 'Parenting & Relationships', 'Happiness'] },
    { name: 'Design', icon: Palette, subcategories: ['Web Design', 'Graphic Design', 'Design Tools', 'User Experience Design', 'Game Design', '3D & Animation'] },
    { name: 'Marketing', icon: TrendingUp, subcategories: ['Digital Marketing', 'Search Engine Optimization', 'Social Media Marketing', 'Branding', 'Marketing Fundamentals', 'Analytics & Automation'] },
    { name: 'Lifestyle', icon: Heart, subcategories: ['Arts & Crafts', 'Beauty & Makeup', 'Esoteric Practices', 'Food & Beverage', 'Gaming', 'Home Improvement'] },
    { name: 'Photography & Video', icon: Camera, subcategories: ['Digital Photography', 'Photography', 'Portrait Photography', 'Photography Tools', 'Commercial Photography', 'Video Design'] },
    { name: 'Health & Fitness', icon: Dumbbell, subcategories: ['Fitness', 'General Health', 'Sports', 'Nutrition & Diet', 'Yoga', 'Mental Health'] },
    { name: 'Music', icon: Music, subcategories: ['Instruments', 'Music Production', 'Music Fundamentals', 'Vocal', 'Music Techniques', 'Music Software'] }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(event.target)) {
        setIsCategoriesOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    if (isProfileOpen || isMenuOpen || isCategoriesOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen, isMenuOpen, isCategoriesOpen, isNotificationsOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="theme-card border-b theme-border animate-slide-in-left sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-8 h-8 theme-logo rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="text-xl font-bold theme-text-primary hidden sm:block">LearnHub</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {/* Categories Dropdown */}
            <div className="relative" ref={categoriesRef}>
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="flex items-center space-x-1 theme-text-secondary hover:text-primary-600 py-2"
              >
                <span>Categories</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isCategoriesOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 theme-card rounded-lg shadow-xl theme-border border animate-scale-in z-50">
                  <div className="p-4 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-2">
                      {categories.map((category) => (
                        <div key={category.name} className="group">
                          <Link
                            to={`/courses?category=${encodeURIComponent(category.name.toLowerCase())}`}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:theme-bg-secondary transition-colors"
                            onClick={() => setIsCategoriesOpen(false)}
                          >
                            <category.icon className="w-5 h-5 text-primary-600" />
                            <span className="font-medium theme-text-primary">{category.name}</span>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative flex-1 max-w-md" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 theme-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for courses..."
                  className="w-full pl-10 pr-4 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </form>

            {/* Quick Links */}
            {isAuthenticated && user?.role === 'instructor' && (
              <Link to="/instructor/dashboard" className="theme-text-secondary hover:text-primary-600 font-medium">
                Instructor
              </Link>
            )}
            
            {isAuthenticated && user?.role === 'student' && (
              <Link to="/my-learning" className="theme-text-secondary hover:text-primary-600 font-medium">
                My Learning
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="lg:hidden">
              <button type="submit" className="p-2 rounded-lg theme-bg-secondary hover:theme-bg-tertiary transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </form>

            {/* Notifications (for authenticated users) */}
            {isAuthenticated && (
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 rounded-lg theme-bg-secondary hover:theme-bg-tertiary transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">3</span>
                </button>
                
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 theme-card rounded-lg shadow-xl theme-border border animate-scale-in z-50">
                    <div className="p-4">
                      <h3 className="font-semibold theme-text-primary mb-3">Notifications</h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        <div className="p-3 theme-bg-secondary rounded-lg">
                          <p className="text-sm theme-text-primary">New course available: Advanced React Patterns</p>
                          <p className="text-xs theme-text-muted mt-1">2 hours ago</p>
                        </div>
                        <div className="p-3 theme-bg-secondary rounded-lg">
                          <p className="text-sm theme-text-primary">Assignment graded in JavaScript Fundamentals</p>
                          <p className="text-xs theme-text-muted mt-1">1 day ago</p>
                        </div>
                        <div className="p-3 theme-bg-secondary rounded-lg">
                          <p className="text-sm theme-text-primary">Live class starting in 30 minutes</p>
                          <p className="text-xs theme-text-muted mt-1">2 days ago</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t theme-border">
                        <Link to="/notifications" className="text-sm text-primary-600 hover:text-primary-700">
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Wishlist (for students) */}
            {isAuthenticated && user?.role === 'student' && (
              <Link to="/wishlist" className="p-2 rounded-lg theme-bg-secondary hover:theme-bg-tertiary transition-colors relative">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-medium">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart (for students) */}
            {isAuthenticated && user?.role === 'student' && (
              <Link to="/cart" className="p-2 rounded-lg theme-bg-secondary hover:theme-bg-tertiary transition-colors relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full text-xs flex items-center justify-center text-white font-medium">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg theme-bg-secondary hover:theme-bg-tertiary transition-all duration-200"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Auth buttons */}
            {isAuthenticated ? (
              <div 
                className="relative" 
                ref={profileRef}
              >
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:theme-bg-secondary transition-all duration-200 cursor-pointer"
                >
                  <div className="w-8 h-8 theme-logo rounded-full flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img 
                        src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full object-cover" 
                      />
                    ) : (
                      <span className="text-white text-sm font-medium">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 theme-card rounded-lg shadow-xl theme-border border animate-scale-in z-50">
                    <div className="p-4 border-b theme-border">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 theme-logo rounded-full flex items-center justify-center overflow-hidden">
                          {user?.avatar ? (
                            <img 
                              src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`} 
                              alt="Profile" 
                              className="w-12 h-12 rounded-full object-cover" 
                            />
                          ) : (
                            <span className="text-white font-medium">
                              {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium theme-text-primary">{user?.firstName} {user?.lastName}</p>
                          <p className="text-sm theme-text-muted">{user?.email}</p>
                          <p className="text-xs text-primary-600 capitalize">{user?.role}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/profile"
                        className="flex items-center space-x-3 w-full p-3 text-left hover:theme-bg-secondary rounded-lg theme-text-primary transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="w-5 h-5" />
                        <span>View Profile</span>
                      </Link>
                      
                      {user?.role === 'instructor' ? (
                        <>
                          <Link
                            to="/instructor/dashboard"
                            className="flex items-center space-x-3 w-full p-3 text-left hover:theme-bg-secondary rounded-lg theme-text-primary transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <BookOpen className="w-5 h-5" />
                            <span>Instructor Dashboard</span>
                          </Link>
                          <Link
                            to="/instructor/courses"
                            className="flex items-center space-x-3 w-full p-3 text-left hover:theme-bg-secondary rounded-lg theme-text-primary transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <Play className="w-5 h-5" />
                            <span>My Courses</span>
                          </Link>
                          <Link
                            to="/instructor/analytics"
                            className="flex items-center space-x-3 w-full p-3 text-left hover:theme-bg-secondary rounded-lg theme-text-primary transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <TrendingUp className="w-5 h-5" />
                            <span>Analytics</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/my-learning"
                            className="flex items-center space-x-3 w-full p-3 text-left hover:theme-bg-secondary rounded-lg theme-text-primary transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <BookOpen className="w-5 h-5" />
                            <span>My Learning</span>
                          </Link>
                          <Link
                            to="/wishlist"
                            className="flex items-center space-x-3 w-full p-3 text-left hover:theme-bg-secondary rounded-lg theme-text-primary transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <Heart className="w-5 h-5" />
                            <span>Wishlist</span>
                          </Link>
                          <Link
                            to="/certificates"
                            className="flex items-center space-x-3 w-full p-3 text-left hover:theme-bg-secondary rounded-lg theme-text-primary transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <Award className="w-5 h-5" />
                            <span>Certificates</span>
                          </Link>
                        </>
                      )}
                      
                      <div className="border-t theme-border my-2"></div>
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileOpen(false);
                        }}
                        className="flex items-center space-x-3 w-full p-3 text-left hover:theme-bg-secondary rounded-lg text-red-600 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="outline">Log In</Button>
                </Link>
                <Link to="/register">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:theme-bg-secondary transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)} />
            <div ref={menuRef} className="absolute top-16 right-4 w-80 theme-card rounded-lg shadow-xl theme-border border animate-scale-in max-h-[80vh] overflow-y-auto">
              <div className="p-4">
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 theme-text-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search courses..."
                      className="w-full pl-10 pr-4 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </form>

                <nav className="space-y-2">
                  <Link 
                    to="/courses" 
                    className="flex items-center space-x-3 theme-text-secondary hover:text-primary-600 py-3 px-3 rounded-lg hover:theme-bg-secondary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>All Courses</span>
                  </Link>
                  
                  {isAuthenticated && user?.role === 'student' && (
                    <>
                      <Link 
                        to="/my-learning" 
                        className="flex items-center space-x-3 theme-text-secondary hover:text-primary-600 py-3 px-3 rounded-lg hover:theme-bg-secondary transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Play className="w-5 h-5" />
                        <span>My Learning</span>
                      </Link>
                      <Link 
                        to="/wishlist" 
                        className="flex items-center space-x-3 theme-text-secondary hover:text-primary-600 py-3 px-3 rounded-lg hover:theme-bg-secondary transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Heart className="w-5 h-5" />
                        <span>Wishlist</span>
                      </Link>
                    </>
                  )}
                  
                  {isAuthenticated && user?.role === 'instructor' && (
                    <>
                      <Link 
                        to="/instructor/dashboard" 
                        className="flex items-center space-x-3 theme-text-secondary hover:text-primary-600 py-3 px-3 rounded-lg hover:theme-bg-secondary transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <BookOpen className="w-5 h-5" />
                        <span>Instructor Dashboard</span>
                      </Link>
                      <Link 
                        to="/instructor/courses" 
                        className="flex items-center space-x-3 theme-text-secondary hover:text-primary-600 py-3 px-3 rounded-lg hover:theme-bg-secondary transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Play className="w-5 h-5" />
                        <span>My Courses</span>
                      </Link>
                    </>
                  )}

                  {/* Categories in Mobile */}
                  <div className="border-t theme-border pt-3 mt-3">
                    <p className="text-sm font-medium theme-text-muted mb-2 px-3">Categories</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {categories.slice(0, 8).map((category) => (
                        <Link
                          key={category.name}
                          to={`/courses?category=${encodeURIComponent(category.name.toLowerCase())}`}
                          className="flex items-center space-x-3 py-2 px-3 rounded-lg hover:theme-bg-secondary transition-colors theme-text-secondary hover:text-primary-600"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <category.icon className="w-4 h-4" />
                          <span className="text-sm">{category.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {!isAuthenticated && (
                    <div className="flex flex-col space-y-2 pt-4 border-t theme-border">
                      <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full">Log In</Button>
                      </Link>
                      <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full">Sign Up</Button>
                      </Link>
                    </div>
                  )}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;