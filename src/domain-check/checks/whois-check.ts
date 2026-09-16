import whois from 'whois-json';
import { withTimeout } from '../../common/utils/with-timeout';

export interface WhoisCheckResult {
  ok: boolean;
  registrar: string | null;
  expiresAt: Date | null;
  rawOutput: Record<string, unknown>;
}

const EXPIRY_FIELD_NAMES = [
  'registryExpiryDate',
  'registrarRegistrationExpirationDate',
  'expiryDate',
  'expirationDate',
  'expiresOn',
  'expires',
  'paidTill',
];

const REGISTRAR_FIELD_NAMES = ['registrar', 'sponsoringRegistrar', 'registrarName'];

/**
 * WHOIS field names are not standardized across TLDs/registrars, so we try
 * a list of common candidates rather than trusting one exact key.
 */
function pickField(record: Record<string, unknown>, candidates: string[]): string | null {
  const lowerCaseKeys = new Map(Object.keys(record).map((key) => [key.toLowerCase(), key]));

  for (const candidate of candidates) {
    const actualKey = lowerCaseKeys.get(candidate.toLowerCase());
    if (actualKey && typeof record[actualKey] === 'string' && record[actualKey].trim() !== '') {
      return record[actualKey] as string;
    }
  }
  return null;
}

export async function performWhoisLookup(
  hostname: string,
  timeoutMs: number,
): Promise<WhoisCheckResult> {
  try {
    const record = (await withTimeout(
      whois(hostname) as Promise<Record<string, unknown>>,
      timeoutMs,
      `WHOIS lookup(${hostname})`,
    )) as Record<string, unknown>;

    const registrar = pickField(record, REGISTRAR_FIELD_NAMES);
    const expiryRaw = pickField(record, EXPIRY_FIELD_NAMES);
    const expiresAt = expiryRaw ? new Date(expiryRaw) : null;

    return {
      ok: true,
      registrar,
      expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
      rawOutput: { record },
    };
  } catch (error) {
    return {
      ok: false,
      registrar: null,
      expiresAt: null,
      rawOutput: { error: (error as Error).message },
    };
  }
}
