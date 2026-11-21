# News Tab (Social Posts) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A News tab in the CivicLens sidebar that auto-scrolls through Mumbai social posts, alongside the existing Leadership content at every level.

**Architecture:** The audit backend serves deduplicated, paged posts from `social_posts.csv`. The offline mock serves the same shape, so `auditApi.socialPosts()` works online and offline through the existing `call()` fallback. The frontend extracts the existing pill tab bar into `SidebarTabs`, adds `NewsFeed` and `SocialPostCard`, and adds an rAF-based `useAutoScroll` hook.

**Tech Stack:** FastAPI, pandas, pytest (httpx ASGI); React 18, Vite, Tailwind (`light:` variant), lucide-react 0.344, `node --test`, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-21-social-posts-news-tab-design.md`

## Global Constraints
- Branch `feature/social-posts`. Never merge into `sit`.
- Ignore `has_media` entirely. It is not in the API response and not in the UI.
- Missing handle → "Anonymous". Date format `12 Jun 2025`.
- Engagement label: `likes` for X and Instagram, `forwards` for WhatsApp.
- Unverified = the text contains `(unverified)`, case-insensitive.
- Page size is 10 by default, with a maximum of 50. Order is newest first. One item per exact text; the earliest instance supplies the author, date and engagement, and `shared_count` is the group size.
- Drift is about 25 px/s. No auto-scroll under `prefers-reduced-motion: reduce`.
- Reuse `glass-card`, crimson pill tabs and `light:` variants. Keep `npm run lint` clean.

## Review Focus
- The backend goes down mid-session: the next page must come from the mock (the `call()` fallback) without duplicating posts already shown. Pinned by Task 2's mock paging test, which uses the same offsets.
- The feed is shorter than the panel (a tall screen with one page loaded): the drift must not stall forever. It loads the next page when no scroll room is left. Pinned by the Task 4 browser check.
- The user hovers, then moves the mouse away while a page fetch is in flight: there must be no double fetch. Pinned by the `loadingRef` guard in Task 4.
- Mobile sheet: a touch pauses the drift, and the drift resumes after touch end. Checked in Task 5 on a 390px viewport.
- Keyboard: Tab focus inside the feed pauses it. Checked in Task 4 (focusin/focusout).

---

### Task 1: Backend endpoint `GET /audit/social-posts`

**Files:**
- Modify: `backend/app/audit/load.py` (add the `social_posts: pd.DataFrame` field on `AuditStore`, defaulting to `None` after `flags`; load it with `_csv(d, "social_posts.csv", ["posted_at"])`)
- Modify: `backend/app/audit/views.py` (add `social_posts`)
- Modify: `backend/app/api/v1/audit.py` (add the route)
- Modify: `docs/API_CONTRACT.md`; update the `README.md` line "social_posts.csv is not used"
- Test: `backend/tests/e2e/test_audit_api.py`

**Interfaces:**
- Produces: `views.social_posts(s, limit: int = 10, offset: int = 0) -> dict` returning `{total, next_offset: int|None, items: [{post_id, posted_at: "YYYY-MM-DDTHH:MM", source, platform: "x"|"instagram"|"whatsapp", author_handle: str|None, text, engagement: int, engagement_label: "likes"|"forwards", shared_count: int, unverified: bool}]}`
- Route: `limit: int = Query(10, ge=1, le=50)`, `offset: int = Query(0, ge=0)`

- [ ] **Step 1: Write failing tests** `test_social_posts_shape_and_paging`, `test_social_posts_dedup_and_flags`
  - Assert the keys equal the set above, and that `has_media` is absent.
  - `total == 509` (unique texts), and the first page has 10 items with `next_offset == 10`.
  - Page 2 shares no `post_id` with page 1.
  - `offset=500` gives 9 items and `next_offset is None`.
  - Items are sorted by `posted_at` descending.
  - Some item has `shared_count > 1`, and the `"Fwd as received"` item has `unverified is True`.
  - Every WhatsApp item has `engagement_label == "forwards"`; X and Instagram items have `"likes"`.
  - `limit=0` returns 422.
- [ ] **Step 2: Run** `cd backend && uv run pytest tests/e2e/test_audit_api.py -k social -v`. Expected: FAIL with 404.
- [ ] **Step 3: Implement.** Group with `sort_values("posted_at")` then `groupby("text", sort=False)`; take the first row and the group size; sort the result descending; slice. Map platform from the source prefix: `X` → x, `Instagram` → instagram, `WhatsApp` → whatsapp. Empty handle or NaN → `None`. Cache the grouped frame on the store, since it is built once.
- [ ] **Step 4: Run** the same command. Expected: PASS. Then run the full `uv run pytest tests/e2e/test_audit_api.py -q` and expect it to PASS.
- [ ] **Step 5: Commit** `feat(audit): serve deduplicated social posts at /audit/social-posts`

### Task 2: Offline mock and API client

**Files:**
- Modify: `frontend/scripts/build-audit-mock.py` (add `social_posts` = the full grouped list in the same item shape and order as Task 1)
- Regenerate: `frontend/src/pages/FollowTheRupee/mockData.json` (`PYTHONUTF8=1 python scripts/build-audit-mock.py ../data src/pages/FollowTheRupee/mockData.json`)
- Modify: `frontend/src/pages/FollowTheRupee/mockApi.js` (route `/social-posts`), `frontend/src/pages/FollowTheRupee/auditApi.js`

**Interfaces:**
- Produces: `auditApi.socialPosts(limit = 10, offset = 0) -> Promise<{total, next_offset, items}>`, the same as Task 1.
- Produces: `pageSocialPosts(all, limit, offset)`, a pure paging helper exported from a new `frontend/src/utils/socialPosts.js` and used by `mockApi.js`.

- [ ] **Step 1: Write a failing test** in `frontend/src/utils/socialPosts.test.js`:
  - `pageSocialPosts(list25, 10, 0)` gives 10 items, `next_offset` 10 and `total` 25.
  - `pageSocialPosts(list25, 10, 20)` gives 5 items and `next_offset` null.
  - Limit 999 is clamped to 50.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** the helper, the mock route, the client method and the builder change. Then regenerate the JSON and check that only the `social_posts` key was added: the other keys must be identical, using the same Python compare used during planning.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(audit): offline mock and client for social posts`

### Task 3: Formatting helpers

**Files:**
- Modify: `frontend/src/utils/format.js`
- Test: `frontend/src/utils/helpers.test.js`

**Interfaces:**
- Produces: `formatPostDate(iso: string) -> string`. `"2025-06-12T14:01"` gives `"12 Jun 2025"`; null or invalid input gives `""`.
- Produces: `formatCount(n: number) -> string`. 867 gives `"867"`, 1200 gives `"1.2K"`, and null gives `"0"`.

- [ ] **Step 1:** Add the failing assertions above.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement. Parse the date components from the string, not through `Date` in local time, so the timezone cannot shift the day.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(ui): date and count formatters for posts`

### Task 4: News feed UI

**Files:**
- Create: `frontend/src/hooks/useAutoScroll.js`
- Create: `frontend/src/components/news/SocialPostCard.jsx`
- Create: `frontend/src/components/news/NewsFeed.jsx`

**Interfaces:**
- Consumes: `auditApi.socialPosts`, `formatPostDate`, `formatCount`
- Produces: `useAutoScroll(ref, { paused: boolean, speed = 25, onNearEnd?: () => void, nearEndPx = 400 })`. It drifts `ref.current.scrollTop` with requestAnimationFrame, accumulating sub-pixel offsets. It calls `onNearEnd` when the remaining scroll is under `nearEndPx`, including when the content does not overflow at all. It does nothing under reduced motion (`matchMedia`).
- Produces: `<NewsFeed />`, which takes no props, and `<SocialPostCard post={item} />`.
- **NewsFeed behaviour:**
  - It is the scroll container itself (`h-full overflow-y-auto`).
  - `paused` is true while the pointer is over the feed, a pointer or touch is down, or focus is inside the feed.
  - On near end it fetches the next page, guarded by `loadingRef`.
  - When `next_offset` is null it appends page 1 again for the loop, keyed by `${post_id}-${cycle}`.
  - It shows a small header, "What Mumbai is saying", with "Synthetic posts, Jun–Sep 2025 monsoon" in muted text.
  - Skeleton cards on first load. An error card with a Retry button. An empty state.
- **Card:**
  - Header: a platform icon in a tinted circle (lucide `Twitter`, `Instagram`, `MessageCircle`), the handle in bold, the source muted, and the date on the right.
  - Body: the text with `whitespace-pre-line break-words`.
  - Footer: a `Heart` icon with `formatCount(engagement)` and the engagement label, then "Shared N×" when N > 1, then an amber chip "Unverified forward" when unverified.
  - Classes: `glass-card light:bg-white rounded-2xl border border-slate-800 light:border-slate-200 p-3.5`, with a crimson border on hover.
  - It is an `<article>` with `tabIndex=0` so keyboard focus pauses the feed.

- [ ] **Step 1:** Implement the hook, card and feed.
- [ ] **Step 2:** Run `npm run lint`. Expected: no errors in new files.
- [ ] **Step 3:** Commit `feat(ui): auto-scrolling social posts feed`

### Task 5: Sidebar tabs at every level

**Files:**
- Create: `frontend/src/components/SidebarTabs.jsx`
- Modify: `frontend/src/components/Sidebar.jsx`

**Interfaces:**
- Produces: `<SidebarTabs tabs={[{id, label}]} active={id} onChange={(id) => void} className? />`. It is the markup from `Sidebar.jsx:265-280` with `role="tablist"`, `role="tab"` and `aria-selected`.
- **Sidebar changes:**
  - Keep the existing `activeTab` state, and add a `'NEWS'` value and a `'LEADERSHIP'` default for NATIONAL and STATE.
  - NATIONAL and STATE render a `SidebarTabs` strip (Leadership | News) above the existing spotlight. The spotlight shows when the tab is not NEWS; `<NewsFeed/>` shows otherwise.
  - The unit level adds a third tab, News, to its existing strip and renders `<NewsFeed/>` in the body. The body padding wrapper must let the feed own its scroll: `NewsFeed` is rendered outside the `overflow-y-auto p-5` div, in a `flex-1 min-h-0` container.
  - Tab persistence: the state lives in Sidebar and survives level changes. At NATIONAL and STATE, `GRIEVANCES` displays as Leadership. At unit level the existing `highlightedLeader` effect still forces LEADERSHIP.

- [ ] **Step 1:** Implement.
- [ ] **Step 2:** Run `npm run lint`, `npm test` and `cd backend && uv run pytest tests/e2e/test_audit_api.py -q`. Expected: all PASS.
- [ ] **Step 3:** Browser check with the dev server, backend down (Offline) and up:
  - At India level, News loads cards and drifts, hover pauses it and mouse-out resumes it, and scrolling to the end loads more.
  - The state and ward levels show the tabs.
  - Light and dark themes both read correctly.
  - A 390px mobile sheet works.
  - Take screenshots.
- [ ] **Step 4:** Run the existing e2e: `npx playwright test e2e/dialogs.spec.js e2e/mobile.spec.js`. Expected: PASS, or failures that were already there, compared against `sit`.
- [ ] **Step 5:** Commit `feat(ui): Leadership and News tabs in the sidebar`, plus the spec and plan docs.
