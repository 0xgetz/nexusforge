import type { Vulnerability, Severity } from "./types.js";

const OSV_API = "https://api.osv.dev/v1";

interface OSVVulnerability {
  id: string;
  summary?: string;
  details?: string;
  severity?: Array<{ type: string; score: string }>;
  affected?: Array<{
    package: { name: string; ecosystem: string };
    ranges?: Array<{
      type: string;
      events: Array<{ introduced?: string; fixed?: string }>;
    }>;
  }>;
  references?: Array<{ type: string; url: string }>;
  database_specific?: { cwe_ids?: string[]; severity?: string };
}

export async function queryOSV(
  packageName: string,
  version: string,
  ecosystem: string = "npm"
): Promise<Vulnerability[]> {
  try {
    const response = await fetch(`${OSV_API}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version,
        package: { name: packageName, ecosystem },
      }),
    });

    if (!response.ok) return [];

    const data = await response.json() as { vulns?: OSVVulnerability[] };
    if (!data.vulns || data.vulns.length === 0) return [];

    return data.vulns.map((vuln) => convertOSVVuln(vuln, packageName, version));
  } catch {
    return [];
  }
}

export async function batchQueryOSV(
  packages: Array<{ name: string; version: string }>,
  ecosystem: string = "npm"
): Promise<Map<string, Vulnerability[]>> {
  const results = new Map<string, Vulnerability[]>();

  const queries = packages.map((pkg) => ({
    version: pkg.version,
    package: { name: pkg.name, ecosystem },
  }));

  try {
    const response = await fetch(`${OSV_API}/querybatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries }),
    });

    if (!response.ok) return results;

    const data = await response.json() as { results: Array<{ vulns?: OSVVulnerability[] }> };

    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      const vulns = data.results[i]?.vulns || [];
      results.set(
        pkg.name,
        vulns.map((v) => convertOSVVuln(v, pkg.name, pkg.version))
      );
    }
  } catch {
    // fallback to individual queries
    for (const pkg of packages) {
      const vulns = await queryOSV(pkg.name, pkg.version, ecosystem);
      results.set(pkg.name, vulns);
    }
  }

  return results;
}

function convertOSVVuln(
  vuln: OSVVulnerability,
  packageName: string,
  version: string
): Vulnerability {
  const severity = extractSeverity(vuln);
  const fixedIn = extractFixedVersion(vuln, packageName);
  const cvss = extractCVSS(vuln);

  return {
    id: vuln.id,
    package: packageName,
    version,
    severity,
    title: vuln.summary || vuln.id,
    description: vuln.details || "No description available",
    fixedIn,
    cwe: vuln.database_specific?.cwe_ids,
    cvss,
    url: vuln.references?.find((r) => r.type === "ADVISORY")?.url ||
      vuln.references?.[0]?.url ||
      `https://osv.dev/vulnerability/${vuln.id}`,
  };
}

function extractSeverity(vuln: OSVVulnerability): Severity {
  const dbSeverity = vuln.database_specific?.severity?.toLowerCase();
  if (dbSeverity && ["critical", "high", "medium", "low"].includes(dbSeverity)) {
    return dbSeverity as Severity;
  }

  const cvss = extractCVSS(vuln);
  if (cvss !== undefined) {
    if (cvss >= 9.0) return "critical";
    if (cvss >= 7.0) return "high";
    if (cvss >= 4.0) return "medium";
    return "low";
  }

  return "medium";
}

function extractCVSS(vuln: OSVVulnerability): number | undefined {
  const severity = vuln.severity?.find((s) => s.type === "CVSS_V3");
  if (severity?.score) {
    const match = severity.score.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : undefined;
  }
  return undefined;
}

function extractFixedVersion(vuln: OSVVulnerability, packageName: string): string | undefined {
  const affected = vuln.affected?.find(
    (a) => a.package.name === packageName
  );
  if (!affected?.ranges) return undefined;

  for (const range of affected.ranges) {
    for (const event of range.events) {
      if (event.fixed) return event.fixed;
    }
  }
  return undefined;
}

export async function lookupCVE(cveId: string): Promise<Vulnerability | null> {
  try {
    const response = await fetch(`${OSV_API}/vulns/${cveId}`);
    if (!response.ok) return null;

    const vuln = await response.json() as OSVVulnerability;
    return convertOSVVuln(vuln, "unknown", "unknown");
  } catch {
    return null;
  }
}