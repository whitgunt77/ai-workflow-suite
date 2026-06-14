// src/evals/cases/extract.cases.js
// Test cases for the extract automation.
//
// Each case has:
//   id             — unique identifier
//   input          — the raw document text
//   schema         — which schema to use (invoice | contract | meeting)
//   expectedFields — the expected top-level field keys (and null for optional absent fields)

export const extractCases = [
  {
    id: "extract/invoice-standard",
    schema: "invoice",
    input: `
INVOICE #INV-2024-0892
Vendor: Acme Supplies Co.
Invoice Date: 2024-10-01
Due Date: 2024-10-31

Line Items:
- Software Licenses (10 × $120.00) = $1,200.00
- Support Hours (5 × $200.00) = $1,000.00

Subtotal: $2,200.00
Tax (8%): $176.00
Total Due: $2,376.00 USD

Payment Terms: Net 30
    `.trim(),
    expectedFields: {
      vendor_name: "Acme Supplies Co.",
      invoice_number: "INV-2024-0892",
      invoice_date: "2024-10-01",
      due_date: "2024-10-31",
      line_items: [],       // non-null array expected
      subtotal: 2200,
      tax: 176,
      total_due: 2376,
      currency: "USD",
      payment_terms: "Net 30",
    },
  },

  {
    id: "extract/meeting-with-action-items",
    schema: "meeting",
    input: `
Weekly Engineering Sync — October 14, 2024

Attendees: Sarah Kim (EM), Ravi Patel (Backend), Lisa Chen (Frontend), Omar Diaz (QA)

Topics Covered:
- v2.3.2 release status: ready to ship pending final QA sign-off
- Performance regression in search API (P95 latency 800ms, target 200ms)
- Headcount: two new senior engineers joining Nov 1

Decisions:
- Ship v2.3.2 on Oct 17 pending QA
- Ravi to own search performance investigation

Action Items:
1. Ravi Patel — Profile search API and propose fix — due Oct 16
2. Lisa Chen — Update release notes for v2.3.2 — due Oct 15
3. Omar Diaz — Complete smoke test pass — due Oct 16

Next meeting: October 21, 2024 at 10:00 AM PT
    `.trim(),
    expectedFields: {
      meeting_date: "2024-10-14",
      attendees: [],            // non-null array
      topics_discussed: [],
      decisions: [],
      action_items: [],
      next_meeting: "2024-10-21",
    },
  },

  {
    id: "extract/contract-nda",
    schema: "contract",
    input: `
MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of
September 1, 2024, between Quantum Innovations LLC ("Company A") and
BlueSky Ventures Inc. ("Company B").

1. Purpose
The parties wish to explore a potential business relationship and may
disclose confidential information to each other for evaluation purposes.

2. Term
This Agreement is effective as of the date above and will remain in force
for a period of two (2) years, expiring on September 1, 2026.

3. Obligations
Each party agrees to keep the other's Confidential Information strictly
confidential and not disclose it to third parties without prior written consent.

4. Governing Law
This Agreement shall be governed by the laws of the State of Delaware.

5. Termination
Either party may terminate this Agreement with 30 days written notice.
    `.trim(),
    expectedFields: {
      parties: [],
      effective_date: "2024-09-01",
      expiration_date: "2026-09-01",
      contract_type: "NDA",
      governing_law: "Delaware",
      key_obligations: [],
      termination_conditions: "30 days written notice",
      renewal_terms: null,
    },
  },
];