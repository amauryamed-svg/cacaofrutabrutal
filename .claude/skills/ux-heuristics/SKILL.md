# UX Heuristics Framework

Practical usability principles for evaluating and improving user interfaces. Based on Nielsen's 10 heuristics and Krug's laws.

## Core Principle

**"Don't Make Me Think"** — Every page should be self-evident. If something requires thinking, it's a usability problem.

Users don't read, they scan. They don't make optimal choices, they satisfice. They don't figure out how things work, they muddle through. Design for this reality.

## Scoring

**Goal: 10/10.** When reviewing interfaces, rate 0-10 based on adherence to the principles below. Always provide the current score and specific improvements needed to reach 10/10.

## Krug's Three Laws

### 1. Don't Make Me Think
Every question mark in a user's head adds cognitive load and increases the chance they'll leave.
- Clever names lose to clear names every time
- Marketing-speak creates friction; plain language removes it
- Buttons should use action verbs: "Sign in", "Add to cart", "Download"

### 2. It Doesn't Matter How Many Clicks
Cognitive effort per click matters more than click count. Three mindless, confident clicks beat one click that requires deliberation.
- Each click should be painless, obvious, and confidence-building
- Users abandon when confused, not when they've clicked too many times

### 3. Get Rid of Half the Words
Get rid of half the words on each page, then get rid of half of what's left.
- Happy-talk ("Welcome to our website!") wastes space
- Before: "Please kindly note that you will need to enter your password in order to proceed."
- After: "Enter your password to continue."

### 4. The Trunk Test
Drop users on any random page — can they instantly answer:
1. What site is this? (logo/brand visible)
2. What page am I on? (clear heading)
3. What are the major sections? (navigation)
4. What are my options at this level? (links/CTAs)
5. Where am I in the hierarchy? (breadcrumbs)
6. How do I search?

## Nielsen's 10 Usability Heuristics

1. **Visibility of System Status** — Keep users informed through timely feedback. Loading states, confirmations, progress bars. Silent failures destroy trust.

2. **Match Between System and Real World** — Speak users' language. "Sign in" not "Authenticate". Follow real-world metaphors (trash bin, shopping cart).

3. **User Control and Freedom** — Provide clear emergency exits. Undo beats "Are you sure?" dialogs. Every flow needs cancel/back.

4. **Consistency and Standards** — Same words, styles, behaviors mean the same thing throughout. Pick one term per concept — never mix "Projects" and "Workspaces".

5. **Error Prevention** — Constrained inputs (date pickers over text fields), autocomplete, sensible defaults, "unsaved changes" warnings.

6. **Recognition Rather Than Recall** — Show options, don't require memorization. Breadcrumbs, recent searches, pre-filled fields. Human working memory holds ~7 items.

7. **Flexibility and Efficiency of Use** — Keyboard shortcuts, bulk actions, command palettes (Cmd+K) for power users. Progressive disclosure for beginners.

8. **Aesthetic and Minimalist Design** — Every element must earn its place. One primary CTA per page, not five competing ones.

9. **Help Users Recognize, Diagnose, and Recover from Errors** — Error messages need: what happened + why + how to fix it. Never blame the user.

10. **Help and Documentation** — Help should be searchable, task-focused ("How to..." not technical reference), contextual.

## Severity Rating Scale

| Severity | Rating | Description | Priority |
|----------|--------|-------------|----------|
| **0** | Not a problem | Disagreement, not usability issue | Ignore |
| **1** | Cosmetic | Minor annoyance | Fix if time |
| **2** | Minor | Causes delay or frustration | Schedule fix |
| **3** | Major | Significant task failure | Fix soon |
| **4** | Catastrophic | Prevents task completion | Fix immediately |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Mystery meat navigation (icons without labels) | Add text labels alongside icons |
| Too many choices | Reduce to 7 ± 2 items |
| No "you are here" indicator | Highlight current section + breadcrumbs |
| No inline validation | Validate on blur with specific messages |
| Wall of text | Break up with headings, bullets, whitespace |
| Tiny tap targets | Minimum 44×44px |
| No undo | Provide undo for all non-destructive actions |
| Broken back button | Never hijack browser history |

## Quick Diagnostic

| Question | If No | Action |
|----------|-------|--------|
| Can I tell what site/page this is immediately? | Users lost | Add logo, page title, breadcrumbs |
| Is the main action obvious? | Users don't know what to do | Single primary CTA, visual hierarchy |
| Does system show what's happening? | Users lose trust | Loading states, confirmations, progress |
| Are error messages helpful? | Users stuck | Plain language + specific fix |
| Can users undo or go back? | Users afraid to act | Add undo, cancel, back options |

## Further Reading
- *"Don't Make Me Think, Revisited"* by Steve Krug
- *"10 Usability Heuristics"* by Jakob Nielsen (nngroup.com)
- Source: wondelai/skills/ux-heuristics
