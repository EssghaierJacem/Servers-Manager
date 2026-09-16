declare module 'whois-json' {
  function whois(hostname: string): Promise<Record<string, unknown>>;
  export default whois;
}
