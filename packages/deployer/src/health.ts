import type { HealthCheck, HealthCheckItem } from "./types.js";

export async function checkHealth(url: string): Promise<HealthCheck> {
  const start = Date.now();
  const checks: HealthCheckItem[] = [];

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(10000),
    });

    const responseTime = Date.now() - start;

    checks.push({
      name: "HTTP Response",
      status: response.ok ? "pass" : "fail",
      message: `Status ${response.status} ${response.statusText}`,
      responseTime,
    });

    if (response.ok) {
      checks.push({
        name: "SSL/TLS",
        status: url.startsWith("https://") ? "pass" : "warn",
        message: url.startsWith("https://") ? "HTTPS enabled" : "Using HTTP (not secure)",
      });
    }

    const contentType = response.headers.get("content-type");
    checks.push({
      name: "Content-Type",
      status: contentType ? "pass" : "warn",
      message: contentType || "No content-type header",
    });

    const securityHeaders = [
      "x-content-type-options",
      "x-frame-options",
      "x-xss-protection",
      "strict-transport-security",
    ];

    let secHeaders = 0;
    for (const header of securityHeaders) {
      if (response.headers.get(header)) secHeaders++;
    }

    checks.push({
      name: "Security Headers",
      status: secHeaders >= 3 ? "pass" : secHeaders >= 1 ? "warn" : "fail",
      message: `${secHeaders}/${securityHeaders.length} security headers present`,
    });

    try {
      const healthUrl = new URL("/health", url).toString();
      const healthRes = await fetch(healthUrl, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      checks.push({
        name: "Health Endpoint",
        status: healthRes.ok ? "pass" : "warn",
        message: healthRes.ok ? "/health endpoint available" : "/health endpoint not found",
        responseTime: Date.now() - start - responseTime,
      });
    } catch {
      checks.push({
        name: "Health Endpoint",
        status: "warn",
        message: "/health endpoint not available",
      });
    }

    const healthy = checks.every((c) => c.status !== "fail");

    return {
      url,
      status: response.status,
      responseTime,
      healthy,
      timestamp: new Date().toISOString(),
      checks,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    checks.push({
      name: "Connection",
      status: "fail",
      message: `Failed to connect: ${message}`,
    });

    return {
      url,
      status: 0,
      responseTime: Date.now() - start,
      healthy: false,
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}

export function formatHealthReport(health: HealthCheck): string {
  const lines: string[] = [];
  const statusIcon = health.healthy ? "✅" : "❌";

  lines.push(`${statusIcon} Health Check: ${health.url}`);
  lines.push(`   Status: ${health.status} | Response: ${health.responseTime}ms`);
  lines.push("");

  for (const check of health.checks) {
    const icon = check.status === "pass" ? "✓" : check.status === "warn" ? "⚠" : "✗";
    const time = check.responseTime ? ` (${check.responseTime}ms)` : "";
    lines.push(`   ${icon} ${check.name}: ${check.message}${time}`);
  }

  return lines.join("\n");
}
