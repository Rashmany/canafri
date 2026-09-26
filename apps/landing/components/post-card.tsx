'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Heart,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';

export interface Post {
  id: number | string;
  name: string;
  handle: string;
  date: string;
  avatarSrc: string;
  text: string;
  fullText?: string;
  category?: 'free' | 'premium';
  likesCount: number;
  commentsCount: number;
  stakeReward?: string;
  image?: string;
  topic?: string;
  publication?: string;
  contentStatus?: 'PENDING' | 'LIVE' | 'REJECTED' | 'DELISTED';
  readTime?: string;
}

export interface PostCardProps {
  post: Post;
  isSelected?: boolean;
  onClick?: () => void;
  liked?: boolean;
  bookmarked?: boolean;
  onLikeToggle?: () => void;
  onBookmarkToggle?: () => void;
  showLiveBadge?: boolean;
}

export function PostCard({
  post,
  onClick,
  liked: controlledLiked,
  bookmarked: controlledBookmarked,
  onLikeToggle,
  onBookmarkToggle,
}: PostCardProps) {
  const [internalLiked, setInternalLiked] = useState(false);
  const [internalBookmarked, setInternalBookmarked] = useState(false);

  const liked = controlledLiked !== undefined ? controlledLiked : internalLiked;
  const bookmarked = controlledBookmarked !== undefined ? controlledBookmarked : internalBookmarked;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLikeToggle) {
      onLikeToggle();
    } else {
      setInternalLiked(!internalLiked);
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBookmarkToggle) {
      onBookmarkToggle();
    } else {
      setInternalBookmarked(!internalBookmarked);
    }
  };

  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="group relative flex flex-col justify-between w-full h-[220px] p-5 rounded-2xl bg-[#0B0B0B] hover:bg-[#121212] transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_32px_rgba(50,0,83,0.3)] hover:-translate-y-1 cursor-pointer overflow-hidden select-none"
    >
      {/* Top ambient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#8C5CFF]/[0.05] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Top row: Creator Profile & Topic Tag */}
      <div className="flex flex-col gap-2 relative z-10">
        <div className="flex items-center justify-between gap-2">
          {/* Creator Avatar & Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 shrink-0 rounded-full overflow-hidden bg-[#181818] ring-2 ring-[#8C5CFF]/20 flex items-center justify-center font-sans font-bold text-xs text-white">
              {post.avatarSrc ? (
                <img
                  src={post.avatarSrc}
                  alt={post.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                post.name.charAt(0)
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-sans text-[13.5px] font-semibold text-white group-hover:text-[#AC8EF3] transition-colors truncate">
                  {post.name}
                </span>
                <CheckCircle2 size={13} className="text-[#8C5CFF] shrink-0 fill-[#8C5CFF]/20" />
              </div>
              <span className="font-sans text-[11.5px] text-[#a1a1aa] truncate">
                {post.handle}
              </span>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 shrink-0 text-right">
            <span className="font-sans text-[11px] text-[#71717a]">{post.date}</span>
          </div>
        </div>

        {/* Topic hashtag */}
        {post.topic && (
          <div className="flex items-center">
            <span className="rounded-full bg-[#8C5CFF]/15 px-2.5 py-0.5 font-sans text-[10.5px] font-semibold text-[#AC8EF3] tracking-wide">
              #{post.topic}
            </span>
          </div>
        )}
      </div>

      {/* Middle row: Text content only (no pictures) */}
      <div className="my-auto relative z-10">
        <div
          className="font-sans text-[13px] font-normal leading-[21px] text-[#d4d4d8] line-clamp-3"
          dangerouslySetInnerHTML={{ __html: post.text }}
        />
      </div>

      {/* Bottom row: Social counters */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.05] relative z-10 w-full">
        {/* Social counters */}
        <div className="flex items-center gap-3.5">
          {/* Comments count */}
          <div className="flex items-center gap-1.5 text-[#a1a1aa] text-[11.5px] font-sans">
            <MessageSquare size={14} />
            <span>{post.commentsCount}</span>
          </div>

          {/* Likes toggle */}
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-[11.5px] font-sans transition-colors cursor-pointer ${
              liked ? 'text-red-400' : 'text-[#a1a1aa] hover:text-red-400'
            }`}
            title="Like"
          >
            <Heart size={14} fill={liked ? '#EF4444' : 'none'} />
            <span>{post.likesCount + (liked ? 1 : 0)}</span>
          </button>

          {/* Bookmark toggle */}
          <button
            type="button"
            onClick={handleBookmark}
            className={`transition-colors cursor-pointer p-0.5 ${
              bookmarked ? 'text-[#8C5CFF]' : 'text-[#a1a1aa] hover:text-[#8C5CFF]'
            }`}
            title="Bookmark"
          >
            <Bookmark size={14} fill={bookmarked ? '#8C5CFF' : 'none'} />
          </button>
        </div>
      </div>
    </article>
  );
}
