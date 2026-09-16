import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, IsNull, LessThan, Not, Repository } from 'typeorm';
import { AlertEvaluationService } from '../alerts/alert-evaluation.service';
import { AlertEntityType } from '../alerts/entities/alert-rule.entity';
import { Host, HostStatus } from '../hosts/entities/host.entity';
import { Domain } from '../domains/entities/domain.entity';
import { Service, ServiceStatus } from '../services/entities/service.entity';
import { InsightFlag, InsightState } from './entities/insight-state.entity';
import { IDLE_HOST_MIN_AGE_HOURS } from './insights.constants';

export interface OrgInsights {
  idleHosts: Host[];
  orphanedDomains: Domain[];
  orphanedHosts: Host[];
}

const CONDITION_FOR_FLAG: Record<InsightFlag, string> = {
  [InsightFlag.IDLE_HOST]: 'system:idle_host_detected',
  [InsightFlag.ORPHANED_DOMAIN]: 'system:orphan_detected',
  [InsightFlag.ORPHANED_HOST]: 'system:orphan_detected',
};

/**
 * Computes the Part B (idle host) and Part C (orphan) heuristics, live
 * from current DB state - no caching, this data changes slowly. The
 * compute* methods are also what the daily job diffs against InsightState
 * to fire system:* alerts only when an entity *newly* matches, not on
 * every run it continues to match.
 */
@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    @InjectRepository(Host)
    private readonly hostRepository: Repository<Host>,
    @InjectRepository(Domain)
    private readonly domainRepository: Repository<Domain>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(InsightState)
    private readonly insightStateRepository: Repository<InsightState>,
    private readonly alertEvaluationService: AlertEvaluationService,
  ) {}

  async computeIdleHosts(orgId?: string): Promise<Host[]> {
    const cutoff = new Date(Date.now() - IDLE_HOST_MIN_AGE_HOURS * 60 * 60 * 1000);
    const where: FindOptionsWhere<Host> = {
      status: HostStatus.HEALTHY,
      createdAt: LessThan(cutoff),
    };
    if (orgId) {
      where.orgId = orgId;
    }

    const candidates = await this.hostRepository.find({ where });
    if (candidates.length === 0) {
      return [];
    }

    const runningServices = await this.serviceRepository.find({
      where: { hostId: In(candidates.map((host) => host.id)), status: ServiceStatus.RUNNING },
      select: ['hostId'],
    });
    const hostsWithRunningServices = new Set(runningServices.map((service) => service.hostId));

    return candidates.filter((host) => !hostsWithRunningServices.has(host.id));
  }

  async computeOrphanedDomains(orgId?: string): Promise<Domain[]> {
    const where: FindOptionsWhere<Domain> = {};
    if (orgId) {
      where.orgId = orgId;
    }

    const domains = await this.domainRepository.find({ where });
    if (domains.length === 0) {
      return [];
    }

    const hosts = await this.hostRepository.find({ select: ['ipAddress'] });
    const knownHostIps = new Set(hosts.map((host) => host.ipAddress));

    return domains.filter(
      (domain) =>
        domain.hostId === null ||
        (domain.resolvedIp !== null && !knownHostIps.has(domain.resolvedIp)),
    );
  }

  async computeOrphanedHosts(orgId?: string): Promise<Host[]> {
    const where: FindOptionsWhere<Host> = {};
    if (orgId) {
      where.orgId = orgId;
    }

    const hosts = await this.hostRepository.find({ where });
    if (hosts.length === 0) {
      return [];
    }

    const domainsWithHost = await this.domainRepository.find({
      where: { hostId: Not(IsNull()) },
      select: ['hostId'],
    });
    const referencedHostIds = new Set(domainsWithHost.map((domain) => domain.hostId));

    return hosts.filter((host) => !referencedHostIds.has(host.id));
  }

  /**
   * The single source of truth for both GET /insights and the overview
   * counts - both read from this, so the counts can never drift from the
   * actual list lengths.
   */
  async getInsightsForOrg(orgId: string): Promise<OrgInsights> {
    const [idleHosts, orphanedDomains, orphanedHosts] = await Promise.all([
      this.computeIdleHosts(orgId),
      this.computeOrphanedDomains(orgId),
      this.computeOrphanedHosts(orgId),
    ]);

    return { idleHosts, orphanedDomains, orphanedHosts };
  }

  /** The daily job body - see InsightsProcessor / InsightsScheduler. */
  async runDailyCheck(): Promise<void> {
    await this.evaluateIdleHosts();
    await this.evaluateOrphanedDomains();
    await this.evaluateOrphanedHosts();
    this.logger.debug('Daily insights check complete');
  }

  private async evaluateIdleHosts(): Promise<void> {
    const idleHosts = await this.computeIdleHosts();
    await this.evaluateFlagTransitions(
      InsightFlag.IDLE_HOST,
      idleHosts,
      (host) =>
        `Host "${host.name}" appears idle: healthy, zero running containers, registered over ${IDLE_HOST_MIN_AGE_HOURS}h ago`,
    );
  }

  private async evaluateOrphanedDomains(): Promise<void> {
    const orphanedDomains = await this.computeOrphanedDomains();
    await this.evaluateFlagTransitions(InsightFlag.ORPHANED_DOMAIN, orphanedDomains, (domain) =>
      domain.hostId === null
        ? `Domain "${domain.hostname}" has no host linked`
        : `Domain "${domain.hostname}" resolves to ${domain.resolvedIp}, which matches no registered host`,
    );
  }

  private async evaluateOrphanedHosts(): Promise<void> {
    const orphanedHosts = await this.computeOrphanedHosts();
    await this.evaluateFlagTransitions(
      InsightFlag.ORPHANED_HOST,
      orphanedHosts,
      (host) => `Host "${host.name}" has no domain pointing at it`,
    );
  }

  /**
   * Shared edge-detection: alerts (and flips the persisted flag) only for
   * entities that newly match the heuristic since the last run, and flips
   * the flag back off for anything that no longer matches so a future
   * re-match fires again instead of staying silently suppressed forever.
   */
  private async evaluateFlagTransitions<T extends { id: string; orgId: string }>(
    flag: InsightFlag,
    currentlyMatching: T[],
    buildMessage: (entity: T) => string,
  ): Promise<void> {
    const currentIds = new Set(currentlyMatching.map((entity) => entity.id));
    const previousStates = await this.insightStateRepository.find({
      where: { flag, active: true },
    });
    const previouslyActiveIds = new Set(previousStates.map((state) => state.entityId));

    for (const entity of currentlyMatching) {
      if (!previouslyActiveIds.has(entity.id)) {
        await this.alertEvaluationService.evaluateDirectCondition({
          orgId: entity.orgId,
          entityType: AlertEntityType.SYSTEM,
          entityId: entity.id,
          condition: CONDITION_FOR_FLAG[flag],
          message: buildMessage(entity),
        });
      }
      await this.upsertFlag(entity.id, flag, true);
    }

    const noLongerMatching = previousStates.filter((state) => !currentIds.has(state.entityId));
    for (const state of noLongerMatching) {
      await this.upsertFlag(state.entityId, flag, false);
    }
  }

  private async upsertFlag(entityId: string, flag: InsightFlag, active: boolean): Promise<void> {
    let state = await this.insightStateRepository.findOne({ where: { entityId, flag } });
    if (!state) {
      state = this.insightStateRepository.create({ entityId, flag, active });
    } else {
      state.active = active;
    }
    await this.insightStateRepository.save(state);
  }
}
