import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';

export default function RoleHome() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'mentor' ? '/mentor' : '/dashboard'} replace />;
}
