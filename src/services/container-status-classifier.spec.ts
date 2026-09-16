import { ServiceStatus } from './entities/service.entity';
import { classifyContainerStatus } from './container-status-classifier';

describe('classifyContainerStatus', () => {
  describe('running', () => {
    it.each([
      'Up 2 hours',
      'Up 3 minutes',
      'Up 5 seconds',
      'Up About an hour',
      'Up 2 days (healthy)',
      'Up 5 seconds (health: starting)',
      'Up 10 minutes, paused',
    ])('classifies "%s" as running', (raw) => {
      expect(classifyContainerStatus(raw)).toBe(ServiceStatus.RUNNING);
    });
  });

  describe('unhealthy', () => {
    it.each(['Up 1 second (unhealthy)', 'Up 4 hours (unhealthy)', 'Up 29 minutes (unhealthy)'])(
      'classifies "%s" as unhealthy',
      (raw) => {
        expect(classifyContainerStatus(raw)).toBe(ServiceStatus.UNHEALTHY);
      },
    );
  });

  describe('crash_loop', () => {
    it.each([
      'Restarting (1) 5 seconds ago',
      'Restarting (137) 2 minutes ago',
      'Restarting (0) Less than a second ago',
    ])('classifies "%s" as crash_loop', (raw) => {
      expect(classifyContainerStatus(raw)).toBe(ServiceStatus.CRASH_LOOP);
    });

    it('takes priority over "Up" if a status string somehow contained both', () => {
      expect(classifyContainerStatus('Restarting (1) 5 seconds ago, was Up 2 hours')).toBe(
        ServiceStatus.CRASH_LOOP,
      );
    });
  });

  describe('stopped', () => {
    it.each([
      'Exited (0) 3 minutes ago',
      'Exited (1) 2 seconds ago',
      'Exited (137) 10 days ago',
      'Exited (255) 5 minutes ago',
    ])('classifies "%s" as stopped', (raw) => {
      expect(classifyContainerStatus(raw)).toBe(ServiceStatus.STOPPED);
    });
  });

  describe('unknown / unparseable', () => {
    it.each([
      ['Created', 'a container that was created but never started'],
      ['Paused', 'a paused container with no Up/Exited/Restarting marker'],
      ['', 'an empty status string'],
      ['   ', 'a whitespace-only status string'],
      ['Removing', 'a status Docker introduces in a future version we do not recognize'],
      ['some totally unexpected garbage string', 'a deliberately malformed status'],
    ])('classifies "%s" (%s) as unknown', (raw) => {
      expect(classifyContainerStatus(raw)).toBe(ServiceStatus.UNKNOWN);
    });

    it('handles null/undefined input defensively rather than throwing', () => {
      expect(classifyContainerStatus(undefined as unknown as string)).toBe(ServiceStatus.UNKNOWN);
      expect(classifyContainerStatus(null as unknown as string)).toBe(ServiceStatus.UNKNOWN);
    });
  });
});
