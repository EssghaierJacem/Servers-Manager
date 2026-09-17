import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/apiClient';
import { Logo } from '../components/Logo';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to sign in. Check your credentials and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-7">
          <Logo className="mb-4" />
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">Welcome back</h1>
          <p className="mt-1 text-sm text-text-muted">
            Sign in to view the health of your infrastructure.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <TextField
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error && (
            <p className="rounded-lg bg-status-critical/10 px-3 py-2 text-sm text-status-critical">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-card transition-colors duration-150 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          No account yet?{' '}
          <Link to="/signup" className="font-medium text-accent hover:text-accent-strong">
            Create one
          </Link>
        </p>
      </Card>
    </div>
  );
}
