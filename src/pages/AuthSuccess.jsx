import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    
    const token = searchParams.get('token');
    
    if (token) {
      hasProcessed.current = true;
      
      // Set token and fetch user data
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      axios.get('/api/auth/profile')
        .then(response => {
          login(response.data.user, token);
          toast.success('Successfully signed in with Google!');
          navigate('/', { replace: true });
        })
        .catch(() => {
          toast.error('Authentication failed');
          navigate('/login', { replace: true });
        });
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthSuccess;