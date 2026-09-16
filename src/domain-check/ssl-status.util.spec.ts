import { SslCertificateStatus } from '../domains/entities/ssl-certificate.entity';
import { computeSslStatusFromValidTo } from './ssl-status.util';
import { SSL_EXPIRY_WARNING_DAYS } from './domain-check.constants';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('computeSslStatusFromValidTo', () => {
  const now = new Date('2026-01-01T00:00:00Z');

  it('is valid when far from expiry', () => {
    const validTo = new Date(now.getTime() + (SSL_EXPIRY_WARNING_DAYS + 10) * DAY_MS);
    expect(computeSslStatusFromValidTo(validTo, now)).toBe(SslCertificateStatus.VALID);
  });

  it('is expiring_soon when within the warning window', () => {
    const validTo = new Date(now.getTime() + (SSL_EXPIRY_WARNING_DAYS - 1) * DAY_MS);
    expect(computeSslStatusFromValidTo(validTo, now)).toBe(SslCertificateStatus.EXPIRING_SOON);
  });

  it('is expiring_soon exactly at the warning threshold boundary', () => {
    const validTo = new Date(now.getTime() + SSL_EXPIRY_WARNING_DAYS * DAY_MS);
    expect(computeSslStatusFromValidTo(validTo, now)).toBe(SslCertificateStatus.EXPIRING_SOON);
  });

  it('is expired when valid_to is in the past', () => {
    const validTo = new Date(now.getTime() - DAY_MS);
    expect(computeSslStatusFromValidTo(validTo, now)).toBe(SslCertificateStatus.EXPIRED);
  });
});
