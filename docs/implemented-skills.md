# Implemented Skill Assets

This repository now includes the requested skill packages and supporting workflow markdown files.

## Installed skill packs

- QA / Playwright workflows: [`.agents/skills/playwright-runner/SKILL.md`](../.agents/skills/playwright-runner/SKILL.md)
- OWASP Top 10 security audit pack: [`.agents/skills/security-misconfiguration/SKILL.md`](../.agents/skills/security-misconfiguration/SKILL.md)
- SEO / Core Web Vitals audit pack: [`.agents/skills/seo/SKILL.md`](../.agents/skills/seo/SKILL.md)

## Repository workflow docs

- [Desktop workflows](../workflows/desktop-workflows.md)
- [Mobile workflows](../workflows/mobile-workflows.md)
- [Multi-user workflows](../workflows/multi-user-workflows.md)

## Notes

- The QA workflows are written to be consumed by the Playwright runner skill.
- The SEO assets add metadata, schema markup, `robots.txt`, and `sitemap.xml`.
- The security pass removes the hardcoded local admin password fallback from the client by default.
