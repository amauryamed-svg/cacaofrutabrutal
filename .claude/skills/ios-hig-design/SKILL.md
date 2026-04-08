# iOS Human Interface Guidelines Design Skill

Framework for designing native iOS app interfaces aligned with Apple's HIG. Three foundational pillars: **clarity** (legible and purposeful), **deference** (interface serves content), **depth** (layering provides hierarchy).

## Scoring

**Goal: 10/10.** When reviewing iOS interfaces or SwiftUI/UIKit code, rate 0-10. Always provide the current score and specific improvements needed to reach 10/10.

## Core Areas

### 1. Layout & Safe Areas
- Design for smallest screen first (375pt — iPhone SE)
- Safe areas protect content from notch, Dynamic Island, home indicator
- Standard content margins: 16-20pt from screen edges
- Minimum touch target: **44 × 44pt**
- Standard spacing: 8 / 16 / 24pt
- Never place interactive elements in safe area zones

### 2. Typography & Dynamic Type
- Large Title: 34pt Bold | Title: 17pt Medium | Body: 17pt Regular
- Caption: 12-13pt | Minimum: 11pt
- Line height minimum: 1.3× font size for body
- Optimal line length: 35-50 chars on mobile
- **Always use semantic text styles** (`.title`, `.body`, `.caption`) — never hardcode sizes
- Test at the largest Dynamic Type size

### 3. Color & Dark Mode
- Use semantic system colors: `Color(.label)`, `Color(.systemBackground)`
- `Color(.systemBlue)` = default tint | `Color(.systemRed)` = destructive | `Color(.systemGreen)` = success
- **Dark Mode is required, not optional**
- Maintain 4.5:1 contrast in both light and dark
- Define custom colors in Asset Catalog with light/dark variants

### 4. Navigation Patterns
- **Tab bar** (2-5 tabs): primary destinations, always visible, remembers state
- **Navigation stack**: hierarchical drill-down with system back gesture
- **Modal**: focused tasks only, dismissable via swipe-down
- **Never use hamburger menus** — iOS users expect tab bars
- Back button text = previous screen's title, not "Back"

### 5. Controls & Inputs
- Match keyboard type to input: `.emailAddress`, `.phonePad`, `.URL`
- Use `.textContentType` for autofill support
- Destructive actions: red + confirmation alert
- Swipe actions on list rows for common actions
- Primary buttons at bottom (thumb reach zone)

### 6. Accessibility (Required)
- Every interactive element needs `.accessibilityLabel`
- Use `.accessibilityValue` for state, `.accessibilityHint` for action
- Support Dynamic Type at ALL sizes
- Minimum contrast: 4.5:1 (WCAG AA)
- Never convey meaning through color alone
- Test complete flows with VoiceOver enabled

### 7. Icons & Images
- Use SF Symbols (`Image(systemName:)`) for all standard icons
- App icon: export 1024×1024px square — iOS applies squircle mask automatically
- iOS 18+: supports light, dark, and tinted icon variants
- Avoid text in app icons

### 8. Gestures & Haptics
- **Never override**: swipe-right-from-edge (back), swipe-down on modal (dismiss), pull-down (refresh)
- Three haptic types: impact (physical), notification (outcomes), selection (UI changes)
- Haptics should be subtle and meaningful — never constant

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Overriding standard gestures | Use system gestures for their purposes |
| Touch targets under 44pt | `.frame(minWidth: 44, minHeight: 44)` |
| Ignoring safe areas | Use `.ignoresSafeArea()` only for backgrounds |
| Hamburger menus | Use tab bars for primary navigation |
| Skipping Dark Mode | Semantic colors + test both appearances |
| Hardcoding font sizes | Use semantic text styles throughout |

## Quick Diagnostic

| Question | If No | Action |
|----------|-------|--------|
| Layout respects safe areas on all devices? | Content hidden behind hardware | Fix safe area insets on iPhone SE and Pro Max |
| All touch targets ≥ 44×44pt? | Users mis-tap | Increase tap areas |
| Works fully in Dark Mode? | Broken/unreadable UI | Replace hardcoded colors with semantic |
| Text scales with Dynamic Type? | Accessibility violation | Use semantic text styles; test largest size |
| VoiceOver can complete every task? | App inaccessible | Add accessibility labels, values, hints |
| Navigation patterns are native iOS? | App feels foreign | Replace hamburger with tab bar |

## Further Reading
- Apple Human Interface Guidelines: developer.apple.com/design/human-interface-guidelines/
- SF Symbols: developer.apple.com/sf-symbols/
- Source: wondelai/skills/ios-hig-design
