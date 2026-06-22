# todo — blog-cms

## P0 — Launch Blockers

- [x] [P0] Seed `blog_posts` table with 3–5 Guardian farmer and founder origin stories — 5 posts inserted 2026-06-22 (Lucho/Huila, Ricardo/Santander, Fernando/Meta, Marta/Arauca, Rafael/Cundinamarca)

## P1 — Q2 Meaningful Experience

- [ ] [P1] Wire `blog_read` token award in `BlogPost.tsx`: call award-tokens with `blog_read` event after 30s on page — once per slug per user per day (check email_log for duplicate)
- [ ] [P1] Wire `blog_share` token award in `BlogPost.tsx` share button (currently only wired in Ritual.tsx)
- [ ] [P1] Build Markdown renderer for `body_md` field: use `marked` + `DOMPurify` for sanitized HTML — apply BRAND typography (Cormorant Garamond for body, Barlow Condensed for headings)
- [ ] [P1] Add `linked_tech` deep-link CTA at bottom of BlogPost: show technology card snippet + link to `/fund#{slug}` if `linked_tech` is set
- [ ] [P1] Add OG meta tags per blog post: `og:title`, `og:description`, `og:image` (cover emoji as SVG fallback), `og:url` — for TikTok/Reels preview

## P2 — Q3–Q4 Scale

- [ ] [P2] Admin CRM blog tab: CRUD interface for creating/editing/publishing posts with Markdown preview pane
- [ ] [P2] Author profile pages: `/author/[slug]` — Guardian farmer story, their region, their trees, their posts
- [ ] [P2] Add `linked_product_ids` CTAs at bottom of BlogPost: show 1–3 `ProductCard` components linking to Marketplace
- [ ] [P2] EN/ES language toggle for blog content: add `body_md_en` column via migration + conditional render based on `LangContext`
- [ ] [P2] HubSpot tracking: call `hsUpdateRitual()` with `lastBlogShare` property on blog share event
- [ ] [P2] Add `reading_time_min` auto-calculation on blog post creation (approx 200 words/min)
