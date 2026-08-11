---
name: ADAMAS platform scope
description: Durable compatibility boundaries and storage/history constraints for the ADAMAS web application.
---

ADAMAS is delivered as a responsive browser application rather than a native Android, iOS, macOS, or Windows package. Browser APIs and REST keep the core simulation portable, but native installers, offline execution, and App Store/Play Store distribution are separate product work.

**Why:** The product currently runs through the web artifact and its server API; treating it as a native or offline app would overstate the supported platform surface.

**How to apply:** Describe compatibility as modern-browser compatibility on each platform. Keep browser storage access defensive because private browsing and policy restrictions can throw. Do not claim user-isolated history until authentication and ownership rules are designed and enforced server-side.