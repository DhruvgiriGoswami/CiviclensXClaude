import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCw, Newspaper } from 'lucide-react';
import { auditApi } from '../../pages/FollowTheRupee/auditApi';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { SocialPostCard } from './SocialPostCard';

const PAGE_SIZE = 10;
const TOUCH_RESUME_MS = 2000; // let a flick's momentum settle before the drift takes over again

function SkeletonCard() {
  return (
    <div className="glass-card light:bg-white rounded-2xl border border-slate-800 light:border-slate-200 p-3.5 space-y-3 animate-pulse" aria-hidden="true">
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-full bg-slate-800 light:bg-slate-200" />
        <span className="h-3 w-32 rounded bg-slate-800 light:bg-slate-200" />
      </div>
      <span className="block h-3 w-full rounded bg-slate-800 light:bg-slate-200" />
      <span className="block h-3 w-3/4 rounded bg-slate-800 light:bg-slate-200" />
    </div>
  );
}

// What Mumbai is saying: social posts that drift upward on their own and pause while you read.
export function NewsFeed() {
  const scrollRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | empty | error
  const [moreFailed, setMoreFailed] = useState(false);
  const nextOffsetRef = useRef(0); // null once every post is loaded: the next page starts the loop again
  const cycleRef = useRef(0);
  const loadingRef = useRef(false);
  const stoppedRef = useRef(false); // set on empty data or a failed page, so near-end doesn't retry every frame

  const [hovered, setHovered] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const [touching, setTouching] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const touchTimerRef = useRef(null);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || stoppedRef.current) return;
    loadingRef.current = true;
    let offset = nextOffsetRef.current;
    if (offset === null) {
      offset = 0;
      cycleRef.current += 1;
    }
    const cycle = cycleRef.current;
    try {
      const page = await auditApi.socialPosts(PAGE_SIZE, offset);
      if (!page.total) {
        stoppedRef.current = true;
        setStatus('empty');
        return;
      }
      nextOffsetRef.current = page.next_offset;
      setPosts((prev) => [...prev, ...page.items.map((post) => ({ key: `${post.post_id}-${cycle}`, post }))]);
      setStatus('ready');
    } catch {
      stoppedRef.current = true;
      setStatus((s) => (s === 'ready' ? s : 'error'));
      setMoreFailed(true);
    } finally {
      loadingRef.current = false;
    }
  }, []);

  const retry = () => {
    stoppedRef.current = false;
    setMoreFailed(false);
    if (status === 'error') setStatus('loading');
    loadMore();
  };

  useEffect(() => {
    loadMore();
  }, [loadMore]);

  useEffect(() => () => clearTimeout(touchTimerRef.current), []);

  const paused = userPaused || hovered || keyboardFocus || touching || status !== 'ready';
  const { reduced } = useAutoScroll(scrollRef, { paused, onNearEnd: status === 'ready' ? loadMore : undefined });

  const onTouchStart = () => {
    clearTimeout(touchTimerRef.current);
    setTouching(true);
  };
  const onTouchEnd = () => {
    clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => setTouching(false), TOUCH_RESUME_MS);
  };
  // Only keyboard focus pauses: a mouse click focuses the card too, but leaving with the mouse should resume.
  const onFocus = (e) => setKeyboardFocus(e.target.matches?.(':focus-visible') ?? false);
  const onBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setKeyboardFocus(false);
  };

  const showToggle = status === 'ready' && !reduced;
  const liveLabel = paused ? 'Paused' : 'Live';

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3 flex-shrink-0">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white light:text-slate-900 flex items-center gap-1.5">
            <Newspaper className="w-4 h-4 text-crimson-500" aria-hidden="true" />
            What Mumbai is saying
          </h3>
          <p className="text-xs text-slate-400 light:text-slate-600 mt-0.5">Synthetic posts, Jun–Sep 2025 monsoon</p>
        </div>
        {showToggle && (
          <button
            type="button"
            onClick={() => setUserPaused((p) => !p)}
            aria-pressed={userPaused}
            aria-label={userPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
            title={userPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors flex-shrink-0 bg-slate-900 light:bg-slate-100 border-slate-800 light:border-slate-200 text-slate-300 light:text-slate-700 hover:border-crimson-500/60 hover:text-crimson-400"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${paused ? 'bg-slate-500' : 'bg-crimson-500 animate-pulse'}`} aria-hidden="true" />
            <span>{liveLabel}</span>
            {userPaused ? <Play className="w-3 h-3" aria-hidden="true" /> : <Pause className="w-3 h-3" aria-hidden="true" />}
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        role="feed"
        aria-busy={status === 'loading'}
        aria-label="Social posts from Mumbai"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onFocus={onFocus}
        onBlur={onBlur}
        className="flex-1 min-h-0 overflow-y-auto px-5 pb-5 space-y-3"
      >
        {status === 'loading' && [0, 1, 2].map((i) => <SkeletonCard key={i} />)}

        {status === 'empty' && (
          <div className="text-center p-6 glass-card light:bg-white rounded-2xl border border-slate-800 light:border-slate-200">
            <p className="text-sm text-slate-300 light:text-slate-700">No posts to show yet.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center p-6 glass-card light:bg-white rounded-2xl border border-slate-800 light:border-slate-200 space-y-3">
            <p className="text-sm text-slate-300 light:text-slate-700">We could not load the posts.</p>
            <button
              type="button"
              onClick={retry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-bold transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
              Try again
            </button>
          </div>
        )}

        {posts.map(({ key, post }) => <SocialPostCard key={key} post={post} />)}

        {status === 'ready' && moreFailed && (
          <button
            type="button"
            onClick={retry}
            className="w-full py-2 rounded-xl border border-slate-800 light:border-slate-200 text-xs font-bold text-slate-300 light:text-slate-700 hover:border-crimson-500/60 hover:text-crimson-400 transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
            Could not load more posts. Try again
          </button>
        )}
      </div>
    </div>
  );
}
