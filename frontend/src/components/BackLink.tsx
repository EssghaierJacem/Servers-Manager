import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from './icons';

/** The one "back to the list" link shape used by every detail page. */
export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex w-fit items-center gap-1 text-sm text-text-muted transition-colors duration-150 hover:text-text-primary"
    >
      <ChevronLeftIcon className="h-4 w-4" />
      {label}
    </Link>
  );
}
