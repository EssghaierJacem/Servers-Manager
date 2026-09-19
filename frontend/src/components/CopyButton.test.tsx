import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { CopyButton } from './CopyButton';
import { ToastProvider } from '../context/ToastContext';

function renderWithToast(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('CopyButton', () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies the given value and confirms it', async () => {
    renderWithToast(<CopyButton value="paste-me" label="Copy command" />);

    const button = screen.getByRole('button', { name: 'Copy command' });
    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith('paste-me');
    expect(screen.getByRole('button', { name: 'Copied ✓' })).toBeInTheDocument();
  });

  it('reverts to the original label after the confirmation window', async () => {
    renderWithToast(<CopyButton value="paste-me" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
      await Promise.resolve();
    });
    expect(screen.getByRole('button', { name: 'Copied ✓' })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });

  it('is a real button, operable from the keyboard', () => {
    renderWithToast(<CopyButton value="paste-me" />);

    const button = screen.getByRole('button');
    expect(button.tagName).toBe('BUTTON');
    expect(button).not.toHaveAttribute('tabindex', '-1');
  });
});
