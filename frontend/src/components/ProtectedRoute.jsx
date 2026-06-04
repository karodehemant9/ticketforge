import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const hasToken = !!localStorage.getItem('accessToken');

  // No token? Go to login immediately
  if (!hasToken) return <Navigate to="/login" replace />;
  
  // Has token? Render the page. The page itself handles loading/verifying.
  return <>{children}</>;
}