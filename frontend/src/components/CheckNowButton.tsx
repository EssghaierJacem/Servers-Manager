interface CheckNowButtonProps {
  onCheck: () => void;
  isPending: boolean;
}

/** The one "Check now" button shape shared by host/domain/service detail pages. */
export function CheckNowButton({ onCheck, isPending }: CheckNowButtonProps) {
  return (
    <button
      type="button"
      onClick={onCheck}
      disabled={isPending}
      className="rounded border border-border px-3 py-1.5 text-sm text-text-primary hover:border-accent disabled:opacity-50"
    >
      {isPending ? 'Checking...' : 'Check now'}
    </button>
  );
}
