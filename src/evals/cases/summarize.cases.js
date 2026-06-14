// src/evals/cases/summarize.cases.js
// Test cases for the summarize automation.
//
// Each case has:
//   id              — unique identifier for the test
//   input           — the document to summarize
//   expectedKeywords — words/phrases the output MUST contain (coverage scoring)

export const summarizeCases = [
  {
    id: "summarize/short-earnings-update",
    input: `
Q3 2024 Revenue Update

Revenue for Q3 2024 came in at $4.2M, up 18% year-over-year.
Gross margin improved to 72% from 68% in Q2.
Churn rate decreased from 3.2% to 2.7% month-over-month.
We added 142 new enterprise customers this quarter.
The sales team exceeded quota by 112%.
Key risk: one enterprise deal worth $800K is at risk of slipping into Q4.
    `.trim(),
    expectedKeywords: ["revenue", "4.2", "18%", "enterprise", "churn", "Q4"],
  },

  {
    id: "summarize/product-incident-report",
    input: `
Incident Report — Outage 2024-10-15

At 14:32 UTC on October 15, our primary database experienced a connection
pool exhaustion event, causing 503 errors for approximately 23% of users.
The issue was first detected by our alerting system at 14:34 UTC.
On-call engineer Sarah Kim was paged at 14:35 UTC and began investigation.
Root cause was identified at 15:01 UTC: a slow query introduced in deploy
v2.3.1 was holding transactions open longer than expected under high load.
Mitigation: the deploy was rolled back at 15:12 UTC.
Total impact window: 40 minutes.
Action items: add query timeout enforcement, add regression test for slow-query detection.
    `.trim(),
    expectedKeywords: ["outage", "database", "rollback", "40 minutes", "action items"],
  },

  {
    id: "summarize/long-policy-doc",
    input: `
Remote Work Policy — Engineering Division (Effective Jan 1 2025)

1. Eligibility
All full-time engineering employees who have completed their 90-day onboarding
period are eligible for remote work. Contractors and interns require manager
approval for remote arrangements.

2. Core Hours
Employees are expected to be available and responsive from 10 AM to 3 PM in
their local time zone, Monday through Friday. Meetings should be scheduled
within these windows whenever possible.

3. Equipment
The company will provide a laptop, monitor, and peripherals for home office
setup. A one-time stipend of $500 is available for additional home office
equipment, subject to manager approval.

4. Security
Remote employees must use the company VPN at all times when accessing internal
systems. Public Wi-Fi is prohibited without VPN. All devices must have full
disk encryption enabled.

5. Performance Reviews
Remote employees will be evaluated on output and results, not hours worked.
Quarterly check-ins with managers are mandatory.
    `.trim(),
    expectedKeywords: ["remote", "10 AM", "3 PM", "VPN", "$500", "quarterly"],
  },
];