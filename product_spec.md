# PRODUCT SPECIFICATION: SAME
**Type:** Mobile Game (Social Prediction)
**Stack:** React Native (Expo) + Firebase (Firestore/Auth)
**Vibe:** Minimalist, Bold, Arcade, Haptic
**Agent Instructions:** Use this document as the Master Plan Artifact.

---

## 1. THE CONCEPT
**SAME** is a rapid-fire prediction game. The user sees a binary question (A vs B) and must guess which option the *majority* of people chose.
* **Correct Guess:** Screen flashes "SAME" (Green). +1 Point.
* **Incorrect Guess:** Screen flashes "NOPE" (Red). 0 Points.
* **The Economy:** Answering earns Points. Asking a question costs 3 Points.

---

## 2. DATA SCHEMA (Firestore)
*Agent Note: Initialize Firestore with these exact collection structures.*

### Collection: `users`
| Field | Type | Description |
| :--- | :--- | :--- |
| `uid` | string | Primary Key (Auth ID) |
| `score` | number | Current spendable currency (Starts at 3) |
| `questions_created` | number | Total lifetime questions asked |

### Collection: `questions`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | Auto-ID |
| `text` | string | The Question (e.g., "Cats or Dogs?") |
| `option_a` | string | Label for Left Button |
| `option_b` | string | Label for Right Button |
| `votes_a` | number | Counter for Option A |
| `votes_b` | number | Counter for Option B |
| `created_at` | timestamp | Sort by desc for feed |

### Collection: `votes` (Sub-collection or Top-level)
*Used to prevent duplicate voting.*
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | Composite Key: `uid_questionId` |
| `choice` | string | 'a' or 'b' |

---

## 3. GAME LOGIC (The "Same" Algorithm)

### A. The Scoring Transaction
When a user taps an option (e.g., Option A):
1.  **Read:** Get current `votes_a` and `votes_b` from the question document.
2.  **Compare:**
    * If `votes_a >= votes_b` AND User chose **A** → **WIN**.
    * If `votes_b > votes_a` AND User chose **B** → **WIN**.
    * Else → **LOSE**.
3.  **Write:**
    * Increment the vote count (`votes_a` + 1).
    * If WIN: Increment `user.score` by 1.
    * Create `votes` document to lock the question.

### B. The Creation Cost
When a user attempts to post a question:
1.  Check `user.score`.
2.  If `score < 3`: Reject action (Show alert: "Need 3 Points to Ask").
3.  If `score >= 3`:
    * Deduct 3 points.
    * Create Question Document.
    * **Constraint:** The Creator *must* cast the first vote immediately (auto-vote) to seed the data.

---

## 4. UI/UX FLOW

### Screen 1: The Feed (Main)
* **Header:** minimal text showing Score (e.g., "3 POINTS").
* **Center:** A large, bold Card.
    * Text: "Is a hotdog a sandwich?"
* **Controls:** Split screen buttons.
    * Left Half: "YES" (Color A)
    * Right Half: "NO" (Color B)
* **Interaction:**
    * Tap → Buttons vanish → Reveal Percentage Bars (e.g., 80% / 20%) → Flash Feedback Text ("SAME!").
    * Delay 1.5s → Slide to next card.
* **Footer:** A sticky button: "Create Question (-3pts)".

### Screen 2: The Creator (Modal)
* **Input:** "What are you asking?" (Max 80 chars).
* **Input:** Option 1 (Max 15 chars).
* **Input:** Option 2 (Max 15 chars).
* **Action:** "Post & Vote". User picks their side to submit.

---

## 5. DESIGN SYSTEM (Theme: "Pop")
* **Typography:** Thick, geometric sans-serif (e.g., Poppins or Inter Black).
* **Colors:**
    * Background: White or Light Gray (`#f4f4f5`).
    * Success (SAME): Electric Green (`#00E054`).
    * Fail (NOPE): Hot Pink (`#FF0055`).
    * Text: Dark Gray (`#18181b`).
* **Animation:** Use `react-native-reanimated`. Cards should feel "snappy."

---

## 6. IMPLEMENTATION PLAN (For Agent)

1.  **Project Setup:** Init React Native Expo (TypeScript) + NativeWind.
2.  **Firebase:** Setup anonymous auth (auto-login on mount).
3.  **Seed Data:** Run the seed script (see Appendix) to populate 10 starter questions.
4.  **Feed Component:** Build the card stack. Fetch questions excluding those in `votes`.
5.  **Logic Hook:** Implement `useVote` hook to handle the optimistic UI updates and Firestore transaction.
6.  **Creator:** Implement the specific "Pay to Ask" logic.

---

## APPENDIX: SEED DATA
*Use these to populate the DB so the app is not empty.*

1.  **Cats vs Dogs** (A: Cats, B: Dogs)
2.  **Pineapple on Pizza** (A: Yes, B: No)
3.  **Toilet Paper** (A: Over, B: Under)
4.  **Morning vs Night** (A: Early Bird, B: Night Owl)
5.  **Coffee vs Tea** (A: Coffee, B: Tea)
6.  **Invisibility vs Flight** (A: Invisibility, B: Flight)
7.  **Video Games** (A: Console, B: PC)
8.  **Smartphone** (A: iPhone, B: Android)
9.  **Fridays** (A: Go Out, B: Stay In)
10. **Money vs Fame** (A: Money, B: Fame)