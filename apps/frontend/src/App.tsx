import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { TasksPage } from './pages/TasksPage';

export function App() {
  const { user, loading } = useAuth();

  if (loading) return null;
  return user ? <TasksPage /> : <LoginPage />;
}
