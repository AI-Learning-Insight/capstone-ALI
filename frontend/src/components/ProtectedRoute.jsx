import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';

export default function ProtectedRoute({ roles, children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;                       // atau spinner
  if (!user) return <Navigate to="/login" replace />;

  // jika roles dikirim, pastikan user.role ada di daftar
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }
  return children;
}
