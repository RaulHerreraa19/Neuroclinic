import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.some((r) => user.roles.includes(r))) return <Navigate to="/" replace />;

  return children;
}
