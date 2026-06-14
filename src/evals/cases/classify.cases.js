// src/evals/cases/classify.cases.js
// Test cases for the classify automation.
//
// Each case has:
//   id               — unique identifier
//   input            — the document to classify
//   categories       — taxonomy to classify against
//   expectedCategory — the correct classification

import { DEFAULT_CATEGORIES } from "../../automations/classify.js";

export const classifyCases = [
  {
    id: "classify/invoice-basic",
    categories: DEFAULT_CATEGORIES,
    expectedCategory: "Invoice",
    input: `
INVOICE #INV-2024-0892
From: Acme Supplies Co.
To: TechCorp LLC
Date: October 1, 2024

Description          Qty   Unit Price   Total
Software Licenses    10    $120.00      $1,200.00
Support Hours        5     $200.00      $1,000.00

Subtotal: $2,200.00
Tax (8%): $176.00
Total Due: $2,376.00

Payment due within 30 days.
    `.trim(),
  },

  {
    id: "classify/meeting-notes",
    categories: DEFAULT_CATEGORIES,
    expectedCategory: "Meeting Notes",
    input: `
Team Sync — Oct 14, 2024
Attendees: Alex, Priya, Marcus, Jordan

Topics:
- Sprint 22 retrospective: velocity was 34 points, up from 28 last sprint
- Discussed blocker on the auth redesign; Marcus to unblock by EOD Friday
- New hire onboarding for Jordan reviewed

Decisions:
- Move to bi-weekly deploys starting next sprint
- Cancel Friday standups; async updates in Slack instead

Action Items:
- Marcus: resolve auth blocker by Oct 18
- Priya: update onboarding doc before Jordan's week 2
- Alex: schedule 1:1s with new hires
    `.trim(),
  },

  {
    id: "classify/policy-document",
    categories: DEFAULT_CATEGORIES,
    expectedCategory: "Policy Document",
    input: `
Data Retention Policy — Version 2.1
Effective: January 1, 2025
Owner: Legal & Compliance Team

1. Purpose
This policy establishes guidelines for how long the organization retains
different categories of data and the procedures for secure disposal.

2. Scope
This policy applies to all employees, contractors, and third parties who
handle company data.

3. Retention Periods
Customer PII: 7 years after account closure
Financial records: 10 years per regulatory requirement
Employee records: Duration of employment + 5 years
System logs: 90 days

4. Disposal
Data must be securely deleted using NIST 800-88 compliant methods.
Physical media must be shredded by an approved vendor.
    `.trim(),
  },

  {
    id: "classify/technical-spec",
    categories: DEFAULT_CATEGORIES,
    expectedCategory: "Technical Specification",
    input: `
API Rate Limiting — Technical Specification v1.2

Overview
This document describes the token-bucket rate limiting algorithm implemented
in the API gateway.

Algorithm
Each authenticated client is allocated a bucket with a capacity of 1000
tokens. Tokens refill at a rate of 100 per minute. Each API call consumes
1 token. When the bucket is empty, requests return HTTP 429 Too Many Requests.

Headers
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: <current tokens>
X-RateLimit-Reset: <Unix timestamp when bucket resets>

Error Response
{
  "error": "rate_limit_exceeded",
  "retry_after": 42
}
    `.trim(),
  },
];