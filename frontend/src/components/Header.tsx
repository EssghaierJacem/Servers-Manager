import { useAuth } from '../context/AuthContext';
import { SignOutIcon } from './icons';

function initials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

/** The sticky top bar shown above every page - identity and sign-out live here. */
export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-end border-b border-border bg-bg-base/85 px-6 backdrop-blur-sm lg:px-10">
      {user && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-xs font-medium text-accent">
              {initials(user.email)}
            </span>
            <span className="hidden text-sm text-text-secondary sm:inline">{user.email}</span>
          </div>
          <span className="h-5 w-px bg-border" aria-hidden="true" />
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-muted transition-colors duration-150 hover:bg-bg-elevated hover:text-text-primary"
          >
            <SignOutIcon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      )}
    </header>
  );
}
