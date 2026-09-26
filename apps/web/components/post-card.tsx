'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Sparkle,
  MessageSquare,
  Heart,
  Bookmark,
  Share2,
  MoreHorizontal,
  Copy,
  ThumbsDown,
  VolumeX,
  Ban,
  Check,
} from 'lucide-react';

export interface Post {
  id: number | string;
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
  image?: string;
  topic?: string;
  publication?: string;
  contentStatus?: 'PENDING' | 'LIVE' | 'REJECTED' | 'DELISTED';
}

export interface ActionBarProps {
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

export function ActionBar({
  onStar, onLike, onBookmark, onShare, onComment,
  starred, liked, bookmarked, showStar = true, commentsCount = 0, likesCount = 0,
}: ActionBarProps) {
  return (
    <div className="flex items-center justify-between w-full pt-2 px-1">
      {showStar && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onStar?.(); }}
          className={`flex items-center gap-1.5 transition-all duration-300 ease-out hover:scale-110 shrink-0 ${starred ? 'text-[#8C5CFF]' : 'text-foreground/50 hover:text-[#8C5CFF]'}`}
          title="Confidential Read-Stake">
          <Sparkle size={16} fill="currentColor" />
        </button>
      )}
      <button type="button" onClick={(e) => { e.stopPropagation(); onComment?.(); }}
        className="flex items-center gap-1.5 text-foreground/50 hover:text-foreground transition-all duration-300 ease-out hover:scale-110 shrink-0" title="View Comments">
        <MessageSquare size={16} />
        {commentsCount > 0 && <span className="font-sans text-[11px] font-medium">{commentsCount}</span>}
      </button>
      <button type="button" onClick={(e) => { e.stopPropagation(); onLike?.(); }}
        className={`flex items-center gap-1.5 transition-all duration-300 ease-out hover:scale-110 shrink-0 ${liked ? 'text-red-500' : 'text-foreground/50 hover:text-red-400'}`} title="Like">
        <Heart size={16} fill={liked ? '#EF4444' : 'none'} />
        {likesCount > 0 && <span className="font-sans text-[11px] font-medium">{likesCount}</span>}
      </button>
      <button type="button" onClick={(e) => { e.stopPropagation(); onBookmark?.(); }}
        className={`flex items-center gap-1.5 transition-all duration-300 ease-out hover:scale-110 shrink-0 ${bookmarked ? 'text-[#8C5CFF]' : 'text-foreground/50 hover:text-[#8C5CFF]'}`} title="Bookmark">
        <Bookmark size={16} fill={bookmarked ? '#8C5CFF' : 'none'} />
      </button>
      <button type="button" onClick={(e) => { e.stopPropagation(); onShare?.(); }}
        className="flex items-center gap-1.5 text-foreground/50 hover:text-foreground transition-all duration-300 ease-out hover:scale-110 shrink-0" title="Confidential Share options">
        <Share2 size={16} />
      </button>
    </div>
  );
}

export interface PostCardProps {
  post: Post;
  isSelected?: boolean;
  onClick: () => void;
  liked: boolean;
  bookmarked: boolean;
  isFavoriteCreator: boolean;
  onLikeToggle: () => void;
  onBookmarkToggle: () => void;
  onFavoriteCreatorToggle: () => void;
  onMuteUser?: () => void;
  onBlockUser?: () => void;
  onDislikePost?: () => void;
  onShareOpen?: () => void;
  onCommentsOpen?: () => void;
  showLiveBadge?: boolean;
  onStar?: () => void;
  imageLayout?: 'compact' | 'stacked';
}

export function PostCard({
  post, isSelected = false, onClick, liked, bookmarked, isFavoriteCreator,
  onLikeToggle, onBookmarkToggle, onFavoriteCreatorToggle,
  onMuteUser, onBlockUser, onDislikePost, onShareOpen, onCommentsOpen,
  showLiveBadge = false, onStar, imageLayout = 'compact',
}: PostCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://canafri.io/post/${post.id}`);
    setCopied(true);
    setTimeout(() => { setCopied(false); setMenuOpen(false); }, 1500);
  };

  return (
    <div
      onClick={onClick}
      className={['flex flex-col justify-between p-4 gap-3 cursor-pointer border-b border-border transition-all duration-300 ease-out relative shrink-0 overflow-hidden w-full',
        isSelected ? 'bg-card ring-1 ring-[#8C5CFF]/30' : 'bg-background hover:bg-card/60'].join(' ')}
      style={{ minHeight: 180 }}
    >
      <div className="flex items-start gap-3 flex-1">
        <div className="size-[38px] shrink-0 rounded-full overflow-hidden bg-card border border-border flex items-center justify-center font-sans font-bold text-xs text-foreground">
          {post.avatarSrc ? <img src={post.avatarSrc} alt={post.name} className="w-full h-full object-cover" /> : post.name.charAt(0)}
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <span className="font-sans text-[13px] font-semibold text-foreground truncate">{post.name}</span>
              <span className="font-sans text-[11px] text-muted truncate">{post.handle}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 relative">
              <span className="font-sans text-[11px] text-muted mr-1">{post.date}</span>
              <button type="button" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="text-foreground/50 hover:text-foreground transition-colors p-1 rounded-full hover:bg-foreground/5" title="Options">
                <MoreHorizontal size={15} />
              </button>
              {menuOpen && (
                <div ref={menuRef} onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-7 w-[210px] rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-2xl z-40 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button type="button" onClick={() => { onFavoriteCreatorToggle(); setMenuOpen(false); }}
                    className="flex w-full items-center justify-between px-3.5 py-2 font-sans text-[12px] text-foreground hover:bg-foreground/5 text-left transition duration-200 cursor-pointer">
                    <span>{isFavoriteCreator ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                    <Heart size={14} fill={isFavoriteCreator ? '#EF4444' : 'none'} className={isFavoriteCreator ? 'text-red-500' : 'text-foreground/40'} />
                  </button>
                  <button type="button" onClick={handleCopyLink} disabled={copied}
                    className="flex w-full items-center justify-between px-3.5 py-2 font-sans text-[12px] text-foreground hover:bg-foreground/5 text-left transition duration-200 cursor-pointer">
                    <span>{copied ? 'Copied!' : 'Copy Post Link'}</span>
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-foreground/40" />}
                  </button>
                  <button type="button" onClick={() => { onDislikePost?.(); setMenuOpen(false); }}
                    className="flex w-full items-center justify-between px-3.5 py-2 font-sans text-[12px] text-foreground hover:bg-foreground/5 text-left transition duration-200 cursor-pointer">
                    <span>Dislike this post</span>
                    <ThumbsDown size={14} className="text-foreground/40" />
                  </button>
                  <div className="h-px w-full bg-border my-1" />
                  <button type="button" onClick={() => { onMuteUser?.(); setMenuOpen(false); }}
                    className="flex w-full items-center justify-between px-3.5 py-2 font-sans text-[12px] text-red-500 hover:bg-red-500/5 text-left transition duration-200 cursor-pointer">
                    <span className="font-medium">Mute Creator</span>
                    <VolumeX size={14} className="text-red-500/70" />
                  </button>
                  <button type="button" onClick={() => { onBlockUser?.(); setMenuOpen(false); }}
                    className="flex w-full items-center justify-between px-3.5 py-2 font-sans text-[12px] text-red-500 hover:bg-red-500/5 text-left transition duration-200 cursor-pointer">
                    <span className="font-medium">Block Creator</span>
                    <Ban size={14} className="text-red-500/70" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            {post.topic && <span className="rounded-full bg-[#8C5CFF]/10 px-2.5 py-0.5 font-sans text-[10px] font-semibold text-[#AC8EF3]">#{post.topic}</span>}
            {post.contentStatus && (post.contentStatus !== 'LIVE' || showLiveBadge) && (
              <span className={`rounded-full px-2.5 py-0.5 font-sans text-[10px] font-semibold ${
                post.contentStatus === 'PENDING' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : post.contentStatus === 'REJECTED' ? 'bg-rose-500/15 text-rose-500'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'}`}>
                {post.contentStatus === 'PENDING' ? 'Pending Review' : post.contentStatus === 'REJECTED' ? 'Rejected' : 'Live'}
              </span>
            )}
          </div>
          {imageLayout === 'stacked' ? (
            <>
              <div className="font-sans text-[13px] font-normal leading-[20px] text-foreground/85 line-clamp-3"
                dangerouslySetInnerHTML={{ __html: post.text }} />
              {post.image && (
                <div className="mt-2.5 rounded-xl overflow-hidden border border-border/40 max-h-[220px] w-full">
                  <img src={post.image} alt="Post media" className="w-full h-full object-cover" />
                </div>
              )}
            </>
          ) : (
            <div className="flex items-start gap-3 justify-between mt-0.5">
              <div className="font-sans text-[13px] font-normal leading-[20px] text-foreground/85 line-clamp-3 flex-1"
                dangerouslySetInnerHTML={{ __html: post.text }} />
              {post.image && (
                <div className="size-[68px] sm:size-[72px] shrink-0 rounded-xl overflow-hidden border border-border/40">
                  <img src={post.image} alt="Post media" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <ActionBar showStar={true} starred={true} liked={liked} bookmarked={bookmarked}
        likesCount={post.likesCount + (liked ? 1 : 0)} commentsCount={post.commentsCount}
        onStar={onStar} onLike={onLikeToggle} onBookmark={onBookmarkToggle} onShare={onShareOpen}
        onComment={() => { onClick(); if (onCommentsOpen) setTimeout(() => onCommentsOpen(), 200); }} />
    </div>
  );
}
