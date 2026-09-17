import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from './Logo';
import { DomainsIcon, HostsIcon, OverviewIcon, SignOutIcon } from './icons';

const NAV_LINK_CLASS =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-bg-base hover:text-text-primary aria-[current=page]:bg-accent/10 aria-[current=page]:text-accent';

const NAV_ITEMS = [
  { to: '/', end: true, label: 'Overview', Icon: OverviewIcon },
  { to: '/hosts', end: false, label: 'Hosts', Icon: HostsIcon },
  { to: '/domains', end: false, label: 'Domains', Icon: DomainsIcon },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-full">
      <aside className="flex w-16 shrink-0 flex-col justify-between overflow-hidden border-r border-border bg-bg-panel py-5 lg:w-[240px]">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-2.5 px-3 lg:px-4">
            <LogoMark className="h-6 w-6 shrink-0 text-accent" />
            <span className="hidden font-mono text-sm text-text-primary lg:inline">
              Servers-Manager
            </span>
          </div>

          <nav className="flex flex-col gap-1 px-2 lg:px-3">
            {NAV_ITEMS.map(({ to, end, label, Icon }) => (
              <NavLink key={to} to={to} end={end} className={NAV_LINK_CLASS}>
                <Icon className="h-5 w-5 shrink-0" />
                <span className="hidden lg:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-2 pt-4 lg:px-3">
          {user && (
            <span className="hidden truncate font-mono text-xs text-text-muted lg:block">
              {user.email}
            </span>
          )}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-bg-base hover:text-text-primary"
          >
            <SignOutIcon className="h-5 w-5 shrink-0" />
            <span className="hidden lg:inline">Sign out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
