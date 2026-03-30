# Phase Plan Decisions

Fill in your answers below. Write your choice letter (a/b/c) or Yes/No or check the boxes you want.
Delete the options you DON'T want, or just write your answer next to each question.

---

## Architecture

**Q1. App.jsx refactor:**

- (a) Break into 6 separate components
- (b) Keep as-is with comments
- (c) Do it later
  > Your answer: a

**Q2. Add unit tests?**

> Your answer: yes

---

## Data & Reliability

**Q3. When localStorage gets full:**

- (a) Auto-delete oldest games silently
- (b) Show warning and let user choose
- (c) Don't worry about it
  > Your answer: show warning to select to keep data of nth days but make sure players record should be maintain even if record deleted. it should have record count of total wins and loses in some encrypted or compressed way.

**Q4. Add validation on sync/import data?**

> Your answer: yes

---

## UX Polish

**Q5. Which features do you want? (write Yes/No next to each)**

- Quick rematch button on win screen: yes
- Swipe-to-delete on history cards: no
- Player avatars (color/emoji per player): yes but sleek
- Different vibration for streak milestones: yes
- Keyboard auto-dismiss on Enter: no for add member list input and yes for all other

**Q6. Landscape mode for tablets?**

> Your answer: yes

---

## Social & Sharing

**Q7. Spectator room join method:**

- (a) QR code only
- (b) Keep 4-digit code only
- (c) Both QR + code
  > Your answer: c

**Q8. Weekly digest summary image?**

> Your answer: yes

**Q9. Tournament invite link (auto-creates tournament on other device)?**

> Your answer: yes

---

## Competitive Features

**Q10. Which features do you want? (write Yes/No next to each)**

- Season system (cumulative standings across tournaments): yes
- Handicap mode (bonus points for weaker ELO): no
- Best-of-3/5 series: later
- Player comparison page (H2H stats): yes
- Form indicator (trend arrow next to ELO): yes
- Knockout bracket format: yes

---

## Mobile & iOS

**Q11. Voice scoring — keep, remove, or rework?**

> Your answer: keep but update command line to some unique words and enhance its handling to work smartly with no crashes or lags

**Q12. Push notifications for "match ready"?**

> Your answer: no

---

## Priority

**Q13. What matters most right now?**

- (a) Fix bugs and polish what exists
- (b) Add more competitive features
- (c) Make sharing/social features better
- (d) Refactor architecture for long-term
  > Your answer: d, a, b, c

---

## Any other ideas or notes?

> Write anything else here:
> later on i'm planning to create this as react native app so its current development should be very very concious and handy to switch later. while updating make sure no feature missed or crash. handle it like a real hero dev. current UI feels awesome so go along with its consistency.
