import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/apiClient';
import { Logo } from '../components/Logo';

export function SignupPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create an account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm border border-border bg-bg-panel p-8">
        <div className="mb-6">
          <Logo className="mb-3" />
          <p className="text-sm text-text-muted">Create an account to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-text-muted">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-primary outline-none focus-visible:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-text-muted">Password</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-primary outline-none focus-visible:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-text-muted">Confirm password</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-primary outline-none focus-visible:border-accent"
            />
          </label>

          {error && <p className="text-sm text-status-critical">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded border border-accent bg-accent/10 px-4 py-2 text-sm text-text-primary disabled:opacity-50"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-accent">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
