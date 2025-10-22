import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Users, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import axios from 'axios';

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(data));
        setUserData(parsedData);
      } catch (error) {
        toast.error('Invalid user data');
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleComplete = async () => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/google/complete', {
        ...userData,
        role: selectedRole
      });

      login(response.data.user, response.data.token);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete signup');
    } finally {
      setLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center animate-slide-up">
          <div className="flex items-center justify-center mb-4">
            <img
              src={userData.avatar}
              alt="Profile"
              className="w-16 h-16 rounded-full animate-scale-in"
            />
          </div>
          <h2 className="text-3xl font-bold theme-text-primary">
            Welcome, {userData.firstName}!
          </h2>
          <p className="mt-2 theme-text-secondary">
            Choose how you'd like to use LearnHub
          </p>
        </div>

        <div className="theme-card py-8 px-6 rounded-lg animate-scale-in" style={{animationDelay: '0.3s'}}>
          <div className="space-y-4">
            {/* Student Option */}
            <div
              onClick={() => handleRoleSelect('student')}
              className={`relative rounded-lg border-2 cursor-pointer transition-all p-6 ${
                selectedRole === 'student'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'theme-border hover:border-primary-300'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  selectedRole === 'student' 
                    ? 'bg-primary-500 text-white' 
                    : 'theme-bg-secondary theme-text-primary'
                }`}>
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold theme-text-primary">
                    I want to learn
                  </h3>
                  <p className="theme-text-secondary text-sm mt-1">
                    Access courses, track progress, and earn certificates
                  </p>
                </div>
                {selectedRole === 'student' && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Instructor Option */}
            <div
              onClick={() => handleRoleSelect('instructor')}
              className={`relative rounded-lg border-2 cursor-pointer transition-all p-6 ${
                selectedRole === 'instructor'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'theme-border hover:border-primary-300'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  selectedRole === 'instructor' 
                    ? 'bg-primary-500 text-white' 
                    : 'theme-bg-secondary theme-text-primary'
                }`}>
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold theme-text-primary">
                    I want to teach
                  </h3>
                  <p className="theme-text-secondary text-sm mt-1">
                    Create courses, share knowledge, and build your audience
                  </p>
                </div>
                {selectedRole === 'instructor' && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Button
              onClick={handleComplete}
              loading={loading}
              disabled={!selectedRole}
              className="w-full"
              size="lg"
            >
              Complete Setup
            </Button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm theme-text-muted">
              You can change your role later in your profile settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;