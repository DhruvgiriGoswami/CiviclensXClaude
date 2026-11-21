import React from 'react';
import { Twitter, Instagram, MessageCircle, Heart, Repeat2, AlertTriangle } from 'lucide-react';
import { formatPostDate, formatCount } from '../../utils/format';

// Generic avatar per platform: the posts are anonymised, so there are no profile photos.
const PLATFORM = {
  x: { Icon: Twitter, tint: 'bg-sky-500/15 text-sky-400 light:bg-sky-100 light:text-sky-700' },
  instagram: { Icon: Instagram, tint: 'bg-pink-500/15 text-pink-400 light:bg-pink-100 light:text-pink-700' },
  whatsapp: { Icon: MessageCircle, tint: 'bg-emerald-500/15 text-emerald-400 light:bg-emerald-100 light:text-emerald-700' },
};

export function SocialPostCard({ post }) {
  const { Icon, tint } = PLATFORM[post.platform] || PLATFORM.x;
  const author = post.author_handle || 'Anonymous';

  return (
    <article
      tabIndex={0}
      aria-label={`${author} on ${post.source}, ${formatPostDate(post.posted_at)}`}
      className="glass-card light:bg-white rounded-2xl border border-slate-800 light:border-slate-200 p-3.5 space-y-2.5 shadow-sm hover:border-crimson-500/60 focus-visible:border-crimson-500 focus-visible:outline-none transition-all"
    >
      <header className="flex items-start gap-2.5">
        <span className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${tint}`} aria-hidden="true">
          <Icon className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-white light:text-slate-900 truncate">{author}</span>
            <time dateTime={post.posted_at} className="text-xs text-slate-400 light:text-slate-600 flex-shrink-0">
              {formatPostDate(post.posted_at)}
            </time>
          </div>
          <span className="text-xs text-slate-400 light:text-slate-600 truncate block">{post.source}</span>
        </div>
      </header>

      <p className="text-sm text-slate-200 light:text-slate-800 leading-relaxed whitespace-pre-line break-words">{post.text}</p>

      {post.unverified && (
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 light:text-amber-700 border border-amber-500/40">
          <AlertTriangle className="w-3 h-3" aria-hidden="true" />
          Unverified forward
        </span>
      )}

      <footer className="flex items-center gap-3 pt-2 border-t border-slate-800 light:border-slate-200 text-xs text-slate-400 light:text-slate-600">
        <span className="flex items-center gap-1">
          <Heart className="w-3.5 h-3.5 text-crimson-500" aria-hidden="true" />
          <span className="font-bold text-slate-200 light:text-slate-800">{formatCount(post.engagement)}</span>
          {post.engagement_label}
        </span>
        {post.shared_count > 1 && (
          <span className="flex items-center gap-1">
            <Repeat2 className="w-3.5 h-3.5" aria-hidden="true" />
            Shared {post.shared_count}×
          </span>
        )}
      </footer>
    </article>
  );
}
