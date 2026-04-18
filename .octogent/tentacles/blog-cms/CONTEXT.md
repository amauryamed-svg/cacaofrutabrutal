# Tentacle: blog-cms

## Domain
Content marketing — blog posts by Guardian farmers and founders, tag-filtered grid, individual post pages, token rewards for reading and sharing.

## What This Domain Owns
- `/src/pages/Blog.tsx` — Tag-filtered post grid with BlogHero
- `/src/pages/BlogPost.tsx` — Individual post page with Markdown rendering
- `/src/components/blog/BlogCard.tsx` — Post card (cover emoji, title, author chip, tag pills, reading time)
- `/src/components/blog/BlogHero.tsx` — Hero section for blog index
- `/src/components/blog/AuthorChip.tsx` — Author avatar + role badge
- `/src/components/blog/BlogTagPill.tsx` — Tag filter pill
- `/src/hooks/useBlogPosts.ts` — Supabase query for `blog_posts` (published=true filter)
- `/src/data/staticBlogPosts.ts` — Static fallback data (19KB, used while DB is empty)

## Data Model

### `blog_posts` table (migration 003_blog.sql)
```
id                uuid PK
slug              text UNIQUE
title             text
subtitle          text
author_name       text
author_role       text (founder | farmer | nativo)
author_avatar     text (URL or emoji)
excerpt           text
body_md           text (full Markdown content)
cover_emoji       text
tags              text[] (array of tag strings)
linked_tech       text (optional — technology slug for cross-sell deep-link)
linked_product_ids uuid[] (optional — marketplace product IDs for CTA at bottom)
published         boolean DEFAULT false
published_at      timestamptz
reading_time_min  int
created_at        timestamptz
```

### RLS on `blog_posts`
- SELECT: public (no auth) for `published = true`
- INSERT: users with `caua_role IN ('farmer', 'founder')` only
- UPDATE/DELETE: service_role only (via Admin CRM)

### `email_log` table (migration 003_blog.sql)
Used to track blog share/read events for token rewards:
```
id          uuid PK
user_id     uuid FK
event_type  text (blog_read | blog_share | order_confirm | catacion_notify)
ref_id      uuid (blog post ID or order ID)
created_at  timestamptz
```

## Token Integration

| Event | Rate | Trigger location |
|-------|------|-----------------|
| `blog_read` | +0.2 beans | `BlogPost.tsx` — once per slug per user per day |
| `blog_share` | +1.0 bean | `BlogPost.tsx` share button |

The `blog_share` event is currently wired in `Ritual.tsx` (for ritual sharing). It must also be wired directly in `BlogPost.tsx`.
The `blog_read` event is defined in TOKEN_RATES but not yet wired anywhere.

Anti-abuse rule: check `email_log` for existing `blog_read` row with same `user_id + ref_id + today's date` before calling `award-tokens`. Insert the `email_log` row atomically.

## Cross-Sell Mechanics

### `linked_tech` deep-link
If a blog post has `linked_tech = 'mucilage-extract'`, the post should show a CTA card at the bottom linking to `/fund#mucilage-extract` with technology name and current funding progress.

### `linked_product_ids` bottom CTA
If a blog post has product IDs, show 1–3 `ProductCard` components at the bottom linking to the Marketplace.

## HubSpot Tracking
Blog share actions should call `hsUpdateRitual()` in `src/lib/hubspotTracking.ts` with `lastBlogShare` property. Similar to how the ritual share is tracked.

## Current Critical Gaps

1. **No blog posts in DB** — `useBlogPosts` returns an empty array. The static fallback in `staticBlogPosts.ts` shows placeholder content but is not representative of the real product.
2. **blog_read token award not wired** — Defined in TOKEN_RATES, never called.
3. **body_md not rendered** — `BlogPost.tsx` does not yet render Markdown. It likely shows raw Markdown text or nothing.
4. **No OG meta tags** — Blog posts have no OpenGraph meta tags, so TikTok/Reels/Twitter previews show the generic app meta.

## Content Strategy (for seeding)

Initial posts should cover:
1. "La Historia del Cacao Criollo Élite en el Huila" — by Lucho (Guardian, Huila)
2. "Por qué el mucílago de cacao es más que un subproducto" — by Amaury (founder)
3. "Fernando de Meta: Medalla de Oro y el Sabor del Territorio" — by Fernando (Guardian, Meta)
4. "De la Fermentación al Tónico: El Proceso TheobromaBrew™" — by Amaury (founder)
5. "Cinco Tiempos del Cacao: Una Ceremonia, No Un Chocolate" — by Amaury (founder)
