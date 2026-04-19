# NOTES — blog-cms

## Architectural Decisions

**[2026-04-18] body_md is Markdown stored as text in DB, rendered client-side**
Blog post body content is stored as raw Markdown in `body_md`. Rendering happens client-side using a sanitized Markdown library (planned: `marked` + `DOMPurify`). This keeps the DB schema simple and allows rich content without a CMS. Never render raw `body_md` innerHTML without DOMPurify sanitization — XSS risk.

**[2026-04-18] linked_tech is a text slug, not a FK**
`linked_tech` stores a technology slug string (e.g., `mucilage-extract`), not a UUID FK. This is intentional to allow editorial flexibility — a blog post can reference a technology by name even if the technology row changes. Cross-reference via `technologies.slug` when rendering the CTA.

**[2026-04-18] Blog authorship restricted to farmer and founder roles**
Only users with `caua_role = 'farmer'` or `caua_role = 'founder'` can INSERT blog posts. The `nativo` role can appear as `author_role` in the content (for display purposes) but cannot create posts. This is enforced via RLS on `blog_posts`.

**[2026-04-18] Static fallback (staticBlogPosts.ts) is placeholder content only**
The static blog posts in `src/data/staticBlogPosts.ts` exist as a UI fallback while the DB is empty. They are not representative of production content and should be replaced by real seeded posts. Once the DB is seeded, the static fallback can be removed from `useBlogPosts.ts`.

## Known Risks

- No blog content exists in the DB. The blog page shows empty state in production. This is a P0 gap for launch credibility.
- `BlogPost.tsx` likely renders raw Markdown text without parsing. A user navigating to any blog post will see raw `##` and `**` characters. This must be fixed before any blog content is seeded.
- No OG meta tags exist. Sharing a blog post on TikTok or Instagram will show the generic CacaoFrutaBrutal meta, not the post's title/image. This significantly reduces organic reach.
