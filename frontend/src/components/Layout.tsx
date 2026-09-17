import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from './Logo';
import { DomainsIcon, HostsIcon, OverviewIcon, SignOutIcon } from './icons';

const NAV_LINK_CLASS =
  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted transition-colors duration-150 hover:bg-bg-elevated hover:text-text-primary aria-[current=page]:bg-accent/10 aria-[current=page]:text-text-primary';

const NAV_ITEMS = [
  { to: '/', end: true, label: 'Overview', Icon: OverviewIcon },
  { to: '/hosts', end: false, label: 'Hosts', Icon: HostsIcon },
  { to: '/domains', end: false, label: 'Domains', Icon: DomainsIcon },
];

function initials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-full">
      <aside className="flex w-16 shrink-0 flex-col justify-between overflow-hidden border-r border-border bg-bg-panel py-5 lg:w-60">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-2.5 px-4">
            <LogoMark className="h-6 w-6 shrink-0 text-accent" />
            <span className="hidden text-[15px] font-semibold tracking-tight text-text-primary lg:inline">
              Servers-Manager
            </span>
          </div>

          <nav className="flex flex-col gap-1 px-2.5">
            {NAV_ITEMS.map(({ to, end, label, Icon }) => (
              <NavLink key={to} to={to} end={end} className={NAV_LINK_CLASS}>
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent opacity-0 transition-opacity duration-150 group-aria-[current=page]:opacity-100"
                />
                <Icon className="h-[18px] w-[18px] shrink-0 text-text-muted transition-colors duration-150 group-hover:text-text-primary group-aria-[current=page]:text-accent" />
                <span className="hidden lg:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-2.5 pt-4">
          {user && (
            <div className="flex items-center gap-2.5 px-1">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-[11px] font-medium text-accent">
                {initials(user.email)}
              </span>
              <span className="hidden truncate text-sm text-text-secondary lg:inline">
                {user.email}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted transition-colors duration-150 hover:bg-bg-elevated hover:text-text-primary"
          >
            <SignOutIcon className="h-[18px] w-[18px] shrink-0" />
            <span className="hidden lg:inline">Sign out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-[1400px] animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
