import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import LoadingScreen from './components/common/LoadingScreen';
import { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthSuccess from './pages/AuthSuccess';
import RoleSelection from './pages/RoleSelection';
import CourseLearn from './pages/CourseLearn';
import Profile from './pages/Profile';
import MyLearning from './pages/MyLearning';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import CreateCourse from './pages/instructor/CreateCourse';
import EditCourse from './pages/instructor/EditCourse';
import CourseBuilder from './pages/instructor/CourseBuilder';
import InstructorCourses from './pages/instructor/InstructorCourses';
import RevenueAnalytics from './pages/instructor/RevenueAnalytics';
import AssignmentSubmissions from './pages/instructor/AssignmentSubmissions';
import CourseReviews from './pages/instructor/CourseReviews';
import CreateTextLecture from './components/instructor/CreateTextLecture';
import GradeSubmission from './pages/instructor/GradeSubmission';
import JitsiLiveClassRoom from './components/live/JitsiLiveClassRoom';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'https://ai-tutor-backend-gq6g.onrender.com';

// Clear invalid tokens on app load
const token = localStorage.getItem('token');
if (token === 'null' || token === 'undefined' || !token) {
  localStorage.removeItem('token');
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }
  
  return (
    <Router>
      <div className={`min-h-screen theme-bg-primary theme-text-primary ${isDark ? 'dark' : ''} animate-fade-in`}>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/learn/:id" element={<CourseLearn />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/success" element={<AuthSuccess />} />
            <Route path="/auth/role-selection" element={<RoleSelection />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-learning" element={<MyLearning />} />
            <Route path="/instructor" element={<Navigate to="/instructor/dashboard" replace />} />
            <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
            <Route path="/instructor/courses" element={<InstructorCourses />} />
            <Route path="/instructor/analytics" element={<RevenueAnalytics />} />
            <Route path="/instructor/course/create" element={<CreateCourse />} />
            <Route path="/instructor/course/:id/edit" element={<EditCourse />} />
            <Route path="/instructor/course/:id/builder" element={<CourseBuilder />} />
            <Route path="/instructor/submissions/:quizId" element={<AssignmentSubmissions />} />
            <Route path="/instructor/course/:courseId/reviews" element={<CourseReviews />} />
            <Route path="/instructor/text-lecture/create" element={<CreateTextLecture />} />
            <Route path="/instructor/grade/:submissionId" element={<GradeSubmission />} />
            <Route path="/instructor/live-class/:meetingId" element={<JitsiLiveClassRoom />} />
        <Route path="/student/live-class/:meetingId" element={<JitsiLiveClassRoom />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="*" element={<div className="p-8 text-center theme-text-primary">404 - Page Not Found</div>} />
          </Routes>
        </main>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: isDark ? 'dark' : '',
          }}
        />
      </div>
    </Router>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;