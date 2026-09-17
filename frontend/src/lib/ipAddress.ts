const IPV4_PATTERN = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

// A deliberately permissive IPv6 shape check (hex groups and "::"), not a
// full RFC 4291 validator - good enough to catch obvious typos client-side
// without rejecting valid addresses the server would accept.
const IPV6_PATTERN = /^[0-9a-fA-F:]+$/;

export function isPlausibleIpAddress(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;

  if (trimmed.includes('.')) {
    return IPV4_PATTERN.test(trimmed);
  }

  return trimmed.includes(':') && IPV6_PATTERN.test(trimmed);
}
