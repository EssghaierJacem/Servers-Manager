import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINK_CLASS =
  'px-3 py-1.5 rounded text-sm text-text-muted hover:text-text-primary aria-[current=page]:text-text-primary aria-[current=page]:bg-bg-panel';

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-full">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-text-primary">
              Infrastructure command center
            </span>
            <nav className="flex items-center gap-1">
              <NavLink to="/" end className={NAV_LINK_CLASS}>
                Overview
              </NavLink>
              <NavLink to="/hosts" className={NAV_LINK_CLASS}>
                Hosts
              </NavLink>
              <NavLink to="/domains" className={NAV_LINK_CLASS}>
                Domains
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user && <span className="font-mono text-xs text-text-muted">{user.email}</span>}
            <button
              type="button"
              onClick={logout}
              className="rounded border border-border px-3 py-1.5 text-sm text-text-muted hover:text-text-primary"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
