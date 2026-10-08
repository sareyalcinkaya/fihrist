# Frist

**The programme OS for cohort builders.**
*Run your programme. Not your inbox.*

Frist is an AI-native programme management platform for cohort-based organisations such as university incubators, accelerators, fellowships and NGO programmes. It brings intake, applicant screening, communication and cohort tracking into one system of record.

> Made for the **Extended Study on Innovation (ESI)** at TU Wien's **i²c Innovation Incubation Center**.
> Author: Sare Melek Yalcinkaya. Formerly named Klue. Domain: fihrist.ai. This repository folder is still called `fihrist`.

---

## 1. The problem

Cohort-based programmes run the same cycle again and again: applications come in, someone checks eligibility, decisions are communicated, participants are tracked, and results are reported. Programme coordinators currently run this cycle on a patchwork of general-purpose tools: email, Google Forms, Google Sheets, Notion, Zoom and shared drives.

What this looks like in practice (observed first-hand in the ESI admissions process at i²c):

- **Applications arrive by email and forms**, and are sorted and checked by hand against eligibility criteria. CVs, transcripts and motivation letters are read one by one.
- **Participant information lives in several places** and goes out of date. A colleague asks for a current, shareable overview of participants, and nobody can give one without rebuilding it manually.
- **Status emails are written and sent by hand** (accepted, waitlisted, rejected, reminders), which is repetitive and error-prone.
- **Cohort tracking and reporting are rebuilt every cycle**, and knowledge is lost at handover between coordinators or batches.
- **Existing specialist tools miss this group.** Application platforms such as Submittable and AcceleratorApp are either not built for programme coordination or priced for larger organisations. Airtable and Notion are flexible but leave the coordinator to build and maintain the whole workflow.

The people carrying this load are mostly small teams, often one coordinator, who need to spend their time on judgement and relationships with participants rather than on administration.

## 2. The solution

Frist is **not a replacement** for the tools coordinators already use. It is the **connective layer where they come together**: the system of record for the programme, with AI doing the repetitive work and a human making every decision.

Core workflow:

1. **Form builder**: create an application form with live preview.
2. **Applications**: applicants arrive in one table, with their past engagements visible per person.
3. **AI eligibility screening**: documents are read against the programme's criteria and applicants are marked Eligible or Not Eligible.
4. **AI review**: the coordinator reviews candidates in a split view and can accept, waitlist or reject, including through natural-language commands ("Accept Lena, waitlist Max").
5. **Cohort dashboard**: tracking, attendance, milestones and updates, with an in-app AI assistant for programme commands.
6. **Automated, status-based communication**: emails are triggered by applicant status.

Design principles:

- **Human in the loop.** AI proposes, the coordinator decides. Screening never admits anyone on its own.
- **Platform first, AI on top.** The product is useful without AI; AI is an assistant inside Frist, much like an AI button in Notion.
- **Privacy by design.** EU-hosted, GDPR-native, with a self-hosted option for institutions that require it. Applicant data is not used to train models.
- **Integrates, does not replace.** Connections to tools such as Zoom, Eventbrite, HubSpot, Salesforce and Zapier are planned.

## 3. Innovation need

**Why is innovation needed here?**
Innovation programmes exist to help others build new things, yet they are run with improvised tooling that does not scale with the number of applicants, the number of programmes, or the turnover of the team. The gap is not a missing feature in an existing tool, it is a missing category: software built around the programme lifecycle itself.

**What is new about Frist?**

| Aspect | Today | Frist |
|---|---|---|
| Positioning | Forms, spreadsheets and CRMs stitched together | One "programme OS" that connects the existing tools |
| Screening | Manual reading of every document | AI-assisted eligibility screening with human final decision |
| Communication | Hand-written emails per status | Status-triggered, automated messages |
| Institutional memory | Lost at handover | Persistent applicant and cohort database across programmes |
| Pricing | Enterprise-level or build-it-yourself | Free-forever entry tier, feature-based pricing |
| Data protection | Often unclear | EU-hosted, GDPR-native, self-hosted option |

**Why now?** Document-understanding AI is now reliable enough to take over first-pass screening and drafting, and EU data-protection expectations make a privacy-first, European alternative a real differentiator for universities and public programmes.

**Why from i²c / ESI?** The idea comes from running ESI admissions and coordination directly. The pain was lived, not assumed, and ESI is the natural first testing ground.

## 4. Scope

### Target users

| Persona | Role | Priority |
|---|---|---|
| **Coordinator Lexi** | University incubator coordinator, starting in the DACH region | Primary |
| **Director Max** | Corporate innovation lab manager | Secondary |

Segments: university incubators (pursue now), corporate innovation labs (keep open). Other programme types, such as accelerators, fellowships, NGOs, grant managers and conferences, are noted for later and not pursued now.

### In scope

- Application intake and form building
- Applicant database with engagement history
- AI-assisted eligibility screening and review
- Status-based email communication
- Cohort tracking and a programme dashboard
- Integrations with the tools coordinators already use

### Out of scope (for now)

- A general "all-in-one tool for early-stage entrepreneurs". This direction was considered after feedback that the market is niche, and rejected because it is broader, more crowded, and weaker on focus.
- Replacing email, Zoom, Notion or Sheets
- Fully automated admission decisions
- Payments, grant disbursement and legal or contract management

### Competitive landscape

Submittable, AcceleratorApp, Airtable and Notion are the four main reference points.

### Business model (draft)

| Tier | Price | Includes |
|---|---|---|
| Free | €0 | 3 programmes, 1 seat |
| Core | €19 / month | Unlimited programmes, 3 seats |
| Scale | €299 / month | Multi-workspace, self-hosted option |

An AI screening add-on is planned for Phase 2, priced per credit. Planning assumption: 100 paying programmes by 2031 at about €80 per month on average, roughly €96K ARR. This is a bottom-up estimate, not sourced market research.

### Roadmap

Austria first, then DACH, then Europe. Roadmap 2026 to 2031.

## 5. Current status (honest view)

- Solo founder, no technical co-founder yet.
- **Interactive demo** built (React, single HTML file) covering the full workflow above. It is a demonstration, not a production product.
- **Landing page** live with an early-access form and contact form, backed by a small Node.js/Express server (see below).
- Customer interviews with programme coordinators are being set up; no completed interview base yet.
- ESI / i²c is the proof-of-concept environment. It is not yet a formally confirmed design partner.
- Known open questions: IP protection, technical risk, and the technical skills needed to build the full product.

## 6. Repository contents

```
fihrist/
├── public/          Landing site (index, features, pricing, styles)
├── server.js        Express backend: early-access, contact, admin endpoints
├── package.json
├── .env.example     Environment variables template
├── SETUP.md         Technical setup, email and deployment guide
└── README.md        This file
```

For running the landing page locally, email configuration, deployment and the API reference, see [SETUP.md](SETUP.md).

## 7. Context

This project was developed as part of the Extended Study on Innovation at the i²c Innovation Incubation Center, TU Wien, and was presented at the ESI Demo Day. Jury feedback pointed to the niche scope of the market, which led to the sharper positioning and the focused target segment described above.
