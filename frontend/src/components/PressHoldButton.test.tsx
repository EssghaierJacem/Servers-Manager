import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { HOLD_DURATION_MS, PressHoldButton } from './PressHoldButton';

function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('PressHoldButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not confirm on a plain click (pointer down + up with no hold)', () => {
    const onConfirm = vi.fn();
    render(<PressHoldButton label="Hold to roll back" onConfirm={onConfirm} />);

    const button = screen.getByRole('button');
    fireEvent.pointerDown(button);
    fireEvent.pointerUp(button);
    advance(HOLD_DURATION_MS);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('confirms after being held for the full duration', () => {
    const onConfirm = vi.fn();
    render(<PressHoldButton label="Hold to roll back" onConfirm={onConfirm} />);

    fireEvent.pointerDown(screen.getByRole('button'));
    advance(HOLD_DURATION_MS);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not confirm if released before the hold duration elapses', () => {
    const onConfirm = vi.fn();
    render(<PressHoldButton label="Hold to roll back" onConfirm={onConfirm} />);

    const button = screen.getByRole('button');
    fireEvent.pointerDown(button);
    advance(HOLD_DURATION_MS - 100);
    fireEvent.pointerUp(button);
    advance(200);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('cancels the hold when the pointer leaves the button', () => {
    const onConfirm = vi.fn();
    render(<PressHoldButton label="Hold to roll back" onConfirm={onConfirm} />);

    const button = screen.getByRole('button');
    fireEvent.pointerDown(button);
    advance(HOLD_DURATION_MS - 100);
    fireEvent.pointerLeave(button);
    advance(200);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('confirms when held via keyboard (Enter)', () => {
    const onConfirm = vi.fn();
    render(<PressHoldButton label="Hold to roll back" onConfirm={onConfirm} />);

    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    advance(HOLD_DURATION_MS);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('confirms when held via keyboard (Space)', () => {
    const onConfirm = vi.fn();
    render(<PressHoldButton label="Hold to roll back" onConfirm={onConfirm} />);

    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: ' ' });
    advance(HOLD_DURATION_MS);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('cancels a keyboard hold on key up before the duration elapses', () => {
    const onConfirm = vi.fn();
    render(<PressHoldButton label="Hold to roll back" onConfirm={onConfirm} />);

    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    advance(HOLD_DURATION_MS - 100);
    fireEvent.keyUp(button, { key: 'Enter' });
    advance(200);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('ignores key repeat restarting the timer (does not fire early)', () => {
    const onConfirm = vi.fn();
    render(<PressHoldButton label="Hold to roll back" onConfirm={onConfirm} />);

    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    advance(500);
    // Simulate the browser's key-repeat firing keydown again mid-hold.
    fireEvent.keyDown(button, { key: 'Enter' });
    advance(500);

    expect(onConfirm).not.toHaveBeenCalled();

    advance(HOLD_DURATION_MS - 1000);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not start a hold when disabled', () => {
    const onConfirm = vi.fn();
    render(<PressHoldButton label="Hold to roll back" onConfirm={onConfirm} disabled />);

    fireEvent.pointerDown(screen.getByRole('button'));
    advance(HOLD_DURATION_MS);

    expect(onConfirm).not.toHaveBeenCalled();
  });
});
