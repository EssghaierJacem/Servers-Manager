import { AlertEvaluationService } from '../alerts/alert-evaluation.service';
import { HostStatus } from '../hosts/entities/host.entity';
import { InsightsService } from './insights.service';
import { InsightFlag } from './entities/insight-state.entity';

function host(overrides: Record<string, unknown> = {}) {
  return {
    id: 'host-1',
    orgId: 'org-1',
    name: 'prod-01',
    status: HostStatus.HEALTHY,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    ...overrides,
  };
}

describe('InsightsService', () => {
  let hostRepository: { find: jest.Mock };
  let domainRepository: { find: jest.Mock };
  let serviceRepository: { find: jest.Mock };
  let insightStateRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let alertEvaluationService: { evaluateDirectCondition: jest.Mock };
  let service: InsightsService;

  beforeEach(() => {
    hostRepository = { find: jest.fn() };
    domainRepository = { find: jest.fn() };
    serviceRepository = { find: jest.fn() };
    insightStateRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((input) => input),
      save: jest.fn((input) => Promise.resolve(input)),
    };
    alertEvaluationService = { evaluateDirectCondition: jest.fn() };

    service = new InsightsService(
      hostRepository as never,
      domainRepository as never,
      serviceRepository as never,
      insightStateRepository as never,
      alertEvaluationService as unknown as AlertEvaluationService,
    );
  });

  describe('computeIdleHosts', () => {
    it('excludes a candidate host that has a running service', async () => {
      const idleCandidate = host({ id: 'host-1' });
      hostRepository.find.mockResolvedValue([idleCandidate]);
      serviceRepository.find.mockResolvedValue([{ hostId: 'host-1' }]);

      const result = await service.computeIdleHosts();

      expect(result).toEqual([]);
    });

    it('includes a healthy, aged host with zero running services', async () => {
      const idleCandidate = host({ id: 'host-1' });
      hostRepository.find.mockResolvedValue([idleCandidate]);
      serviceRepository.find.mockResolvedValue([]);

      const result = await service.computeIdleHosts();

      expect(result).toEqual([idleCandidate]);
    });

    it('short-circuits without querying services when there are no candidate hosts', async () => {
      hostRepository.find.mockResolvedValue([]);

      const result = await service.computeIdleHosts();

      expect(result).toEqual([]);
      expect(serviceRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('computeOrphanedDomains', () => {
    it('flags a domain with no host_id', async () => {
      domainRepository.find.mockResolvedValue([
        { id: 'd1', orgId: 'org-1', hostId: null, resolvedIp: null, hostname: 'a.com' },
      ]);
      hostRepository.find.mockResolvedValue([{ ipAddress: '10.0.0.1' }]);

      const result = await service.computeOrphanedDomains();

      expect(result).toHaveLength(1);
    });

    it('flags a domain whose resolved_ip matches no known host', async () => {
      domainRepository.find.mockResolvedValue([
        { id: 'd1', orgId: 'org-1', hostId: 'h1', resolvedIp: '203.0.113.5', hostname: 'a.com' },
      ]);
      hostRepository.find.mockResolvedValue([{ ipAddress: '10.0.0.1' }]);

      const result = await service.computeOrphanedDomains();

      expect(result).toHaveLength(1);
    });

    it('does not flag a domain whose resolved_ip matches a known host', async () => {
      domainRepository.find.mockResolvedValue([
        { id: 'd1', orgId: 'org-1', hostId: 'h1', resolvedIp: '10.0.0.1', hostname: 'a.com' },
      ]);
      hostRepository.find.mockResolvedValue([{ ipAddress: '10.0.0.1' }]);

      const result = await service.computeOrphanedDomains();

      expect(result).toEqual([]);
    });

    it('does not flag a domain that has not resolved yet (resolved_ip null, host_id set)', async () => {
      domainRepository.find.mockResolvedValue([
        { id: 'd1', orgId: 'org-1', hostId: 'h1', resolvedIp: null, hostname: 'a.com' },
      ]);
      hostRepository.find.mockResolvedValue([{ ipAddress: '10.0.0.1' }]);

      const result = await service.computeOrphanedDomains();

      expect(result).toEqual([]);
    });
  });

  describe('computeOrphanedHosts', () => {
    it('flags a host with no domain referencing it', async () => {
      hostRepository.find.mockResolvedValue([{ id: 'h1', orgId: 'org-1' }]);
      domainRepository.find.mockResolvedValue([]);

      const result = await service.computeOrphanedHosts();

      expect(result).toHaveLength(1);
    });

    it('does not flag a host referenced by a domain', async () => {
      hostRepository.find.mockResolvedValue([{ id: 'h1', orgId: 'org-1' }]);
      domainRepository.find.mockResolvedValue([{ hostId: 'h1' }]);

      const result = await service.computeOrphanedHosts();

      expect(result).toEqual([]);
    });
  });

  describe('runDailyCheck edge detection', () => {
    it('alerts only the first time a host becomes idle, not on a subsequent run where it is still idle', async () => {
      const idleHost = host({ id: 'host-1' });

      // First run: host is idle, no prior state recorded.
      hostRepository.find.mockResolvedValue([idleHost]);
      serviceRepository.find.mockResolvedValue([]);
      domainRepository.find.mockResolvedValue([]);
      insightStateRepository.find.mockResolvedValue([]); // no previous states at all
      insightStateRepository.findOne.mockResolvedValue(null);

      await service.runDailyCheck();

      const idleAlertCalls = alertEvaluationService.evaluateDirectCondition.mock.calls.filter(
        ([arg]) => arg.condition === 'system:idle_host_detected',
      );
      expect(idleAlertCalls).toHaveLength(1);
      expect(idleAlertCalls[0][0].entityId).toBe('host-1');

      alertEvaluationService.evaluateDirectCondition.mockClear();

      // Second run: host is still idle, and this time the previous-state
      // lookup reflects that it was already active.
      insightStateRepository.find.mockResolvedValue([
        { entityId: 'host-1', flag: InsightFlag.IDLE_HOST, active: true },
      ]);
      insightStateRepository.findOne.mockResolvedValue({
        entityId: 'host-1',
        flag: InsightFlag.IDLE_HOST,
        active: true,
      });

      await service.runDailyCheck();

      const secondRunIdleAlerts = alertEvaluationService.evaluateDirectCondition.mock.calls.filter(
        ([arg]) => arg.condition === 'system:idle_host_detected',
      );
      expect(secondRunIdleAlerts).toHaveLength(0);
    });

    it('re-fires once a host leaves and later re-enters the idle set', async () => {
      const idleHost = host({ id: 'host-1' });

      // Run 1: becomes idle.
      hostRepository.find.mockResolvedValue([idleHost]);
      serviceRepository.find.mockResolvedValue([]);
      domainRepository.find.mockResolvedValue([]);
      insightStateRepository.find.mockResolvedValue([]);
      insightStateRepository.findOne.mockResolvedValue(null);
      await service.runDailyCheck();
      alertEvaluationService.evaluateDirectCondition.mockClear();

      // Run 2: no longer idle (e.g. a container is now running) -> flag flips off.
      hostRepository.find.mockResolvedValue([]); // computeIdleHosts short-circuits to []
      insightStateRepository.find.mockResolvedValue([
        { entityId: 'host-1', flag: InsightFlag.IDLE_HOST, active: true },
      ]);
      insightStateRepository.findOne.mockResolvedValue({
        entityId: 'host-1',
        flag: InsightFlag.IDLE_HOST,
        active: true,
      });
      await service.runDailyCheck();
      expect(alertEvaluationService.evaluateDirectCondition).not.toHaveBeenCalled();

      // Run 3: idle again -> should re-fire since the flag was flipped off in run 2.
      // The mock repository doesn't apply the real `where: { active: true }`
      // filter, so the fixture simulates that filter's effect directly: no
      // rows come back, matching what a real DB would return once the flag
      // was flipped to false in run 2.
      hostRepository.find.mockResolvedValue([idleHost]);
      serviceRepository.find.mockResolvedValue([]);
      insightStateRepository.find.mockResolvedValue([]);
      insightStateRepository.findOne.mockResolvedValue({
        entityId: 'host-1',
        flag: InsightFlag.IDLE_HOST,
        active: false,
      });
      await service.runDailyCheck();

      const run3IdleAlerts = alertEvaluationService.evaluateDirectCondition.mock.calls.filter(
        ([arg]) => arg.condition === 'system:idle_host_detected',
      );
      expect(run3IdleAlerts).toHaveLength(1);
    });
  });
});
