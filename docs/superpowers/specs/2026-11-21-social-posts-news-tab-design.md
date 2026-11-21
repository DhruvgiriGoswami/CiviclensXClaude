# News tab: what Mumbai is saying

## Intent
Citizens open the sidebar and see what Mumbai is saying on social media during the monsoon, next to who is responsible. Data: `data/social_posts.csv` (650 posts, Jun to Sep 2025, X, Instagram, two WhatsApp group types). Nothing uses it today.

## Goals
- The sidebar gets tabs at every level:
  - India and state level: **Leadership | News**. Leadership holds today's content unchanged.
  - Ward, corporation and district level: **Tickets | Leaders | News**. The existing two tabs stay as they are.
- News shows post cards that load a page at a time. The feed drifts upward slowly by itself.
- The scroll pauses while the pointer is over the feed, while a card is pressed or focused, or while a finger is on it. It starts again on mouse-out, blur or touch end.
- It matches the current design language: `glass-card` rounded-2xl cards, the crimson pill tabs, `light:` variants and the font scale.

## Non-goals
- Media. `has_media` is ignored: nothing is shown and no "photo attached" label.
- Clicking a card does nothing except pause the scroll. The posts have no URLs.
- No per-ward filter in v1. The feed is all of Mumbai at every level.
- No sentiment or AI analysis of the posts.

## Approaches (decided)
- **Data source:** A, chosen. A backend endpoint in the audit module, plus a copy of the posts in the offline mock so News works when the app shows *Offline*. Rejected: B, frontend-only JSON, which bypasses the backend unlike every other dataset. Rejected: C, backend only, which leaves an empty tab offline.
- **Scroll:** A, chosen. A slow continuous drift like a ticker. It loads the next page near the bottom and loops to the top once all posts are loaded. Rejected: one card every N seconds, which feels like a slideshow.

## Card (industry-standard post layout, author in the header)
```
┌──────────────────────────────────────────┐
│ (◯) @user_bcbe33            12 Jun 2025  │
│     X (Twitter)                          │
│                                          │
│ Dear @mybmc, open manhole near post      │
│ office Bangur Nagar. Water on top ...    │
│                                          │
│ [Unverified forward]                     │
│ ♥ 800 likes · Shared 3×                  │
└──────────────────────────────────────────┘
```
- **Header**, the same layout as X, Instagram and Reddit:
  - A generic avatar: the source icon in a tinted circle, since the data has no profile photos.
  - The handle in bold. X and Instagram use `@user_…`. WhatsApp uses `member_…` as given.
  - The source as a muted subline.
  - The date on the right, written as `12 Jun 2025`. Relative times would read "a year ago" on 2025 data.
- **Missing handle** falls back to "Anonymous". All 650 rows have one today.
- **Body:** the post text as written, with emoji, Hinglish, Devanagari and hashtags. It wraps, with no clamp.
- **Footer:**
  - Engagement reads "likes" for X and Instagram, "forwards" for WhatsApp.
  - "Shared N×" appears when the same text was posted N times (N > 1).
  - An amber "Unverified forward" chip appears when the text contains `(unverified)`.

## Backend (`backend/app/audit/`)
- **Loading:** `load.py` reads `social_posts.csv` into `AuditStore.social_posts`.
- **View:** `views.social_posts(s, limit, offset)` groups exact-duplicate texts and returns one item per text, newest first. It returns:
  ```
  { total, next_offset|null, items: [{ post_id, posted_at (ISO), source, platform: "x"|"instagram"|"whatsapp",
    author_handle|null, text, engagement, engagement_label: "likes"|"forwards", shared_count, unverified }] }
  ```
  `limit` defaults to 10 (max 50). `offset` defaults to 0.
- **Route:** `GET /api/v1/audit/social-posts?limit=&offset=` in `api/v1/audit.py`.
- **Docs:** the endpoint is documented in `docs/API_CONTRACT.md`. The README line "`social_posts.csv` is not used" is updated.
- **Tests:** added next to the existing audit tests. They cover shape, paging, dedup count and the unverified flag.

## Frontend (`frontend/src/`)
- **API client:** `auditApi.socialPosts(limit, offset)` reuses the existing `call()` with its automatic mock fallback.
- **Mock:** `scripts/build-audit-mock.py` writes the same grouped posts into `mockData.json`. `mockApi.js` handles `/social-posts` with the same paging.
- **Tabs:** `components/SidebarTabs.jsx` is the existing crimson pill tab bar extracted from `Sidebar.jsx` and reused at every level.
- **Feed:** `components/news/NewsFeed.jsx` handles fetching pages, loading, error and empty states, and loop-around.
- **Card:** `components/news/SocialPostCard.jsx`.
- **Scroll hook:** `hooks/useAutoScroll.js` is a requestAnimationFrame drift at about 25 px/s with a `paused` flag. It is off under `prefers-reduced-motion`, where the feed is a normal scroll list. Manual wheel and touch scrolling always work.
- **Formatting:** the date and platform helpers live in `utils/format.js`, with unit tests in the existing `node --test` setup.
- **Tab memory:** the chosen tab persists while the user moves between levels. The existing rule that a searched leader forces Leaders still wins.

## Left to the builder
Exact icon choice (lucide `Twitter`, `Instagram`, `MessageCircle`), avatar tint per platform, drift speed tuning, page size within 8 to 12, and which instance of a duplicate supplies the author and date (default: the earliest, the original poster).

## Constraints
- Work on `feature/social-posts`. Never merge into `sit`.
- Reuse the existing patterns: the audit `call()` fallback, `glass-card`, and the `light:` theme variants.
- Pass `npm run lint` and the existing tests.
