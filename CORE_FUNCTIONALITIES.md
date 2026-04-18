# SafeLancer — Core Functionalities: File & Code Reference

---

## 1. Cryptographic Hashing (SHA-256 Proof of Work)

### What it does
Freelancers upload a code file + demo video as "proof of work". The system computes a SHA-256 hash of each file at upload time and stores it on the milestone. Clients can verify delivery integrity via a public endpoint without accessing plaintext content until payment clears.

---

### Server-Side

#### `server/routes/milestones.js`
- **Lines ~173, 178** — Core hashing on submission
  ```js
  crypto.createHash('sha256').update(codeBuffer).digest('hex')   // code file hash
  crypto.createHash('sha256').update(videoBuffer).digest('hex')  // demo video hash
  ```
  Both hashes stored in milestone: `submissionFileHash`, `submissionVideoHash`

#### `server/routes/files.js`
- **Lines ~13–23** — `POST /api/files/upload`
  - Computes SHA-256 of uploaded file, returns `{ fileHash, url, filename }`
- **Lines ~25–51** — `POST /api/files/verify-hash`
  - Public endpoint: queries Milestone by `submissionFileHash`, returns verified status + delivery details
- **Lines ~53–92** — `GET /api/files/certificate/:hash`
  - Generates a PDF delivery certificate embedding the SHA-256 hash

#### `server/models/Milestone.js`
- **Lines ~23, 38** — Schema fields
  ```js
  submissionFileHash: String   // SHA-256 of code deliverable
  submissionVideoHash: String  // SHA-256 of demo video
  ```

---

### Client-Side

#### `client/src/pages/VerifyHash.jsx`
- **Lines ~10–14** — Calls `POST /api/files/verify-hash` with hash from URL param
- **Lines ~46–71** — Displays verification result (client, freelancer, milestone title, amount, status)
- **Line ~67** — Download certificate button → `GET /api/files/certificate/:hash`

#### `client/src/pages/ContractDashboard.jsx`
- **Lines ~460–462** — Verify link for submission video hash
- **Lines ~539–542** — Displays submitted file hashes in dispute evidence panel

#### `client/src/pages/AdminDashboard.jsx`
- **Lines ~25–32** — `HashBadge` component renders truncated SHA-256 hash
- **Lines ~137–165** — Disputed milestone section shows both file and video hashes
- **Lines ~289–301** — Auto-compiled evidence summary displays submission hashes

---

### Flow Diagram
```
Freelancer uploads file + video
        ↓
SHA-256 computed on raw buffer (server)
        ↓
Hashes stored in Milestone document
        ↓
Client can verify at /verify/:hash (public)
        ↓
PDF certificate generated with embedded hash
```

---
---

## 2. State Machine Logic (Escrow Lifecycle)

### What it does
A strict, tamper-proof state machine governs every milestone through its lifecycle. Only valid transitions are allowed. Each transition records timestamps and triggers side effects (auto-release timers, payment due dates).

---

### Valid State Transitions

```
pending_deposit → funded
funded          → in_progress | released
in_progress     → submitted
submitted       → review
review          → approved | inaccurate_1 | disputed | released
inaccurate_1    → submitted          (resubmission allowed)
inaccurate_2    → disputed           (auto-dispute on 2nd rejection)
disputed        → released | refunded
approved        → released
released        → (terminal)
refunded        → (terminal)
```

---

### Server-Side

#### `server/services/stateMachine.js` ⭐ (Core File)
- **Lines 4–16** — `VALID_TRANSITIONS` object — defines every legal state path
- **Lines 18–20** — `canTransition(from, to)` — validates a transition is legal
- **Lines 22–47** — `milestoneTransition(milestoneId, newStatus)` — executes transition + side effects:
  - On `submitted`: sets `submittedAt`, calculates `autoReleaseAt` (+72 hours)
  - On `approved`: sets `paymentDueAt` (+48 hours for client to release)
  - On `released`: sets `releasedAt` timestamp

#### `server/models/Milestone.js`
- **Lines ~13–17** — Status enum with all 11 valid states:
  ```js
  ['pending_deposit', 'funded', 'in_progress', 'submitted', 'review',
   'approved', 'inaccurate_1', 'inaccurate_2', 'disputed', 'released', 'refunded']
  ```
- **Lines ~20–42** — Supporting fields: `deadlineExtensions[]`, `autoReleaseAt`, `paymentDueAt`, `releasedAt`, `submittedAt`

#### `server/routes/milestones.js`
| Endpoint | Transition Triggered | Lines |
|----------|---------------------|-------|
| `POST /fund` | `pending_deposit → funded` | ~101 |
| `POST /start` | `funded → in_progress` | ~184 |
| `POST /submit` | `in_progress → submitted → review` (2 transitions, 1 call) | ~184–186 |
| `POST /review` (approved) | `review → approved → released` | ~242, 244 |
| `POST /review` (rejected, 2nd time) | `review → inaccurate_2 → disputed` | ~257 |
| `POST /review` (rejected, 1st time) | `review → inaccurate_1` | ~286 |

#### `server/services/releaseService.js`
- **Lines ~161–166** — `performRelease(milestone)` → transitions to `released`, triggers freelancer payout
- **Lines ~169–175** — `performSplitRelease(milestone, freelancerShare)` → for disputed split resolution
- **Lines ~178–181** — `performRefund(milestone)` → transitions to `refunded`, Razorpay refund

#### `server/index.js`
- **Hourly cron job** (`0 * * * *`) — scans milestones in `review` status where `autoReleaseAt <= now` and auto-transitions to `released`

---

### Client-Side

#### `client/src/pages/ContractDashboard.jsx`
- **Lines ~30–45** — `statusColors` object — color coding for each state in UI
- **Lines ~373–520** — Phase rendering — shows state-dependent action buttons (Fund / Submit / Approve / Release)
- **Lines ~677–697** — Manual dispute raise button (available in funded/review/inaccurate states)

#### `client/src/pages/AdminDashboard.jsx`
- **Lines ~309–331** — Admin resolution buttons that trigger final state transitions (release / refund / split)

---

### Flow Diagram
```
pending_deposit
      ↓ (client funds via Razorpay)
   funded
      ↓ (freelancer starts work)
  in_progress
      ↓ (freelancer uploads file + video)
  submitted → review
      ↓
  [Client Reviews]
      ├── Approve → approved → released ✓
      ├── Reject (1st) → inaccurate_1 → submitted (retry)
      └── Reject (2nd) → inaccurate_2 → disputed
                                ↓
                         [Admin Resolves]
                         ├── release_to_freelancer → released
                         ├── refund_to_client → refunded
                         └── split → partial release + partial refund
```

---
---

## 3. Dispute Resolution Algorithm

### What it does
When a dispute occurs (automatically on 2nd rejection, or manually raised), both parties submit metadata evidence. Admin reviews all evidence — submission hashes, deadline extensions, inaccuracy notes, freelancer portfolio samples — and issues a resolution: full release, full refund, or a percentage split.

---

### Server-Side

#### `server/models/Dispute.js`
- **Lines 3–28** — Full schema:
  ```js
  milestone     // ref to disputed milestone (optional for manual)
  contract      // ref to parent contract
  raisedBy      // User who raised the dispute
  type          // 'milestone' | 'manual' | 'withdrawal' | 'deadline_breach' | 'payment_default' | 'freelancer_exit'
  evidence[]    // { submittedBy, description, fileUrl, submittedAt }
  status        // 'open' | 'resolved'
  resolution    // 'release_to_freelancer' | 'refund_to_client' | 'split' | null
  splitPercent  // freelancer's share (0–100) if split resolution
  evidenceSummary {
    submissionHashes    // file + video SHA-256
    videoHashes
    deadlineExtensionCount
    inaccuracyNotes[]
    compiledAt
  }
  ```

#### `server/routes/disputes.js` ⭐ (Core File)

| Section | Lines | What it does |
|---------|-------|-------------|
| `buildEvidenceSummary()` | ~13–29 | Auto-compiles evidence from milestone: hashes, deadline extensions, inaccuracy notes |
| `POST /api/disputes/raise` | ~31–59 | Creates dispute with auto-compiled summary. Both manual and milestone-triggered. |
| `POST /api/disputes/:id/evidence` | ~61–78 | Text evidence submission — validates dispute is open, appends to `evidence[]` |
| `POST /api/disputes/:id/evidence-file` | ~80–98 | File evidence — uploads to ImageKit, stores URL in evidence entry |
| `PATCH /api/disputes/:id/resolve` | ~100–152 | Admin-only resolution: executes release / refund / split logic |

**Resolution Logic detail (`PATCH /resolve`, lines ~114–145):**
```
resolution = 'release_to_freelancer'
  → performRelease(milestone)            // disputed → released, freelancer paid

resolution = 'refund_to_client'
  → Razorpay refund of clientTotal
  → performRefund(milestone)             // disputed → refunded

resolution = 'split'
  → Razorpay refund of client's share   // (100 - splitPercent)% back to client
  → performSplitRelease(milestone, freelancerShare)  // freelancer gets splitPercent%
```

#### `server/routes/milestones.js`
- **Lines ~254–266** — **Auto-dispute trigger** (when 2nd rejection occurs):
  ```js
  milestoneTransition(milestone._id, 'disputed')
  // Creates Dispute doc with auto-compiled evidenceSummary
  ```

#### `server/routes/admin.js`
- **Lines ~100–132** — `GET /api/admin/disputes/:id/full`
  - Returns full dispute context: contract parties, milestone details, all milestones in contract, freelancer portfolio samples — everything admin needs to make a fair decision

---

### Client-Side

#### `client/src/pages/ContractDashboard.jsx`

| Section | Lines | What it does |
|---------|-------|-------------|
| `handleRaiseDispute()` | ~181–191 | Calls `POST /api/disputes/raise` with reason + milestoneId |
| `handleSubmitEvidence()` | ~193–212 | Submits text or file evidence to open dispute |
| Dispute panel UI | ~523–605 | Shows dispute reason, auto-compiled hashes, evidence timeline, resolution |
| Client dispute raise button | ~677–697 | Available in funded / review / inaccurate_1 states |
| Freelancer dispute raise button | ~754–765 | Available in review / in_progress states |

#### `client/src/pages/AdminDashboard.jsx`

| Section | Lines | What it does |
|---------|-------|-------------|
| `DisputeDetail` modal | ~35–338 | Full admin review interface |
| `resolve()` function | ~48–56 | Calls `PATCH /api/disputes/:id/resolve` |
| Party display | ~101–111 | Client + freelancer info side by side |
| Disputed milestone details | ~124–196 | Amount, hashes, submission note, inaccuracy note, deadline history |
| Contract milestones timeline | ~200–229 | All phases in context |
| Freelancer portfolio samples | ~232–251 | Work samples for credibility |
| Evidence timeline | ~254–282 | Chronological evidence from both parties |
| Auto-compiled summary | ~285–302 | Hashes, extension count, inaccuracy notes |
| Resolution buttons | ~306–333 | Release / Refund / Split with percentage input |

---

### Flow Diagram
```
Dispute Triggered
├── Automatic: Client rejects milestone 2nd time
│       → milestoneTransition('disputed')
│       → Dispute doc created with evidenceSummary auto-compiled
└── Manual: Either party raises via UI
        → POST /api/disputes/raise

        ↓
Both parties submit evidence
├── Text: POST /api/disputes/:id/evidence
└── File: POST /api/disputes/:id/evidence-file

        ↓
Admin reviews DisputeDetail modal
├── Submission hashes (tamper-proof)
├── Deadline extension count
├── Inaccuracy notes
├── Freelancer portfolio samples
└── Chronological evidence from both parties

        ↓
Admin resolves: PATCH /api/disputes/:id/resolve
├── release_to_freelancer → disputed → released + payout
├── refund_to_client      → disputed → refunded + Razorpay refund
└── split (N%)            → partial refund to client + partial payout to freelancer
```

---
---

## Quick Reference Summary

| Feature | Core Server File | Core Client File |
|---------|-----------------|-----------------|
| **Cryptographic Hashing** | `server/routes/files.js` + `server/routes/milestones.js` | `client/src/pages/VerifyHash.jsx` |
| **State Machine** | `server/services/stateMachine.js` | `client/src/pages/ContractDashboard.jsx` |
| **Dispute Resolution** | `server/routes/disputes.js` | `client/src/pages/AdminDashboard.jsx` |
