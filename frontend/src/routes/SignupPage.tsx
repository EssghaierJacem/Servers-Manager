import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/apiClient';
import { Logo } from '../components/Logo';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';

export function SignupPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [organizationName, setOrganizationName] = useState('');
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
      await register(email, password, organizationName);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create an account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base px-4">
      <div
        aria-hidden="true"
        className="animate-blob pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-highlight/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-blob pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-accent/25 blur-3xl"
        style={{ animationDelay: '4s' }}
      />

      <Card className="animate-card-in relative w-full max-w-sm p-8">
        <div className="animate-field-in mb-7" style={{ animationDelay: '0.05s' }}>
          <Logo className="mb-4" />
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Start monitoring hosts, domains, and deployments in minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="animate-field-in" style={{ animationDelay: '0.1s' }}>
            <TextField
              label="Organization name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              autoComplete="organization"
              placeholder="Acme Corp"
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
            />
          </div>

          <div className="animate-field-in" style={{ animationDelay: '0.15s' }}>
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

          <div className="animate-field-in" style={{ animationDelay: '0.2s' }}>
            <TextField
              label="Password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div className="animate-field-in" style={{ animationDelay: '0.25s' }}>
            <TextField
              label="Confirm password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
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
            style={{ animationDelay: '0.3s' }}
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p
          className="animate-field-in mt-6 text-center text-sm text-text-muted"
          style={{ animationDelay: '0.35s' }}
        >
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent hover:text-accent-strong">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
