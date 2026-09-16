export interface DockerPsContainer {
  id: string;
  names: string;
  image: string;
  status: string;
  ports: string;
}

export interface DockerPsParseResult {
  containers: DockerPsContainer[];
  skippedLines: number;
}

interface RawDockerPsJson {
  ID?: string;
  Names?: string;
  Image?: string;
  Status?: string;
  Ports?: string;
}

/**
 * `docker ps -a --format '{{json .}}'` prints one JSON object per line.
 * Each line is parsed independently so a single malformed/truncated line
 * (rare, but SSH output can be clipped) never discards the rest of the run.
 */
export function parseDockerPsOutput(stdout: string): DockerPsParseResult {
  const lines = stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const containers: DockerPsContainer[] = [];
  let skippedLines = 0;

  for (const line of lines) {
    const container = parseLine(line);
    if (container) {
      containers.push(container);
    } else {
      skippedLines += 1;
    }
  }

  return { containers, skippedLines };
}

function parseLine(line: string): DockerPsContainer | null {
  let parsed: RawDockerPsJson;
  try {
    parsed = JSON.parse(line) as RawDockerPsJson;
  } catch {
    return null;
  }

  if (!parsed.ID || !parsed.Names || !parsed.Image || !parsed.Status) {
    return null;
  }

  return {
    id: parsed.ID,
    names: parsed.Names,
    image: parsed.Image,
    status: parsed.Status,
    ports: parsed.Ports ?? '',
  };
}

/**
 * Splits a docker image reference into its repo (with any registry prefix)
 * and tag, without mis-splitting a registry's own `host:port` segment.
 * Digest references (`image@sha256:...`) have no simple "tag", so the
 * whole reference is kept as-is with a null tag.
 */
export function splitImageAndTag(rawImage: string): { image: string; tag: string | null } {
  if (!rawImage) {
    return { image: rawImage ?? '', tag: null };
  }

  if (rawImage.includes('@')) {
    return { image: rawImage, tag: null };
  }

  const lastSlash = rawImage.lastIndexOf('/');
  const lastSegment = lastSlash === -1 ? rawImage : rawImage.slice(lastSlash + 1);
  const colonIndexInSegment = lastSegment.lastIndexOf(':');

  if (colonIndexInSegment === -1) {
    return { image: rawImage, tag: null };
  }

  const absoluteColonIndex = lastSlash + 1 + colonIndexInSegment;
  return {
    image: rawImage.slice(0, absoluteColonIndex),
    tag: rawImage.slice(absoluteColonIndex + 1),
  };
}
