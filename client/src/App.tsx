import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AnnotationPage from './pages/AnnotationPage';
import AdminPage from './pages/AdminPage';
import { useAppDispatch } from './hooks/useAppDispatch';
import { useAppSelector } from './hooks/useAppSelector';
import { selectAuth } from './store/slices/authSlice';
import { fetchMe } from './store/slices/authSlice';

/**
 * Defines the authenticated and role-restricted routing table for the SPA.
 */
const App = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(selectAuth);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={user ? <DashboardPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/tasks/:taskId"
        element={user ? <AnnotationPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/admin"
        element={
          user?.role === 'Admin' ? <AdminPage /> : <Navigate to="/" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
