import { useAuth } from '../context/AuthContext';

const DebugAuth = () => {
  const { user, isAuthenticated } = useAuth();
  const token = localStorage.getItem('token');
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'black', 
      color: 'white', 
      padding: '10px', 
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div><strong>Debug Auth:</strong></div>
      <div>isAuthenticated: {String(isAuthenticated)}</div>
      <div>user: {user ? JSON.stringify(user, null, 2) : 'null'}</div>
      <div>token: {token || 'null'}</div>
      <div>token length: {token?.length || 0}</div>
      <button 
        onClick={() => {
          localStorage.removeItem('token');
          window.location.reload();
        }}
        style={{ marginTop: '5px', padding: '2px 5px' }}
      >
        Clear Token
      </button>
    </div>
  );
};

export default DebugAuth;