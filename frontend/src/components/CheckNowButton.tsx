interface CheckNowButtonProps {
  onCheck: () => void;
  isPending: boolean;
  label?: string;
  pendingLabel?: string;
}

/** The one "Check now" button shape shared by host/domain/service detail pages. */
export function CheckNowButton({
  onCheck,
  isPending,
  label = 'Check now',
  pendingLabel = 'Checking…',
}: CheckNowButtonProps) {
  return (
    <button
      type="button"
      onClick={onCheck}
      disabled={isPending}
      className="rounded-lg border border-border bg-bg-panel px-3.5 py-2 text-sm font-medium text-text-primary transition-colors duration-150 hover:border-border-strong hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? pendingLabel : label}
    </button>
  );
}
