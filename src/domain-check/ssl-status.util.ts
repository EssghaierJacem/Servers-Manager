import { SslCertificateStatus } from '../domains/entities/ssl-certificate.entity';
import { SSL_EXPIRY_WARNING_DAYS } from './domain-check.constants';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Pure status computation for a certificate whose handshake succeeded and
 * whose valid_to date we were able to read. A failed connection/handshake,
 * or a certificate with no readable valid_to, is `invalid` and never
 * reaches this function - see performTlsCheck.
 */
export function computeSslStatusFromValidTo(
  validTo: Date,
  now: Date = new Date(),
): SslCertificateStatus {
  const msUntilExpiry = validTo.getTime() - now.getTime();

  if (msUntilExpiry < 0) {
    return SslCertificateStatus.EXPIRED;
  }

  if (msUntilExpiry <= SSL_EXPIRY_WARNING_DAYS * MS_PER_DAY) {
    return SslCertificateStatus.EXPIRING_SOON;
  }

  return SslCertificateStatus.VALID;
}
