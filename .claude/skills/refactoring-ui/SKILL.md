# Refactoring UI Design System

A practical, opinionated approach to UI design. Apply these principles when generating frontend code, reviewing designs, or advising on visual improvements.

## Core Principle

**Design in grayscale first. Add color last.** This forces proper hierarchy through spacing, contrast, and typography before relying on color as a crutch.

**The foundation:** Great UI isn't about creativity or talent -- it's about systems. Constrained scales for spacing, type, color, and shadows produce consistently professional results. Start with too much white space, then remove. Details come later -- don't obsess over icons, shadows, or micro-interactions until the layout and hierarchy work.

## Scoring

**Goal: 10/10.** When reviewing or creating UI designs or frontend code, rate it 0-10 based on adherence to the principles below. A 10/10 means full alignment with all guidelines; lower scores indicate gaps to address. Always provide the current score and specific improvements needed to reach 10/10.

## The Refactoring UI Framework

Seven principles for building professional interfaces without a designer:

### 1. Visual Hierarchy

**Core concept:** Not everything can be important. Create hierarchy through three levers: size, weight, and color.

**Why it works:** When every element competes for attention, nothing stands out. Deliberate de-emphasis of secondary content makes primary content powerful by contrast.

**Key insights:**
- Combine levers, don't multiply -- primary text = large OR bold OR dark, not all three
- Save "all three" for the single most important element on the page
- Labels are secondary -- form labels, table headers, and metadata labels support the data, not compete with it
- Semantic color does not equal visual weight -- a muted red secondary button often works better than screaming danger for routine actions
- De-emphasize labels by making them smaller, lighter, or uppercase-small

**Product applications:**

| Context | Hierarchy Technique | Example |
|---------|---------------------|---------|
| **Form fields** | De-emphasize labels, emphasize values | Small uppercase label above large value text |
| **Navigation** | Primary nav bold, secondary nav lighter | Active link in dark gray-900, inactive in gray-500 |
| **Cards** | Title large, metadata small and light | Card title 20px bold, date 12px gray-400 |
| **Dashboards** | Key metric large, context small | Revenue "$42,300" large, "vs last month" small |
| **Tables** | De-emphasize headers, emphasize cell data | Headers uppercase small gray, data normal weight |

### 2. Spacing & Sizing

**Core concept:** Use a constrained spacing scale, not arbitrary values. Spacing defines relationships -- elements closer together are more related.

**Key insights:**
- Use a linear or near-linear scale: 4, 8, 16, 24, 32, 48, 64px
- Start with too much white space, then remove
- Text blocks should be constrained to 45-75 characters (~65ch)
- Forms should max out at 300-500px width

### 3. Typography

**Core concept:** Use a modular type scale, constrain line heights by context, and limit to two font families maximum.

**Key insights:**
- Modular scale: 12, 14, 16, 20, 24, 30, 36px (1.25 ratio)
- Headings: tight line height (1.0-1.25); body text: relaxed (1.5-1.75)
- Two fonts maximum: one for headings, one for body

### 4. Color

**Core concept:** Build a systematic palette with 5-9 shades per color, add subtle saturation to grays, and design in grayscale first.

**Key insights:**
- Each color needs 5-9 shades from near-white to near-black (50 through 900)
- Pure grays look lifeless -- add subtle saturation
- Body text minimum 4.5:1 contrast ratio (WCAG AA)

### 5. Depth & Shadows

**Key insights:**
- Small shadows = raised slightly (buttons, cards); large shadows = floating (modals, dropdowns)
- Don't overuse shadows -- if everything floats, nothing has depth
- Shadow color should be transparent dark, not opaque gray

### 6. Images & Icons

**Key insights:**
- Icons should be sized relative to their context
- Images need treatment: object-fit cover, consistent aspect ratios, overlays for text
- Empty states are an opportunity -- use illustrations, not just text

### 7. Layout & Composition

**Key insights:**
- Left-align text by default; center only short headlines, hero sections, single-action CTAs
- Cards don't need to contain everything -- let images bleed to edges
- Use alignment to create visual relationships between unrelated elements

## Common Mistakes

| Mistake | Why It Fails | Fix |
|---------|-------------|------|
| **"Looks amateur"** | Insufficient white space, unconstrained widths | Add more white space, constrain content widths |
| **"Feels flat"** | No depth differentiation | Add subtle shadows, border-bottom on sections |
| **"Text is hard to read"** | Poor line-height, too wide, low contrast | Increase line-height, constrain width, boost contrast |
| **"Everything looks the same"** | No visual hierarchy | Vary size/weight/color between primary and secondary |
| **"Feels cluttered"** | Equal spacing everywhere | Group related items, increase spacing between groups |
| **Using arbitrary values** | px values like 13, 17, 23 create inconsistency | Stick to the spacing and type scales |

## Quick Diagnostic

| Question | If No | Action |
|----------|-------|--------|
| Does hierarchy read when squinting (blur test)? | Elements competing | Increase contrast between primary and secondary |
| Does it work in grayscale? | Relying on color for hierarchy | Strengthen size/weight/spacing hierarchy |
| Is there enough white space? | Too dense | Increase spacing, especially between groups |
| Are labels de-emphasized vs. their values? | Labels competing with data | Make labels smaller, lighter, or uppercase-small |
| Does spacing follow a consistent scale? | Arbitrary values | Use 4/8/16/24/32/48/64 scale only |

## Further Reading
- *"Refactoring UI"* by Adam Wathan & Steve Schoger
- Source: wondelai/skills/refactoring-ui
