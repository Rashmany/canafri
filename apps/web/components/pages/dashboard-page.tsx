'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  MessageSquare,
  Heart,
  Bookmark,
  Share2,
  MoreHorizontal,
  ArrowLeft,
  Lock,
  Link2,
  Copy,
  ThumbsDown,
  VolumeX,
  Ban,
  X,
  Send,
  Check,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

// â”€â”€â”€ Data Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface Post {
  id: number;
  name: string;
  handle: string;
  date: string;
  avatarSrc: string;
  text: string;
  fullText: string;
  category: 'free' | 'premium';
  likesCount: number;
  commentsCount: number;
  stakeReward?: string;
}

// â”€â”€â”€ Sample Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SAMPLE_POSTS: Post[] = [
  {
    id: 1,
    name: 'John Trek',
    handle: '@Johntrek',
    date: 'May 10',
    avatarSrc: '/images/default-avatar.png',
    category: 'free',
    likesCount: 142,
    commentsCount: 2,
    text: "Decentralized privacy-preserving smart contracts on Canton Network are revolutionizing how creators monetize their work without intermediaries.",
    fullText: `Decentralized privacy-preserving smart contracts on Canton Network are revolutionizing how creators monetize their work without intermediaries.

By leveraging Canton Coin (CC) read-stakes, writers and researchers can lock content behind instant cryptographic verification while keeping user transaction details confidential.

Unlike traditional web2 paywalls that take 30% cuts and delay payouts by weeks, Canton ledger transactions execute sub-second finality with automated pool splits directly to independent nodes.

Explore how sub-ledger privacy guarantees zero-knowledge data protection for sub-accounts and institutional participants across global financial rails.`,
  },
  {
    id: 2,
    name: 'Sarah Chen',
    handle: '@sarahc_web3',
    date: 'May 12',
    avatarSrc: '/images/default-avatar.png',
    category: 'free',
    likesCount: 98,
    commentsCount: 1,
    text: "Building scalable Web3 apps requires a fundamental shift in state management and asynchronous sub-agent coordination.",
    fullText: `Building scalable Web3 apps requires a fundamental shift in state management and asynchronous sub-agent coordination.

When designing decentralized workflows, maintaining linear state across micro-services often leads to race conditions and inconsistent UI states.

In this deep dive, we outline best practices for structured event-driven architectures, Optimistic UI updates with fallback toasts, and reliable WebSocket reconnect algorithms for high-throughput dApps.`,
  },
  {
    id: 3,
    name: 'Alex Rivera',
    handle: '@arivera_canton',
    date: 'May 14',
    avatarSrc: '/images/default-avatar.png',
    category: 'premium',
    stakeReward: '5 CC Read-Stake Required',
    likesCount: 310,
    commentsCount: 3,
    text: "EXCLUSIVE: Alpha report on Canton Network node staking yields and institutional Liquidity Pool migration patterns for Q3 2026.",
    fullText: `EXCLUSIVE: Alpha report on Canton Network node staking yields and institutional Liquidity Pool migration patterns for Q3 2026.

[PREMIUM UNLOCKED VIA CANTON COIN READ-STAKE]

Our automated chain indexing service has detected a 45% surge in institutional validator nodes staking Canton Coin over the last 14 days.

Key Insights:
1. Average annual percentage yield (APY) for active validators currently sits at 14.2% in CC tokens.
2. Cross-domain privacy bridges have handled over 12,000 confidential asset swaps without single-party verification bottlenecks.
3. Recommended staking strategy for maximum compound yield: Re-invest daily micro-rewards into tier-1 verification pools before bi-weekly epoch settlements.`,
  },
];

// â”€â”€â”€ Comment Item Type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface CommentItem {
  id: string;
  postId: number;
  name: string;
  handle: string;
  text: string;
  time: string;
}

const INITIAL_COMMENTS: CommentItem[] = [
  { id: 'c1', postId: 1, name: 'Sarah Chen', handle: '@sarahc_web3', text: 'Staggering read! Sub-ledger privacy bridges are a game changer.', time: '1h ago' },
  { id: 'c2', postId: 1, name: 'Dev Josh', handle: '@joshdev', text: 'Does this integrate with canton contract bindings directly?', time: '30m ago' },
  { id: 'c3', postId: 2, name: 'Alex Rivera', handle: '@arivera_canton', text: 'Optimistic UI handling with Fastify endpoints was super smooth.', time: '3h ago' },
  { id: 'c4', postId: 3, name: 'Crypto King', handle: '@cryptoking', text: 'Unlocking this with stake was worth every CC. Insane returns.', time: '10m ago' },
];

// â”€â”€â”€ Action Bar Component (Refactored Gap & Icons) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ActionBarProps {
  onStar?: () => void;
  onLike?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onComment?: () => void;
  starred?: boolean;
  liked?: boolean;
  bookmarked?: boolean;
  showStar?: boolean;
  commentsCount?: number;
  likesCount?: number;
}

function ActionBar({
  onStar,
  onLike,
  onBookmark,
  onShare,
  onComment,
  starred,
  liked,
  bookmarked,
  showStar = true,
  commentsCount = 0,
  likesCount = 0,
}: ActionBarProps) {
  return (
    <div className="flex items-center justify-between w-full pt-2 px-1">
      {showStar && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onStar?.(); }}
          className={`flex items-center gap-1.5 transition-all duration-300 ease-out hover:scale-110 shrink-0 ${
            starred ? 'text-[#8C5CFF]' : 'text-foreground/50 hover:text-[#8C5CFF]'
          }`}
          title="Confidential Read-Stake"
        >
          <Sparkles size={16} fill="currentColor" />
        </button>
      )}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onComment?.(); }}
        className="flex items-center gap-1.5 text-foreground/50 hover:text-foreground transition-all duration-300 ease-out hover:scale-110 shrink-0"
        title="View Comments"
      >
        <MessageSquare size={16} />
        {commentsCount > 0 && <span className="font-sans text-[11px] font-medium">{commentsCount}</span>}
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onLike?.(); }}
        className={`flex items-center gap-1.5 transition-all duration-300 ease-out hover:scale-110 shrink-0 ${
          liked ? 'text-red-500' : 'text-foreground/50 hover:text-red-400'
        }`}
        title="Like"
      >
        <Heart size={16} fill={liked ? '#EF4444' : 'none'} />
        {likesCount > 0 && <span className="font-sans text-[11px] font-medium">{likesCount}</span>}
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onBookmark?.(); }}
        className={`flex items-center gap-1.5 transition-all duration-300 ease-out hover:scale-110 shrink-0 ${
          bookmarked ? 'text-[#8C5CFF]' : 'text-foreground/50 hover:text-[#8C5CFF]'
        }`}
        title="Bookmark"
      >
        <Bookmark size={16} fill={bookmarked ? '#8C5CFF' : 'none'} />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onShare?.(); }}
        className="flex items-center gap-1.5 text-foreground/50 hover:text-foreground transition-all duration-300 ease-out hover:scale-110 shrink-0"
        title="Confidential Share options"
      >
        <Share2 size={16} />
      </button>
    </div>
  );
}

// â”€â”€â”€ Post Card Component (Dropdown options beside timestamp) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface PostCardProps {
  post: Post;
  isSelected: boolean;
  onClick: () => void;
  liked: boolean;
  bookmarked: boolean;
  isFavoriteCreator: boolean;
  onLikeToggle: () => void;
  onBookmarkToggle: () => void;
  onFavoriteCreatorToggle: () => void;
  onMuteUser: () => void;
  onBlockUser: () => void;
  onDislikePost: () => void;
  onShareOpen: () => void;
  onCommentsOpen?: () => void;
}

function PostCard({
  post,
  isSelected,
  onClick,
  liked,
  bookmarked,
  isFavoriteCreator,
  onLikeToggle,
  onBookmarkToggle,
  onFavoriteCreatorToggle,
  onMuteUser,
  onBlockUser,
  onDislikePost,
  onShareOpen,
  onCommentsOpen,
}: PostCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://canafri.io/post/${post.id}`);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setMenuOpen(false);
    }, 1500);
  };

  return (
    <div
      onClick={onClick}
      className={[
        'flex flex-col justify-between p-4 gap-4 cursor-pointer border-b border-border transition-all duration-300 ease-out relative',
        isSelected ? 'bg-card ring-1 ring-[#8C5CFF]/30' : 'bg-background hover:bg-card/60',
      ].join(' ')}
      style={{ minHeight: 170 }}
    >
      <div className="flex items-start gap-3 flex-1">
        <div className="size-[38px] shrink-0 rounded-full overflow-hidden bg-card border border-border flex items-center justify-center font-sans font-bold text-xs text-foreground">
          {post.name.charAt(0)}
        </div>
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <span className="font-sans text-[13px] font-semibold text-foreground truncate">
                {post.name}
              </span>
              <span className="font-sans text-[11px] text-muted truncate">
                {post.handle}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 relative">
              <span className="font-sans text-[11px] text-muted mr-1">
                {post.date}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="text-foreground/50 hover:text-foreground transition-colors p-1 rounded-full hover:bg-foreground/5"
                title="Options"
              >
                <MoreHorizontal size={15} />
              </button>

              {/* Dots Menu Dropdown list */}
              {menuOpen && (
                <div
                  ref={menuRef}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-7 w-[210px] rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-2xl z-40 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onFavoriteCreatorToggle();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3.5 py-2 font-sans text-[12px] text-foreground hover:bg-foreground/5 text-left transition duration-200"
                  >
                    <span>{isFavoriteCreator ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                    <Heart size={14} fill={isFavoriteCreator ? '#EF4444' : 'none'} className={isFavoriteCreator ? 'text-red-500' : 'text-foreground/40'} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    disabled={copied}
                    className="flex w-full items-center justify-between px-3.5 py-2 font-sans text-[12px] text-foreground hover:bg-foreground/5 text-left transition duration-200"
                  >
                    <span>{copied ? 'Copied!' : 'Copy Post Link'}</span>
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-foreground/40" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDislikePost();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3.5 py-2 font-sans text-[12px] text-foreground hover:bg-foreground/5 text-left transition duration-200"
                  >
                    <span>Dislike this post</span>
                    <ThumbsDown size={14} className="text-foreground/40" />
                  </button>
                  <div className="h-px w-full bg-border my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      onMuteUser();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3.5 py-2 font-sans text-[12px] text-red-500 hover:bg-red-500/5 text-left transition duration-200"
                  >
                    <span className="font-medium">Mute Creator</span>
                    <VolumeX size={14} className="text-red-500/70" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onBlockUser();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3.5 py-2 font-sans text-[12px] text-red-500 hover:bg-red-500/5 text-left transition duration-200"
                  >
                    <span className="font-medium">Block Creator</span>
                    <Ban size={14} className="text-red-500/70" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {post.category === 'premium' && (
            <span className="self-start rounded-full bg-[#8C5CFF]/15 px-2.5 py-0.5 font-sans text-[10px] font-semibold text-[#AC8EF3]">
              {post.stakeReward || 'Premium Content'}
            </span>
          )}

          <p className="font-sans text-[13px] font-normal leading-[20px] text-foreground/85 line-clamp-3">
            {post.text}
          </p>
        </div>
      </div>

      <ActionBar
        showStar={post.category === 'premium'}
        starred={true}
        liked={liked}
        bookmarked={bookmarked}
        likesCount={post.likesCount + (liked ? 1 : 0)}
        commentsCount={post.commentsCount}
        onStar={() => {
          toast('Confidential staking record is validated on-chain', 'success');
        }}
        onLike={onLikeToggle}
        onBookmark={onBookmarkToggle}
        onShare={onShareOpen}
        onComment={() => {
          onClick();
          if (onCommentsOpen) {
            setTimeout(() => {
              onCommentsOpen();
            }, 200);
          }
        }}
      />
    </div>
  );
}

// â”€â”€â”€ Twitter-style Reply Composer Overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MAX_CHARS = 280;

interface ReplyComposerProps {
  post: Post;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

function ReplyComposer({ post, onClose, onSubmit }: ReplyComposerProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const remaining = MAX_CHARS - text.length;
  const progress = Math.min(text.length / MAX_CHARS, 1);
  const circumference = 2 * Math.PI * 10; // r=10
  const strokeDashoffset = circumference * (1 - progress);
  const isOverLimit = remaining < 0;
  const isEmpty = text.trim().length === 0;

  const handleSubmit = () => {
    if (isEmpty || isOverLimit) return;
    onSubmit(text.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in slide-in-from-bottom-8 duration-300">
      {/* Top action bar â€” Cancel left, Post right */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="font-sans text-[13px] font-semibold text-foreground/70 hover:text-foreground transition-colors duration-200 px-1"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isEmpty || isOverLimit}
          className="rounded-full bg-[#8C5CFF] hover:bg-[#AC8EF3] disabled:opacity-40 px-4 py-1.5 font-sans text-[12px] font-bold text-white transition-all duration-200 cursor-pointer"
        >
          Reply
        </button>
      </div>

      {/* Original post preview */}
      <div className="flex items-start gap-3 px-4 py-4 border-b border-border/50 shrink-0">
        <div className="size-9 rounded-full bg-card border border-border flex items-center justify-center font-bold text-xs text-foreground shrink-0">
          {post.name.charAt(0)}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-sans text-[13px] font-bold text-foreground">{post.name}</span>
            <span className="font-sans text-[11px] text-muted">{post.handle}</span>
            <span className="font-sans text-[11px] text-muted">Â· {post.date}</span>
          </div>
          <p className="font-sans text-[12px] leading-relaxed text-foreground/70 line-clamp-3">{post.text}</p>
        </div>
      </div>

      {/* Reply row â€” current user + textarea */}
      <div className="flex items-start gap-3 px-4 pt-4 flex-1 min-h-0">
        <div className="size-9 rounded-full bg-[#8C5CFF]/15 border border-[#8C5CFF]/30 flex items-center justify-center font-bold text-xs text-[#AC8EF3] shrink-0 mt-0.5">
          J
        </div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Post your replyâ€¦"
          rows={6}
          className="flex-1 resize-none bg-transparent outline-none font-sans text-[15px] leading-relaxed text-foreground placeholder:text-muted/60 min-h-0"
        />
      </div>

      {/* Bottom toolbar â€” image icon + char counter */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 shrink-0 mt-auto">
        {/* Attachment icons */}
        <div className="flex items-center gap-3">
          <button type="button" className="text-[#8C5CFF] hover:text-[#AC8EF3] transition-colors p-1 rounded-lg hover:bg-[#8C5CFF]/10" title="Add image">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </button>
          <button type="button" className="text-[#8C5CFF] hover:text-[#AC8EF3] transition-colors p-1 rounded-lg hover:bg-[#8C5CFF]/10" title="Add GIF">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M8 12h-2v-1.5a1.5 1.5 0 013 0V12M8 12v2M13 10v4M16 10v4M16 12h2" />
            </svg>
          </button>
        </div>

        {/* Char counter circle progress */}
        <div className="flex items-center gap-2">
          <div className="relative size-6 flex items-center justify-center">
            <svg width="24" height="24" className="-rotate-90">
              <circle
                cx="12" cy="12" r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-foreground/10"
              />
              <circle
                cx="12" cy="12" r="10"
                fill="none"
                strokeWidth="2.5"
                stroke={isOverLimit ? '#EF4444' : remaining <= 20 ? '#F59E0B' : '#8C5CFF'}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.15s ease' }}
              />
            </svg>
            {remaining <= 20 && (
              <span className={`absolute font-sans text-[8px] font-bold ${isOverLimit ? 'text-red-500' : 'text-[#F59E0B]'}`}>
                {remaining}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Post Detail Reader Component (Canton Coin Stakewall & Medium layout) â”€â”€â”€â”€â”€â”€

interface PostDetailProps {
  post: Post;
  onBack: () => void;
  isUnlocked: boolean;
  onUnlock: () => void;
  liked: boolean;
  bookmarked: boolean;
  onLikeToggle: () => void;
  onBookmarkToggle: () => void;
  onShareOpen: () => void;
  comments: CommentItem[];
  onAddComment: (text: string) => void;
}

function PostDetail({
  post,
  onBack,
  isUnlocked,
  onUnlock,
  liked,
  bookmarked,
  onLikeToggle,
  onBookmarkToggle,
  onShareOpen,
  comments,
  onAddComment,
}: PostDetailProps) {
  const [staking, setStaking] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const { toast } = useToast();
  const commentsRef = useRef<HTMLDivElement>(null);
  const [likedCommentIds, setLikedCommentIds] = useState<string[]>([]);

  const handleLikeComment = (commentId: string) => {
    if (likedCommentIds.includes(commentId)) {
      setLikedCommentIds(likedCommentIds.filter((id) => id !== commentId));
    } else {
      setLikedCommentIds([...likedCommentIds, commentId]);
    }
  };

  const handleStakeClick = async () => {
    setStaking(true);
    await new Promise((r) => setTimeout(r, 1200));
    setStaking(false);
    onUnlock();
    toast('Confidential read-stake registered: 5 CC locked', 'success');
  };

  const isPremium = post.category === 'premium';
  const showContent = !isPremium || isUnlocked;

  const getPreviewText = () => {
    const paragraphs = post.fullText.split('\n\n');
    const previewCount = Math.ceil(paragraphs.length * 0.6);
    return paragraphs.slice(0, previewCount).join('\n\n');
  };

  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const postComments = comments.filter((c) => c.postId === post.id);

  return (
    <div className="flex flex-col flex-1 bg-background min-h-0 overflow-hidden relative">
      {/* Scrollable article + comments area */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-4 lg:py-6 px-0 pb-20 flex flex-col items-center gap-6">

        {/* Top back button row */}
        <div className="flex items-center justify-between w-full max-w-2xl gap-4 px-4 lg:px-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors duration-300 ease-out"
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-card hover:bg-foreground/5 transition-colors">
              <ArrowLeft size={18} />
            </div>
            <span className="font-sans text-[13px] font-semibold">Back to Feed</span>
          </button>
          <span className="font-sans text-[11px] text-muted uppercase tracking-wider font-semibold">
            Confidential Reader
          </span>
        </div>

        {/* Main post container - borderless, shadowless, max-w-2xl like Medium */}
        <div className="flex flex-col w-full max-w-2xl gap-6 bg-transparent py-4 px-4 lg:px-6">
          {/* Author info */}
          <div className="flex items-start gap-3">
            <div className="size-[42px] shrink-0 rounded-full overflow-hidden bg-card border border-border flex items-center justify-center font-sans font-bold text-sm text-foreground">
              {post.name.charAt(0)}
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-[14px] font-bold text-foreground">
                    {post.name}
                  </span>
                  <span className="font-sans text-[12px] text-muted font-normal">
                    {post.handle}
                  </span>
                </div>
              </div>
              {isPremium && (
                <span className="self-start mt-1 rounded-full bg-[#8C5CFF]/15 px-3 py-0.5 font-sans text-[11px] font-semibold text-[#AC8EF3]">
                  {post.stakeReward || 'Premium Verified Content'}
                </span>
              )}
            </div>
          </div>

          {/* Text body - Medium article style */}
          <div className="font-sans text-[15px] leading-[26px] text-foreground/90 whitespace-pre-line pt-2">
            {showContent ? (
              post.fullText
            ) : (
              <div className="flex flex-col gap-0">
                {/* 60% preview — fully readable, only a thin fade at the very last line */}
                <div className="relative space-y-4">
                  {getPreviewText()}
                  {/* Thin fade — only covers the last ~2 lines */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                </div>

                {/* Stakewall card — sits directly below the preview */}
                <div className="flex flex-col items-center text-center gap-4 pt-8 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-300 w-full">
                  {/* Small transparent "Read More" badge */}
                  <div
                    className="rounded-lg border border-[#8C5CFF]/30 bg-[#8C5CFF]/5 inline-flex items-center justify-center self-center"
                    style={{ paddingTop: '0.5px', paddingBottom: '0.5px', paddingLeft: '5px', paddingRight: '5px' }}
                  >
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#AC8EF3]">
                      Read More
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 max-w-md px-4">
                    <h4 className="font-sans text-sm font-bold text-foreground">Confidential Read-Stake Lock</h4>
                    <p className="font-sans text-[12px] leading-relaxed text-muted mt-1">
                      This premium content requires a cryptographic read-stake on the Canton sub-ledger. Stake 5 Canton Coins (CC) to immediately unlock and decrypt this creator's work.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleStakeClick}
                    disabled={staking}
                    className="w-full max-w-sm rounded-xl bg-[#8C5CFF] hover:bg-[#AC8EF3] py-2.5 font-sans text-[12px] font-semibold text-white transition-all duration-300 ease-out active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-[#8C5CFF]/15"
                  >
                    {staking ? 'Unlocking on Canton sub-ledger…' : 'Stake 5 CC & Continue Reading'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="pt-2">
            <ActionBar
              showStar={isPremium}
              starred={isUnlocked || !isPremium}
              liked={liked}
              bookmarked={bookmarked}
              likesCount={post.likesCount + (liked ? 1 : 0)}
              commentsCount={postComments.length + post.commentsCount}
              onStar={() => {
                if (isPremium && !isUnlocked) {
                  handleStakeClick();
                } else {
                  toast('Stake verified on Canton sub-ledger', 'success');
                }
              }}
              onLike={onLikeToggle}
              onBookmark={onBookmarkToggle}
              onShare={onShareOpen}
              onComment={scrollToComments}
            />
          </div>

          {/* Timestamp moved below ActionBar icons without extra border line */}
          <div className="font-sans text-[11px] text-muted/60 pt-2 px-1">
            {post.id === 1 ? '2:09pm · 5/10/2026' : post.id === 2 ? '3:45pm · 5/12/2026' : '10:14am · 5/15/2026'}
          </div>
        </div>

        {/* Farcaster-style full-width border divider line */}
        <div className="w-full border-b border-border" />

        {/* ── Inline Comment Section ── */}
        <div ref={commentsRef} className="w-full max-w-2xl flex flex-col gap-3 pt-4 pb-4 px-0">
          <div className="flex items-center gap-3 px-4 lg:px-6">
            <h3 className="font-sans text-[13px] font-bold text-foreground">
              Replies
            </h3>
            <span className="font-sans text-[11px] text-muted">
              {postComments.length + post.commentsCount}
            </span>
          </div>

          {postComments.length > 0 ? (
            postComments.map((c) => (
              /* Comment card â€” styled like a post content card */
              <div
                key={c.id}
                className="flex flex-col gap-3 py-4 px-4 lg:px-6 border-b border-border transition-colors duration-200 last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-full bg-background border border-border flex items-center justify-center font-bold text-xs text-foreground shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-sans text-[12px] font-bold text-foreground">{c.name}</span>
                        <span className="font-sans text-[11px] text-muted">{c.handle}</span>
                      </div>
                      <span className="font-sans text-[10px] text-muted">{c.time}</span>
                    </div>
                    <p className="font-sans text-[13px] leading-relaxed text-foreground/85 mt-1">{c.text}</p>
                  </div>
                </div>
                {/* Mini action row on comment card */}
                <div className="flex items-center gap-4 pl-12">
                  <button
                    type="button"
                    onClick={() => handleLikeComment(c.id)}
                    className={`flex items-center gap-1 transition-colors ${
                      likedCommentIds.includes(c.id) ? 'text-red-500' : 'text-foreground/40 hover:text-red-500'
                    }`}
                  >
                    <Heart size={13} fill={likedCommentIds.includes(c.id) ? '#EF4444' : 'none'} />
                    <span className="font-sans text-[10px]">Like</span>
                  </button>
                  <button type="button" onClick={() => setComposerOpen(true)} className="flex items-center gap-1 text-foreground/40 hover:text-[#8C5CFF] transition-colors">
                    <MessageSquare size={13} />
                    <span className="font-sans text-[10px]">Reply</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center py-10 border border-dashed border-border/50 rounded-2xl mx-4 lg:mx-6">
              <span className="font-sans text-[12px] text-muted">No replies yet — be the first to respond.</span>
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ Sticky Floating Reply Input Bar â€” pinned to bottom, no gap â”€â”€ */}
      <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md px-4 py-2.5 flex items-center gap-3 shrink-0 z-20">
        <div className="size-8 rounded-full bg-[#8C5CFF]/15 border border-[#8C5CFF]/30 flex items-center justify-center font-bold text-xs text-[#AC8EF3] shrink-0">
          J
        </div>
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="flex-1 text-left bg-card border border-border rounded-full px-4 py-2 font-sans text-[12px] text-muted hover:border-[#8C5CFF]/40 hover:bg-card/80 transition-all duration-200 cursor-text"
        >
          Post your replyâ€¦
        </button>
      </div>

      {/* Reply Composer Overlay */}
      {composerOpen && (
        <ReplyComposer
          post={post}
          onClose={() => setComposerOpen(false)}
          onSubmit={(text) => {
            onAddComment(text);
          }}
        />
      )}
    </div>
  );
}



// â”€â”€â”€ Share Options Dialog Overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€â”€ Share Options Dialog Overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ShareModalProps {
  post: Post;
  onClose: () => void;
}

function ShareModal({ post, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleShareOption = (platform: string) => {
    toast(`Successfully shared to ${platform}`, 'success');
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://canafri.io/post/${post.id}`);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-sm rounded-2xl flex flex-col shadow-2xl p-5 gap-4 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between shrink-0">
          <h3 className="font-sans text-sm font-bold text-foreground">Share Article</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground/50 hover:text-foreground p-1.5 rounded-full hover:bg-foreground/5 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleCopyLink}
            disabled={copied}
            className="flex w-full items-center gap-3 p-3 rounded-xl border border-border bg-background hover:bg-foreground/5 transition duration-200"
          >
            {copied ? (
              <>
                <Check size={16} className="text-green-500" />
                <span className="font-sans text-[12px] font-semibold text-green-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} className="text-[#8C5CFF]" />
                <span className="font-sans text-[12px] font-semibold text-foreground">Copy Article Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleShareOption('X / Twitter')}
            className="flex w-full items-center gap-3 p-3 rounded-xl border border-border bg-background hover:bg-foreground/5 transition duration-200"
          >
            <span className="font-sans font-bold text-[13px] text-[#8C5CFF] w-4 text-center">ð•</span>
            <span className="font-sans text-[12px] font-semibold text-foreground">Share on X (Twitter)</span>
          </button>

          <button
            type="button"
            onClick={() => handleShareOption('Telegram')}
            className="flex w-full items-center gap-3 p-3 rounded-xl border border-border bg-background hover:bg-foreground/5 transition duration-200"
          >
            <span className="font-sans font-bold text-[13px] text-[#8C5CFF] w-4 text-center">âœˆ</span>
            <span className="font-sans text-[12px] font-semibold text-foreground">Share on Telegram</span>
          </button>

          <button
            type="button"
            onClick={() => handleShareOption('WhatsApp')}
            className="flex w-full items-center gap-3 p-3 rounded-xl border border-border bg-background hover:bg-foreground/5 transition duration-200"
          >
            <span className="font-sans font-bold text-[13px] text-[#8C5CFF] w-4 text-center">ðŸ’¬</span>
            <span className="font-sans text-[12px] font-semibold text-foreground">Share on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface DashboardPageProps {
  activePage?: string;
  onNavigate?: (page: string) => void;
}

export default function DashboardPage({ activePage = 'Dashboard', onNavigate }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<'free' | 'premium' | 'bookmarks' | 'favorites'>('free');
  const [selectedPost, setSelectedPost] = useState<Post>(SAMPLE_POSTS[0]);
  const [mobileView, setMobileView] = useState<'feed' | 'detail'>('feed');

  // Sync activeTab with activePage prop changes
  useEffect(() => {
    if (activePage === 'Bookmarks') {
      setActiveTab('bookmarks');
      const firstBookmarked = SAMPLE_POSTS.find(p => bookmarkedPostIds.includes(p.id));
      if (firstBookmarked) setSelectedPost(firstBookmarked);
    } else if (activePage === 'Favorites') {
      setActiveTab('favorites');
      const firstFav = SAMPLE_POSTS.find(p => favoriteCreatorHandles.includes(p.handle));
      if (firstFav) setSelectedPost(firstFav);
    } else {
      if (activeTab === 'bookmarks' || activeTab === 'favorites') {
        setActiveTab('free');
        setSelectedPost(SAMPLE_POSTS[0]);
      }
    }
  }, [activePage]);

  // Tab change wrapper to navigate back to dashboard when clicks free/premium tabs
  const selectTab = (tab: 'free' | 'premium') => {
    setActiveTab(tab);
    if (activePage === 'Bookmarks' || activePage === 'Favorites') {
      onNavigate?.('Dashboard');
    }
    const firstOfCat = SAMPLE_POSTS.find(p => p.category === tab);
    if (firstOfCat) setSelectedPost(firstOfCat);
  };

  // Interactive States
  const [unlockedPremiumIds, setUnlockedPremiumIds] = useState<number[]>([1, 2]); // posts 1 & 2 are free / unlocked
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<number[]>([]);
  const [favoriteCreatorHandles, setFavoriteCreatorHandles] = useState<string[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [mutedUserHandles, setMutedUserHandles] = useState<string[]>([]);
  const [blockedUserHandles, setBlockedUserHandles] = useState<string[]>([]);
  const [dislikedPostIds, setDislikedPostIds] = useState<number[]>([]);

  // Dialog Overlays
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  const [commentsList, setCommentsList] = useState<CommentItem[]>(INITIAL_COMMENTS);

  const { toast } = useToast();

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setMobileView('detail');
  };

  const handleBack = () => {
    setMobileView('feed');
  };

  const handleAddComment = (text: string) => {
    const newC: CommentItem = {
      id: `c_${Date.now()}`,
      postId: selectedPost.id,
      name: 'Josh Trek',
      handle: '@joshtrek',
      text,
      time: 'Just now',
    };
    setCommentsList([newC, ...commentsList]);
    toast('Reply posted', 'success');
  };

  // Filtering lists of posts
  const filteredPosts = SAMPLE_POSTS.filter((post) => {
    // Filter out posts from blocked or muted creators
    if (blockedUserHandles.includes(post.handle)) return false;
    if (mutedUserHandles.includes(post.handle)) return false;
    // Filter out explicitly disliked posts
    if (dislikedPostIds.includes(post.id)) return false;

    if (activeTab === 'free') {
      return post.category === 'free';
    }
    if (activeTab === 'premium') {
      return post.category === 'premium';
    }
    if (activeTab === 'bookmarks') {
      return bookmarkedPostIds.includes(post.id);
    }
    if (activeTab === 'favorites') {
      return favoriteCreatorHandles.includes(post.handle);
    }
    return true;
  });

  return (
    <div className="h-full w-full bg-background flex overflow-hidden">
      <div className="flex flex-1 gap-6 px-0 py-0 h-full max-w-[1400px] mx-auto">
        
        {/* Left Panel: Feed List */}
        <div
          className={[
            'flex flex-col flex-1 bg-background overflow-hidden h-full',
            mobileView === 'detail' ? 'hidden md:flex' : 'flex',
          ].join(' ')}
        >
          {/* Tab Navigation (Only Free & Premium, dynamic title when Bookmarks or Favorites is active) */}
          <div className="border-b border-border bg-background shrink-0">
            {activeTab === 'bookmarks' ? (
              <div className="flex h-14 items-center justify-between px-5">
                <div className="flex flex-col gap-0.5">
                  <h2 className="font-sans text-[13px] font-bold text-foreground">Bookmarks</h2>
                  <span className="font-sans text-[10px] text-muted">Your saved articles & research</span>
                </div>
              </div>
            ) : activeTab === 'favorites' ? (
              <div className="flex h-14 items-center justify-between px-5">
                <div className="flex flex-col gap-0.5">
                  <h2 className="font-sans text-[13px] font-bold text-foreground">Favorite Creators</h2>
                  <span className="font-sans text-[10px] text-muted">Latest posts from creators you favor</span>
                </div>
              </div>
            ) : (
              <div className="flex h-14 items-end justify-center gap-12 px-4">
                <button
                  type="button"
                  onClick={() => selectTab('free')}
                  className="flex flex-col items-center pb-0 cursor-pointer group"
                >
                  <div className="flex items-center justify-center px-2 py-2">
                    <span
                      className={`font-sans text-[13px] font-semibold leading-[20px] transition-colors duration-300 ease-out ${
                        activeTab === 'free' ? 'text-foreground' : 'text-muted group-hover:text-foreground'
                      }`}
                    >
                      Free Content
                    </span>
                  </div>
                  <div
                    className={`h-[2px] w-full rounded-full transition-all duration-300 ease-out ${
                      activeTab === 'free' ? 'bg-[#8C5CFF]' : 'bg-transparent'
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => selectTab('premium')}
                  className="flex flex-col items-center pb-0 cursor-pointer group"
                >
                  <div className="flex items-center justify-center px-2 py-2 gap-1.5">
                    <Sparkles size={14} className={activeTab === 'premium' ? 'text-[#8C5CFF]' : 'text-muted'} />
                    <span
                      className={`font-sans text-[13px] font-semibold leading-[20px] transition-colors duration-300 ease-out ${
                        activeTab === 'premium' ? 'text-foreground' : 'text-muted group-hover:text-foreground'
                      }`}
                    >
                      Premium Staked
                    </span>
                  </div>
                  <div
                    className={`h-[2px] w-full rounded-full transition-all duration-300 ease-out ${
                      activeTab === 'premium' ? 'bg-[#8C5CFF]' : 'bg-transparent'
                    }`}
                  />
                </button>
              </div>
            )}
          </div>

          {/* Posts Feed Scroll Area */}
          <div className="flex flex-col overflow-y-auto no-scrollbar flex-1">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isSelected={selectedPost.id === post.id}
                  onClick={() => handlePostClick(post)}
                  liked={likedPostIds.includes(post.id)}
                  bookmarked={bookmarkedPostIds.includes(post.id)}
                  isFavoriteCreator={favoriteCreatorHandles.includes(post.handle)}
                  onLikeToggle={() => {
                    if (likedPostIds.includes(post.id)) {
                      setLikedPostIds(likedPostIds.filter((id) => id !== post.id));
                    } else {
                      setLikedPostIds([...likedPostIds, post.id]);
                    }
                  }}
                  onBookmarkToggle={() => {
                    if (bookmarkedPostIds.includes(post.id)) {
                      setBookmarkedPostIds(bookmarkedPostIds.filter((id) => id !== post.id));
                    } else {
                      setBookmarkedPostIds([...bookmarkedPostIds, post.id]);
                    }
                  }}
                  onFavoriteCreatorToggle={() => {
                    if (favoriteCreatorHandles.includes(post.handle)) {
                      setFavoriteCreatorHandles(favoriteCreatorHandles.filter((h) => h !== post.handle));
                    } else {
                      setFavoriteCreatorHandles([...favoriteCreatorHandles, post.handle]);
                    }
                  }}
                  onMuteUser={() => {
                    setMutedUserHandles([...mutedUserHandles, post.handle]);
                  }}
                  onBlockUser={() => {
                    setBlockedUserHandles([...blockedUserHandles, post.handle]);
                  }}
                  onDislikePost={() => {
                    setDislikedPostIds([...dislikedPostIds, post.id]);
                  }}
                  onShareOpen={() => setSharingPost(post)}
                  onCommentsOpen={() => {
                    const commentsEl = document.getElementById('replies-section');
                    commentsEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 p-8 text-center gap-2">
                <p className="font-sans text-xs font-semibold text-muted">
                  {activeTab === 'bookmarks'
                    ? 'No bookmarked articles yet.'
                    : activeTab === 'favorites'
                    ? 'No articles from favorite creators yet.'
                    : 'No articles in this feed.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Detail Article Reader */}
        <div
          className={[
            'flex flex-col flex-1 bg-background overflow-hidden h-full',
            mobileView === 'feed' ? 'hidden md:flex' : 'flex',
          ].join(' ')}
        >
          {selectedPost ? (
            <PostDetail
              post={selectedPost}
              onBack={handleBack}
              isUnlocked={unlockedPremiumIds.includes(selectedPost.id)}
              onUnlock={() => setUnlockedPremiumIds([...unlockedPremiumIds, selectedPost.id])}
              liked={likedPostIds.includes(selectedPost.id)}
              bookmarked={bookmarkedPostIds.includes(selectedPost.id)}
              onLikeToggle={() => {
                if (likedPostIds.includes(selectedPost.id)) {
                  setLikedPostIds(likedPostIds.filter((id) => id !== selectedPost.id));
                } else {
                  setLikedPostIds([...likedPostIds, selectedPost.id]);
                }
              }}
              onBookmarkToggle={() => {
                if (bookmarkedPostIds.includes(selectedPost.id)) {
                  setBookmarkedPostIds(bookmarkedPostIds.filter((id) => id !== selectedPost.id));
                } else {
                  setBookmarkedPostIds([...bookmarkedPostIds, selectedPost.id]);
                }
              }}
              onShareOpen={() => setSharingPost(selectedPost)}
              comments={commentsList}
              onAddComment={handleAddComment}
            />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-muted text-[13px] p-6">
              Select an article from the feed to read
            </div>
          )}
        </div>

      </div>

      {/* Share dialog modal overlay */}
      {sharingPost && (
        <ShareModal post={sharingPost} onClose={() => setSharingPost(null)} />
      )}
    </div>
  );
}
