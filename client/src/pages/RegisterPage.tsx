import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../hooks';
import type { UserRole } from '../types/user';

/**
 * User registration form with role selection for quick bootstrap of demo data.
 */
const RegisterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error } = useAppSelector(state => state.auth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Annotator');

  /**
   * Creates the user account and redirects to the dashboard when finished.
   */
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await dispatch(register({ name, email, password, role }));
    if (register.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <div className="auth-container">
      <h1>Create Account</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Name
          <input value={name} onChange={event => setName(event.target.value)} required />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            required
          />
        </label>
        <label>
          Role
          <select
            value={role}
            onChange={event => setRole(event.target.value as UserRole)}
            required
          >
            <option value="Annotator">Annotator</option>
            <option value="Reviewer">Reviewer</option>
            <option value="Admin">Admin</option>
          </select>
        </label>
        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Registering...' : 'Register'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
