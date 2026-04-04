# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

We recommend always using the latest stable version of NexusForge to ensure you have the most recent security patches and improvements.

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it through our GitHub Private Vulnerability Reporting system.

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Go to the [Security tab](https://github.com/0xgetz/nexusforge/security/advisories) of the repository
3. Click "Report a vulnerability"
4. Fill out the form with:
   - Description of the vulnerability
   - Steps to reproduce (if possible)
   - Potential impact assessment
   - Any suggested fixes or mitigations

Alternatively, you can email security concerns to the maintainers through GitHub's advisory system.

## What to Expect

### Response Timeline

- **Acknowledgment**: Within 48 hours of your report
- **Initial Assessment**: Within 5 business days
- **Status Update**: Within 10 business days
- **Resolution**: Timeline depends on severity and complexity

### Our Commitment

1. We will acknowledge your report within 48 hours
2. We will send you regular updates on the status of the vulnerability
3. We will coordinate with you on the disclosure timeline
4. We will credit you (if you wish) in the security advisory when it is published

## Security Best Practices for Contributors

When contributing to NexusForge, please follow these security guidelines:

### Code Security

- Never commit secrets, API keys, passwords, or credentials
- Use environment variables for sensitive configuration
- Validate and sanitize all user inputs
- Use parameterized queries to prevent injection attacks
- Implement proper authentication and authorization checks

### Dependency Management

- Keep dependencies up to date
- Review security advisories for dependencies
- Use `bun audit` or similar tools to check for known vulnerabilities
- Avoid adding dependencies with known security issues

### Testing

- Include security-focused tests where applicable
- Test for common vulnerabilities (XSS, CSRF, injection, etc.)
- Run security scans in CI/CD pipelines

## Security Measures in NexusForge

NexusForge implements several security measures:

- **Dependency Scanning**: Automated scanning for vulnerable dependencies
- **Code Analysis**: Static analysis for security issues
- **Access Control**: Role-based access control for sensitive operations
- **Audit Logging**: Comprehensive logging of security-relevant events

## Responsible Disclosure

We follow a coordinated disclosure process:

1. Reporter submits vulnerability privately
2. Our team validates and assesses the issue
3. We develop and test a fix
4. We release a patched version
5. We publish a security advisory (after 30 days or when fix is widely adopted)

## Security Updates

Security updates are released as patch versions (e.g., 1.0.1, 1.0.2). For critical vulnerabilities, we may release out-of-band security patches.

To stay informed about security updates:

- Watch the repository for releases
- Subscribe to security advisories
- Follow our changelog

## Contact

For security-related questions that cannot be reported through GitHub Advisories, please use GitHub's confidential messaging system to contact the maintainers.

**Important**: Do not disclose security vulnerabilities publicly until they have been addressed and an advisory has been published.

Thank you for helping keep NexusForge and its users safe.
