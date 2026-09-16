import { connect, PeerCertificate, TLSSocket } from 'tls';
import { SslCertificateStatus } from '../../domains/entities/ssl-certificate.entity';
import { TLS_PORT } from '../domain-check.constants';
import { computeSslStatusFromValidTo } from '../ssl-status.util';

export interface TlsCheckResult {
  status: SslCertificateStatus;
  issuer: string | null;
  validFrom: Date | null;
  validTo: Date | null;
  rawOutput: Record<string, unknown>;
}

function openTlsConnection(
  host: string,
  servername: string,
  timeoutMs: number,
): Promise<TLSSocket> {
  return new Promise((resolve, reject) => {
    const socket = connect({
      host,
      port: TLS_PORT,
      servername,
      timeout: timeoutMs,
      rejectUnauthorized: false,
    });

    const onError = (error: Error): void => {
      socket.destroy();
      reject(error);
    };

    socket.once('secureConnect', () => {
      socket.removeListener('error', onError);
      socket.removeListener('timeout', onTimeout);
      resolve(socket);
    });
    socket.once('error', onError);

    const onTimeout = (): void =>
      onError(new Error(`TLS connection to ${host}:${TLS_PORT} timed out`));
    socket.once('timeout', onTimeout);
  });
}

function firstValue(value: string | string[] | undefined): string | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function formatIssuer(issuer: PeerCertificate['issuer'] | undefined): string | null {
  if (!issuer) {
    return null;
  }
  return firstValue(issuer.O) ?? firstValue(issuer.CN);
}

function computeStatus(validTo: Date | null): SslCertificateStatus {
  return validTo ? computeSslStatusFromValidTo(validTo) : SslCertificateStatus.INVALID;
}

export async function performTlsCheck(
  resolvedIp: string,
  hostname: string,
  timeoutMs: number,
): Promise<TlsCheckResult> {
  let socket: TLSSocket | undefined;
  try {
    socket = await openTlsConnection(resolvedIp, hostname, timeoutMs);
    const cert = socket.getPeerCertificate();

    if (!cert || Object.keys(cert).length === 0) {
      return {
        status: SslCertificateStatus.INVALID,
        issuer: null,
        validFrom: null,
        validTo: null,
        rawOutput: { error: 'No certificate presented by peer' },
      };
    }

    const validFrom = cert.valid_from ? new Date(cert.valid_from) : null;
    const validTo = cert.valid_to ? new Date(cert.valid_to) : null;

    return {
      status: computeStatus(validTo),
      issuer: formatIssuer(cert.issuer),
      validFrom,
      validTo,
      rawOutput: {
        issuer: cert.issuer,
        subject: cert.subject,
        valid_from: cert.valid_from,
        valid_to: cert.valid_to,
        authorized: socket.authorized,
        authorization_error: socket.authorizationError?.toString(),
      },
    };
  } catch (error) {
    return {
      status: SslCertificateStatus.INVALID,
      issuer: null,
      validFrom: null,
      validTo: null,
      rawOutput: { error: (error as Error).message },
    };
  } finally {
    socket?.destroy();
  }
}
