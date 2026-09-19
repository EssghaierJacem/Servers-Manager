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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base px-4">
      <div
        aria-hidden="true"
        className="animate-blob pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-blob pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-highlight/15 blur-3xl"
        style={{ animationDelay: '4s' }}
      />

      <Card className="animate-card-in relative w-full max-w-sm p-8">
        <div className="animate-field-in mb-7" style={{ animationDelay: '0.05s' }}>
          <Logo className="mb-4" />
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">Welcome back</h1>
          <p className="mt-1 text-sm text-text-muted">
            Sign in to view the health of your infrastructure.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="animate-field-in" style={{ animationDelay: '0.1s' }}>
            <TextField
              label="Email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="animate-field-in" style={{ animationDelay: '0.15s' }}>
            <TextField
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error && (
            <p className="animate-shake rounded-lg bg-status-critical/10 px-3 py-2 text-sm text-status-critical">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="animate-field-in mt-2 rounded-lg btn-gradient px-4 py-2.5 text-sm font-medium shadow-card transition-all duration-150 ease-smooth hover:-translate-y-px hover:shadow-popover active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            style={{ animationDelay: '0.2s' }}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p
          className="animate-field-in mt-6 text-center text-sm text-text-muted"
          style={{ animationDelay: '0.25s' }}
        >
          No account yet?{' '}
          <Link to="/signup" className="font-medium text-accent hover:text-accent-strong">
            Create one
          </Link>
        </p>
      </Card>
    </div>
  );
}
