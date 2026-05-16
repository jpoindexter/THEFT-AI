---
name: didit-identity-verification
description: Integrate or plan Didit identity verification, KYC onboarding, AML screening, document verification, proof of address, liveness, face match/search, age estimation, email verification, phone verification, or database validation. Use when THEFT needs identity, trust, compliance, KYB/KYC, fraud, sanctions, onboarding verification, or Didit API work.
metadata:
  source: https://github.com/didit-protocol/skills
  license: MIT
---

# Didit Identity Verification

Use this as a single entry point for Didit trust and verification work. Keep it consolidated so THEFT does not load twelve separate Didit skills into model-visible context.

## Workflow

1. Identify the verification job:
   - End-to-end KYC onboarding: read `references/kyc-onboarding.md`.
   - Didit platform workflows, sessions, users, webhooks, billing, or API keys: read `references/verification-management.md`.
   - ID/passport/driver-license document checks: read `references/id-document-verification.md`.
   - AML, sanctions, PEP, or adverse-media screening: read `references/aml-screening.md`.
   - Proof-of-address checks: read `references/proof-of-address.md`.
   - Face match, face search, liveness, or biometric age estimation: read the matching biometric reference.
   - Email, phone, or government database validation: read the matching verification reference.
2. Confirm `DIDIT_API_KEY` and any privacy/compliance constraints before writing code that calls Didit.
3. Prefer server-side integration. Do not expose Didit API keys in frontend code.
4. Preserve verification evidence as structured Library artifacts when this is used inside THEFT flows.
5. Treat biometric, identity, sanctions, and document data as high-sensitivity data. Minimize retention and log only non-sensitive IDs/statuses.

## References

- `references/verification-management.md`
- `references/kyc-onboarding.md`
- `references/id-document-verification.md`
- `references/aml-screening.md`
- `references/proof-of-address.md`
- `references/face-match.md`
- `references/face-search.md`
- `references/liveness-detection.md`
- `references/biometric-age-estimation.md`
- `references/email-verification.md`
- `references/phone-verification.md`
- `references/database-validation.md`
