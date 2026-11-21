// Paging for the social feed, matching GET /audit/social-posts: limit 1 to 50, next_offset null on the last page.
export const SOCIAL_PAGE_MAX = 50;

export function pageSocialPosts(all, limit = 10, offset = 0) {
  const size = Math.min(Math.max(Math.trunc(limit) || 1, 1), SOCIAL_PAGE_MAX);
  const start = Math.max(Math.trunc(offset) || 0, 0);
  const items = all.slice(start, start + size);
  const end = start + items.length;
  return { total: all.length, next_offset: end < all.length ? end : null, items };
}
