'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DashboardPageSkeleton } from '@/components/ui/skeleton';
import Footer from '@/components/layout/footer';
import {
  Sparkle,
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
  PenSquare,
  Image as ImageIcon,
  Video,
  Globe,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  HelpCircle,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

// â”€â”€â”€ Data Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  contentStatus?: 'PENDING' | 'LIVE' | 'REJECTED' | 'DELISTED'; // backend status
}

// ─── Helper: map a backend content record to the Post UI type ─────────────────────

function mapContentToPost(c: any): Post {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = new Date(c.publishedAt || c.createdAt || Date.now());
  const dateStr = `${months[d.getMonth()]} ${d.getDate()}`;

  const creatorName = c.creator?.displayName || c.creator?.username || 'Creator';
  const creatorHandle = c.creator?.username
    ? `@${c.creator.username.replace(/^@/, '')}`
    : '@creator';

  // Strip HTML tags for the feed card snippet
  const plainText = (c.bodyIpfsHash || c.body || c.title || '').replace(/<[^>]*>/g, '');
  const snippet = plainText.length > 200 ? plainText.slice(0, 200) + '…' : plainText;

  return {
    id: c.id,
    name: creatorName,
    handle: creatorHandle,
    date: dateStr,
    avatarSrc: c.creator?.avatarUrl || '',
    text: snippet || c.title,
    fullText: c.body || c.bodyIpfsHash || c.title || '',
    category: 'premium',
    stakeReward: `${c.priceCC || 5} CC Read-Stake Required`,
    likesCount: c.readCount || 0,
    commentsCount: 0,
    image: c.coverImageUrl || undefined,
    topic: c.topic || undefined,
    publication: c.publication || undefined,
    contentStatus: c.status || undefined,
  };
}

// ──────────────────────────────────────────────────────────────────────────────────
// Comment Item Type
// ──────────────────────────────────────────────────────────────────────────────────

export interface CommentItem {
  id: string;
  postId: number | string;
  name: string;
  handle: string;
  text: string;
  time: string;
}


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
          <Sparkle size={16} fill="currentColor" />
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

export interface PostCardProps {
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
  showLiveBadge?: boolean;
}

export function PostCard({
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
  showLiveBadge = false,
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
        'flex flex-col justify-between p-4 gap-4 cursor-pointer border-b border-border transition-all duration-300 ease-out relative shrink-0',
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

          <div className="flex flex-wrap gap-1.5 items-center">
            {post.topic && (
              <span className="rounded-full bg-[#8C5CFF]/10 px-2.5 py-0.5 font-sans text-[10px] font-semibold text-[#AC8EF3]">
                #{post.topic}
              </span>
            )}
            {post.contentStatus && (post.contentStatus !== 'LIVE' || showLiveBadge) && (
              <span
                className={`rounded-full px-2.5 py-0.5 font-sans text-[10px] font-semibold ${
                  post.contentStatus === 'PENDING'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : post.contentStatus === 'REJECTED'
                    ? 'bg-rose-500/15 text-rose-500'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {post.contentStatus === 'PENDING'
                  ? 'Pending Review'
                  : post.contentStatus === 'REJECTED'
                  ? 'Rejected'
                  : 'Live'}
              </span>
            )}
          </div>

          <div 
            className="font-sans text-[13px] font-normal leading-[20px] text-foreground/85 line-clamp-3"
            dangerouslySetInnerHTML={{ __html: post.text }}
          />

          {post.image && (
            <div className="mt-2.5 rounded-xl overflow-hidden border border-border/40 max-h-[220px] w-full">
              <img src={post.image} alt="Post media" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      <ActionBar
        showStar={true}
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

// ─── Publish Composer — Rich-Text (Medium-style, 10 k chars) ──────────────────

const MAX_PUBLISH_CHARS = 10_000;

interface PublishComposerProps {
  onClose: () => void;
  onPublish: (html: string, visibility: string, image?: string, topic?: string, publication?: string) => void;
}

function PublishComposer({ onClose, onPublish }: PublishComposerProps) {
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [draftHtml, setDraftHtml] = useState('');
  const [visibility, setVisibility] = useState<'everyone' | 'premium'>('premium');
  const [showVisibility, setShowVisibility] = useState(false);
  
  // Customization States
  const [postImages, setPostImages] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [showTopicSelector, setShowTopicSelector] = useState(false);

  const [charCount, setCharCount] = useState(0);
  const [isEmpty, setIsEmpty] = useState(true);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (viewMode === 'edit') {
      const t = setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
          if (draftHtml) {
            editorRef.current.innerHTML = draftHtml;
            const txt = editorRef.current.innerText || '';
            setCharCount(txt.length);
            setIsEmpty(txt.trim().length === 0);
          }
        }
      }, 50);
      return () => clearTimeout(t);
    }
  }, [viewMode]);

  // Sync draft HTML in real-time when side-by-side (desktop)
  const handleInput = () => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML || '';
    const txt = el.innerText || '';
    setDraftHtml(html);
    setCharCount(txt.length);
    setIsEmpty(txt.trim().length === 0);
  };

  const refreshActiveFormats = () => {
    const formats = new Set<string>();
    if (document.queryCommandState('bold'))        formats.add('bold');
    if (document.queryCommandState('italic'))      formats.add('italic');
    if (document.queryCommandState('underline'))   formats.add('underline');
    if (document.queryCommandState('insertUnorderedList')) formats.add('ul');
    if (document.queryCommandState('insertOrderedList'))   formats.add('ol');
    setActiveFormats(formats);
  };

  const applyFormat = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value ?? undefined);
    editorRef.current?.focus();
    refreshActiveFormats();
    handleInput();
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setPostImages((prev) => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
      toast(`${files.length} ${files.length === 1 ? 'image' : 'images'} attached`, 'success');
    }
    if (e.target) e.target.value = '';
  };

  const isOverLimit = charCount > MAX_PUBLISH_CHARS;
  const remaining   = MAX_PUBLISH_CHARS - charCount;
  const progress    = Math.min(charCount / MAX_PUBLISH_CHARS, 1);
  const circumference = 2 * Math.PI * 13;
  const strokeDashoffset = circumference * (1 - progress);

  const handlePublish = () => {
    let finalHtml = editorRef.current?.innerHTML || draftHtml;
    if (postImages.length > 0) {
      const imgTags = postImages.map(img => `<img src="${img}" alt="Attached media" class="my-4 rounded-xl max-h-[400px] w-full object-cover" />`).join('');
      finalHtml = `${finalHtml}\n${imgTags}`;
    }
    if (!finalHtml.trim()) return;
    if (isOverLimit) return;
    onPublish(finalHtml, visibility, postImages[0] || undefined, topic || undefined);
    onClose();
  };

  type FmtBtn = { key: string; cmd: string; title: string; label: React.ReactNode; value?: string };
  const fmtButtons: FmtBtn[] = [
    { key: 'bold',      cmd: 'bold',                title: 'Bold (Ctrl+B)',      label: <span className="font-bold text-[13px]">B</span> },
    { key: 'italic',    cmd: 'italic',              title: 'Italic (Ctrl+I)',    label: <span className="italic text-[13px]">I</span> },
    { key: 'underline', cmd: 'underline',           title: 'Underline (Ctrl+U)', label: <span className="underline text-[13px]">U</span> },
    { key: 'ul',        cmd: 'insertUnorderedList', title: 'Bullet List',
      label: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>
      ),
    },
    { key: 'ol',        cmd: 'insertOrderedList',   title: 'Numbered List',
      label: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4" strokeLinejoin="round"/><path d="M4 10h2" strokeLinejoin="round"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" strokeLinejoin="round"/></svg>
      ),
    },
    { key: 'quote',     cmd: 'formatBlock',         title: 'Quote', value: 'blockquote',
      label: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-0 md:p-4">
      
      {/* Hidden image file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Main Composer Box */}
      <div 
        className="relative bg-background w-full h-full md:h-[88vh] md:max-w-5xl md:rounded-2xl border-t md:border border-border/40 flex flex-col md:flex-row overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ── COLUMN 1: EDITOR PANE ── */}
        <div 
          className={cn(
            "flex flex-col flex-1 h-full bg-background border-r border-border/10",
            viewMode === 'preview' ? "hidden md:flex" : "flex"
          )}
        >
          {/* Top Bar (Editor Header) */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="font-sans text-[13px] font-semibold text-foreground/70 hover:text-foreground transition-colors px-1"
            >
              Cancel
            </button>
            <span className="font-sans text-[13px] font-bold text-foreground">New Post</span>
            
            {/* On Mobile: click to view preview. On Desktop: always shown side-by-side */}
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              disabled={isEmpty && postImages.length === 0}
              className="md:hidden rounded-full bg-[#8C5CFF] hover:bg-[#AC8EF3] disabled:opacity-40 disabled:cursor-not-allowed px-4 py-1.5 font-sans text-[12px] font-bold text-white transition-all cursor-pointer"
            >
              Preview
            </button>
            
            {/* Desktop spacer */}
            <div className="hidden md:block w-[50px]" />
          </div>

          {/* Sticky Formatting Toolbar */}
          <div className="flex items-center gap-0.5 px-4 py-2 border-b border-border/40 shrink-0 bg-background/95 backdrop-blur-sm">
            <div className="w-10 shrink-0" />

            <div className="flex items-center gap-0.5 flex-1 flex-wrap">
              {fmtButtons.map((btn) => (
                <button
                  key={btn.key}
                  type="button"
                  title={btn.title}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFormat(btn.cmd, btn.value);
                  }}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                    activeFormats.has(btn.key)
                      ? 'fmt-btn-active'
                      : 'text-foreground/50 hover:text-[#8C5CFF] hover:bg-[#8C5CFF]/8'
                  }`}
                >
                  {btn.label}
                </button>
              ))}

              <div className="w-px h-5 bg-border mx-1 shrink-0" />

              <button
                type="button"
                title="Add image"
                onClick={handleImageClick}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-[#8C5CFF] hover:bg-[#8C5CFF]/10 transition-colors cursor-pointer"
              >
                <ImageIcon size={16} />
              </button>
              <button
                type="button"
                title="Add video"
                onClick={() => toast('Video attachments require premium node verification', 'info')}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-[#8C5CFF] hover:bg-[#8C5CFF]/10 transition-colors cursor-pointer"
              >
                <Video size={16} />
              </button>
              <button
                type="button"
                title="Add paywall"
                onClick={() => toast('Paywall threshold config toggled via audience tag', 'info')}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-[#8C5CFF] hover:bg-[#8C5CFF]/10 transition-colors cursor-pointer"
              >
                <Lock size={16} />
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex gap-3">
            <div className="size-10 rounded-full bg-[#8C5CFF]/15 border border-[#8C5CFF]/30 flex items-center justify-center font-bold text-sm text-[#AC8EF3] shrink-0 mt-0.5">
              J
            </div>

            <div className="flex flex-col flex-1 gap-3 min-w-0">
              {/* Audience Indicator — All posts on platform require 5 CC Read-Stake */}
              <div className="flex items-center gap-1.5 bg-[#8C5CFF]/10 border border-[#8C5CFF]/30 rounded-full px-3 py-1 text-[11px] font-bold text-[#AC8EF3] self-start shrink-0">
                <Lock size={11} />
                <span>Premium (5 CC Read-Stake Required)</span>
              </div>

              {/* Rich-Text Input field */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                data-placeholder="What's happening in the CC ecosystem?"
                onInput={handleInput}
                onKeyUp={refreshActiveFormats}
                onMouseUp={refreshActiveFormats}
                className="publish-editor outline-none font-sans text-[15px] leading-relaxed text-foreground min-h-[160px] w-full focus:outline-none"
              />

              {/* Inline Uploaded Images Preview Grid */}
              {postImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2.5">
                  {postImages.map((img, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden max-h-[160px] border border-border/40 group">
                      <img src={img} alt={`Attached ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPostImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 size-6 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
                        title="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Editor Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/40 shrink-0">
            <span className={`font-sans text-[10px] pl-[52px] tabular-nums ${
              isOverLimit ? 'text-red-500 font-semibold' : remaining <= 1000 ? 'text-amber-400' : 'text-muted/50'
            }`}>
              {charCount > 0
                ? isOverLimit
                  ? `${Math.abs(remaining).toLocaleString()} over limit`
                  : `${charCount.toLocaleString()} / ${MAX_PUBLISH_CHARS.toLocaleString()}`
                : ''}
            </span>

            <div className="relative flex items-center justify-center size-7">
              <svg width="28" height="28" className="-rotate-90">
                <circle cx="14" cy="14" r="13" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-foreground/10" />
                <circle
                  cx="14" cy="14" r="13" fill="none" strokeWidth="2.5"
                  stroke={isOverLimit ? '#EF4444' : remaining <= 1000 ? '#F59E0B' : '#8C5CFF'}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.1s ease' }}
                />
              </svg>
              {remaining <= 1000 && (
                <span className={`absolute font-sans text-[8px] font-bold ${isOverLimit ? 'text-red-500' : 'text-amber-400'}`}>
                  {isOverLimit ? `-${Math.abs(remaining)}` : remaining >= 1000 ? `${(remaining/1000).toFixed(1)}k` : remaining}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── COLUMN 2: LIVE PREVIEW PANE ── */}
        <div 
          className={cn(
            "flex-col w-full md:w-[420px] shrink-0 bg-background border-l border-border h-full relative",
            viewMode === 'preview' ? "flex" : "hidden md:flex"
          )}
        >
          
          {/* Selectors Inline overlays */}

          {showTopicSelector && (
            <div className="absolute inset-0 z-30 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
              <div className="bg-background border border-border rounded-xl p-5 w-full max-w-[280px] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Set Topic Tag</span>
                  <button type="button" onClick={() => setShowTopicSelector(false)} className="text-muted hover:text-foreground"><X size={14} /></button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Staking, Privacy, DeFi"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary placeholder:text-muted/50"
                />
                <button
                  type="button"
                  onClick={() => setShowTopicSelector(false)}
                  className="w-full py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Top Header Row (Mobile Back Toggle) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-background">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className="md:hidden text-muted hover:text-foreground transition p-1.5 rounded-full hover:bg-foreground/5 cursor-pointer"
              aria-label="Back to edit"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="font-sans text-sm font-semibold tracking-wide text-foreground">Post preview</span>
            <div className="w-8 md:hidden" />
          </div>

          {/* Preview Content Wrapper */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 no-scrollbar pb-24">
            
            {/* Header instructions */}
            <div className="flex flex-col gap-2.5 text-center">
              <h4 className="text-[14px] font-medium text-foreground tracking-wide">Post preview</h4>
              <p className="text-[13px] text-muted leading-[18px] max-w-[280px] mx-auto font-normal">
                This is how your story will look like to the readers in the content feed.
              </p>
            </div>

            {/* Preview Card — uses real PostCard component for 1:1 visual parity */}
            <div className="pointer-events-none select-none">
              <PostCard
                post={{
                  id: 0,
                  name: 'Josh Trek',
                  handle: '@joshtrek',
                  date: 'Just now',
                  avatarSrc: '/images/default-avatar.png',
                  text: draftHtml || '<i>No content drafted yet.</i>',
                  fullText: draftHtml || '',
                  category: 'premium',
                  likesCount: 0,
                  commentsCount: 0,
                  image: postImages[0] ?? undefined,
                  topic: topic || undefined,
                }}
                isSelected={false}
                onClick={() => {}}
                liked={false}
                bookmarked={false}
                isFavoriteCreator={false}
                onLikeToggle={() => {}}
                onBookmarkToggle={() => {}}
                onFavoriteCreatorToggle={() => {}}
                onMuteUser={() => {}}
                onBlockUser={() => {}}
                onDislikePost={() => {}}
                onShareOpen={() => {}}
              />
            </div>

            {/* Customization Options Row */}
            <div className="w-full flex flex-col pt-4 border-t border-border gap-1">

              {/* Topic selector toggle */}
              <button
                type="button"
                onClick={() => setShowTopicSelector(true)}
                className="flex items-center justify-between py-3 hover:bg-foreground/5 transition rounded-lg px-2 text-left cursor-pointer"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-foreground">Topic</span>
                  <span className="text-[10px] text-muted">
                    {topic || 'No topic yet'}
                  </span>
                </div>
                <ChevronRight size={14} className="text-muted" />
              </button>
            </div>

            {/* Publish CTA */}
            <button
              type="button"
              onClick={handlePublish}
              disabled={isEmpty && postImages.length === 0}
              className="w-full rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all py-2.5 font-sans text-[13px] font-semibold text-white flex items-center justify-center cursor-pointer shadow-lg shadow-primary/10 mt-auto disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Publish
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}


// ─── Twitter-style Reply Composer Overlay ─────────────────────────────────────────

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
      {/* Top action bar — Cancel left, Post right */}
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
            <span className="font-sans text-[11px] text-muted">· {post.date}</span>
          </div>
          <p className="font-sans text-[12px] leading-relaxed text-foreground/70 line-clamp-3">{post.text}</p>
        </div>
      </div>

      {/* Reply row — current user + textarea */}
      <div className="flex items-start gap-3 px-4 pt-4 flex-1 min-h-0">
        <div className="size-9 rounded-full bg-[#8C5CFF]/15 border border-[#8C5CFF]/30 flex items-center justify-center font-bold text-xs text-[#AC8EF3] shrink-0 mt-0.5">
          J
        </div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Post your reply…"
          rows={6}
          className="flex-1 resize-none bg-transparent outline-none font-sans text-[15px] leading-relaxed text-foreground placeholder:text-muted/60 min-h-0"
        />
      </div>

      {/* Bottom toolbar — image icon + char counter */}
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

// ─── Post Detail Reader Component (Canton Coin Stakewall & Medium layout) ───

export interface PostDetailProps {
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
  currentUser?: { id: string; displayName: string; username: string; avatarUrl?: string } | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function PostDetail({
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
  currentUser,
  isExpanded = false,
  onToggleExpand,
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
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;
      if (!token) {
        toast('Please log in to stake and read premium content', 'error');
        setStaking(false);
        return;
      }
      const postId = String(post.id);
      const res = await fetch(`/api/content/${postId}/stake`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onUnlock();
        toast('Read-stake registered: 5 CC locked on Canton sub-ledger ✓', 'success');
      } else if (data.message?.includes('already have an active read-stake')) {
        // Already staked — just unlock the view
        onUnlock();
        toast('Read-stake already active — unlocking content', 'success');
      } else {
        toast(data.message || 'Failed to stake. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Stake error:', err);
      toast('Network error — could not complete stake', 'error');
    } finally {
      setStaking(false);
    }
  };

  const [showTooltip, setShowTooltip] = useState(false);
  const isPremium = post.category === 'premium';
  const showContent = !isPremium || isUnlocked;

  const getPreviewHtml = () => {
    if (!post.fullText) return '';
    const text = post.fullText;

    // Split HTML by paragraph or block elements to get ~40% of paragraphs
    const pBlocks = text.match(/<(p|div|h[1-6]|blockquote)[^>]*>[\s\S]*?<\/\1>/gi);
    if (pBlocks && pBlocks.length > 1) {
      const count = Math.max(1, Math.ceil(pBlocks.length * 0.4));
      return pBlocks.slice(0, count).join('');
    }

    const lines = text.split(/\n\n|<br\s*\/?>/i);
    if (lines && lines.length > 1) {
      const count = Math.max(1, Math.ceil(lines.length * 0.4));
      return lines.slice(0, count).join('<br/>');
    }

    // Fallback for single text block: take 40% of character length cleanly at tag boundary
    const targetLen = Math.floor(text.length * 0.4);
    const safeTagEnd = text.indexOf('>', targetLen);
    return text.slice(0, safeTagEnd > -1 ? safeTagEnd + 1 : targetLen);
  };

  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const postComments = comments.filter((c) => c.postId === post.id);

  return (
    <div
      key={isExpanded ? 'expanded' : 'split'}
      className={[
        'flex flex-col flex-1 bg-background h-full min-h-0 overflow-hidden relative',
        isExpanded ? 'animate-reader-expand' : '',
      ].join(' ')}
    >
      {/* Scrollable article + comments area */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-4 lg:py-6 px-0 pb-28 flex flex-col items-center gap-6">

        {/* Top back & expand button row */}
        <div className="flex items-center justify-between w-full max-w-2xl gap-4 px-4 lg:px-6">
          {/* Mobile Back Button (< md) */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors duration-300 ease-out md:hidden cursor-pointer"
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-card hover:bg-foreground/5 transition-colors">
              <ArrowLeft size={18} />
            </div>
            <span className="font-sans text-[13px] font-semibold">Back to Feed</span>
          </button>

          {/* Desktop/Tablet Expand / Collapse Button (md+) */}
          {onToggleExpand ? (
            <button
              type="button"
              onClick={onToggleExpand}
              className="hidden md:flex items-center gap-2 text-foreground/80 hover:text-foreground transition-all duration-200 ease-out cursor-pointer group active:scale-95"
              title={isExpanded ? 'Collapse reader to split view' : 'Expand reader to full width'}
            >
              <div className={[
                'flex size-8 items-center justify-center rounded-full border border-border/50 shadow-sm',
                'transition-all duration-300 ease-in-out',
                'group-hover:bg-[#8C5CFF]/15 group-hover:text-[#AC8EF3] group-hover:border-[#8C5CFF]/30 group-hover:shadow-[0_0_12px_rgba(140,92,255,0.2)]',
                isExpanded ? 'bg-[#8C5CFF]/10 text-[#AC8EF3] border-[#8C5CFF]/25' : 'bg-card text-foreground/70',
              ].join(' ')}>
                <span className={`transition-transform duration-300 ease-in-out flex items-center justify-center ${isExpanded ? 'rotate-180 scale-90' : 'rotate-0 scale-100'}`}>
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </span>
              </div>
              <span className="font-sans text-[13px] font-semibold transition-all duration-200">
                {isExpanded ? 'Collapse View' : 'Expand Article'}
              </span>
            </button>
          ) : (
            <div className="hidden md:block" />
          )}

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
              <div className="flex flex-wrap gap-1.5 items-center mt-1">
                {post.topic && (
                  <span className="rounded-full bg-[#8C5CFF]/10 px-2.5 py-0.5 font-sans text-[10px] font-semibold text-[#AC8EF3]">
                    #{post.topic}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Text body - Medium article style */}
          <div className="font-sans text-[15px] leading-[26px] text-foreground/90 pt-2">
            {showContent ? (
              <div className="space-y-4">
                <div dangerouslySetInnerHTML={{ __html: post.fullText }} className="publish-editor whitespace-pre-wrap break-words" />
                {post.image && (
                  <div className="mt-4 rounded-2xl overflow-hidden border border-border/50 max-h-[360px] w-full">
                    <img src={post.image} alt="Post asset" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-0">
                {/* 40% preview — exact rich HTML formatting matching full text */}
                <div className="relative space-y-4">
                  <div
                    dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                    className="publish-editor whitespace-pre-wrap break-words opacity-90"
                  />
                  {/* Thin fade — covers bottom lines */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                </div>

                {/* Stakewall card — sits directly below preview */}
                <div className="flex flex-col items-center text-center gap-4 pt-6 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-300 w-full">
                  
                  {/* "Read More" chip + Question mark tooltip */}
                  <div className="flex items-center gap-2 self-center relative">
                    <div
                      className="rounded-lg border border-[#8C5CFF]/30 bg-[#8C5CFF]/5 inline-flex items-center justify-center"
                      style={{ paddingTop: '0.5px', paddingBottom: '0.5px', paddingLeft: '6px', paddingRight: '6px' }}
                    >
                      <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#AC8EF3]">
                        Read More
                      </span>
                    </div>

                    {/* Question mark Tooltip Button */}
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setShowTooltip(!showTooltip)}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        className="size-4 rounded-full bg-[#8C5CFF]/15 hover:bg-[#8C5CFF]/30 border border-[#8C5CFF]/40 flex items-center justify-center text-[#AC8EF3] transition-all cursor-pointer"
                        title="View Read-Stake info"
                        aria-label="Confidential Read-Stake Info"
                      >
                        <HelpCircle size={11} />
                      </button>

                      {/* Tooltip Popup */}
                      {showTooltip && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-card border border-border/80 rounded-xl shadow-2xl z-30 text-left animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                          <h5 className="font-sans text-[11px] font-bold text-foreground mb-1">
                            Confidential Read-Stake Lock
                          </h5>
                          <p className="font-sans text-[10px] leading-relaxed text-muted">
                            This premium content requires a cryptographic read-stake on the Canton sub-ledger. Stake 5 Canton Coins (CC) to immediately unlock and decrypt this creator's work.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stake Button */}
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
              showStar={true}
              starred={isUnlocked}
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
            {post.date || ''}
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
              /* Comment card — styled like a post content card */
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

      {/* ── Sticky Floating Reply Input Bar — pinned/floating at bottom of column on desktop, floating above bottom navbar on mobile ── */}
      <div className="fixed md:absolute bottom-[60px] md:bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border px-4 py-2.5 md:py-3.5 flex items-center gap-3 shrink-0 z-30 shadow-lg">
        <div className="size-8 md:size-9 rounded-full bg-[#8C5CFF]/15 border border-[#8C5CFF]/30 flex items-center justify-center font-bold text-xs md:text-sm text-[#AC8EF3] shrink-0 overflow-hidden">
          {currentUser?.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt={currentUser.displayName} className="w-full h-full object-cover" />
          ) : (
            (currentUser?.displayName || currentUser?.username || 'U').charAt(0).toUpperCase()
          )}
        </div>
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="flex-1 text-left bg-card border border-border rounded-full px-4 py-2 md:py-3 font-sans text-[12px] md:text-[13px] text-muted hover:border-[#8C5CFF]/40 hover:bg-card/80 transition-all duration-200 cursor-text shadow-sm"
        >
          Post your reply…
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



// ─── Share Options Dialog Overlay ───────────────────────────────────────────────

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
            <span className="font-sans font-bold text-[13px] text-[#8C5CFF] w-4 text-center">𝕏 </span>
            <span className="font-sans text-[12px] font-semibold text-foreground">Share on X (Twitter)</span>
          </button>

          <button
            type="button"
            onClick={() => handleShareOption('Telegram')}
            className="flex w-full items-center gap-3 p-3 rounded-xl border border-border bg-background hover:bg-foreground/5 transition duration-200"
          >
            <span className="font-sans font-bold text-[13px] text-[#8C5CFF] w-4 text-center">✈</span>
            <span className="font-sans text-[12px] font-semibold text-foreground">Share on Telegram</span>
          </button>

          <button
            type="button"
            onClick={() => handleShareOption('WhatsApp')}
            className="flex w-full items-center gap-3 p-3 rounded-xl border border-border bg-background hover:bg-foreground/5 transition duration-200"
          >
            <span className="font-sans font-bold text-[13px] text-[#8C5CFF] w-4 text-center">💬</span>
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'premium' | 'bookmarks' | 'favorites'>('premium');
  const [apiPosts, setApiPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [mobileView, setMobileView] = useState<'feed' | 'detail'>('feed');
  const [isReaderExpanded, setIsReaderExpanded] = useState(false);
  const [publishComposerOpen, setPublishComposerOpen] = useState(false);
  const [publishedPosts, setPublishedPosts] = useState<Post[]>([]);

  // Fetch real content from API
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Fetch current user profile
    if (token) {
      fetch('/api/users/me', { headers })
        .then(r => r.json())
        .then(data => {
          if (data.user) setCurrentUser(data.user);
        })
        .catch(err => console.error('Failed to load user profile:', err));
    }

    // Fetch content feed
    fetch('/api/content', { headers })
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.content)) {
          const mapped = data.content.map(mapContentToPost);
          setApiPosts(mapped);
          // Auto-select the first post
          if (mapped.length > 0) setSelectedPost(mapped[0]);
        }
      })
      .catch(err => console.error('Failed to load content:', err))
      .finally(() => setLoading(false));
  }, []);

  // Sync activeTab with activePage prop changes
  useEffect(() => {
    if (activePage === 'Bookmarks') {
      setActiveTab('bookmarks');
      const firstBookmarked = apiPosts.find(p => bookmarkedPostIds.includes(p.id as any));
      if (firstBookmarked) setSelectedPost(firstBookmarked);
    } else if (activePage === 'Favorites') {
      setActiveTab('favorites');
      const firstFav = apiPosts.find(p => favoriteCreatorHandles.includes(p.handle));
      if (firstFav) setSelectedPost(firstFav);
    } else {
      if (activeTab === 'bookmarks' || activeTab === 'favorites') {
        setActiveTab('premium');
        if (apiPosts.length > 0) setSelectedPost(apiPosts[0]);
      }
    }
  }, [activePage, apiPosts]);

  // Tab change wrapper to navigate back to dashboard when clicks premium tab
  const selectTab = (tab: 'premium') => {
    setActiveTab(tab);
    if (activePage === 'Bookmarks' || activePage === 'Favorites') {
      onNavigate?.('Dashboard');
    }
    const firstOfCat = [...publishedPosts, ...apiPosts].find(p => p.category === tab);
    if (firstOfCat) setSelectedPost(firstOfCat);
  };

  // Interactive States
  const [unlockedPremiumIds, setUnlockedPremiumIds] = useState<(number | string)[]>([]);
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<(number | string)[]>([]);
  const [favoriteCreatorHandles, setFavoriteCreatorHandles] = useState<string[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<(number | string)[]>([]);
  const [mutedUserHandles, setMutedUserHandles] = useState<string[]>([]);
  const [blockedUserHandles, setBlockedUserHandles] = useState<string[]>([]);
  const [dislikedPostIds, setDislikedPostIds] = useState<(number | string)[]>([]);

  // Current logged-in user
  const [currentUser, setCurrentUser] = useState<{ id: string; displayName: string; username: string; avatarUrl?: string } | null>(null);

  // Dialog Overlays
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  const [commentsList, setCommentsList] = useState<CommentItem[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);

  const { toast } = useToast();

  // Fetch replies whenever the selected post changes
  useEffect(() => {
    if (!selectedPost?.id) { setCommentsList([]); return; }
    const postId = selectedPost.id;
    // Skip fetching replies for locally-published posts (numeric timestamp IDs)
    if (typeof postId === 'number') { setCommentsList([]); return; }
    setRepliesLoading(true);
    fetch(`/api/content/${postId}/replies`)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.replies)) {
          const mapped: CommentItem[] = data.replies.map((r: any) => {
            const authorName = r.author?.displayName || r.author?.username || 'User';
            const authorHandle = r.author?.username ? `@${r.author.username.replace(/^@/, '')}` : '@user';
            const d = new Date(r.createdAt);
            const now = Date.now();
            const diffMs = now - d.getTime();
            const diffMin = Math.floor(diffMs / 60000);
            const timeStr = diffMin < 1 ? 'Just now'
              : diffMin < 60 ? `${diffMin}m ago`
              : diffMin < 1440 ? `${Math.floor(diffMin / 60)}h ago`
              : `${Math.floor(diffMin / 1440)}d ago`;
            return {
              id: r.id,
              postId: r.contentId,
              name: authorName,
              handle: authorHandle,
              text: r.body,
              time: timeStr,
              avatarUrl: r.author?.avatarUrl || undefined,
            };
          });
          setCommentsList(mapped);
        }
      })
      .catch(err => console.error('Failed to load replies:', err))
      .finally(() => setRepliesLoading(false));
  }, [selectedPost?.id]);

  if (loading) return <DashboardPageSkeleton />;
  if (!selectedPost && (apiPosts.length > 0 || publishedPosts.length > 0)) {
    setSelectedPost([...publishedPosts, ...apiPosts][0]);
  }

  const handlePublish = async (html: string, visibility: string, image?: string, topic?: string, publication?: string) => {
    // Strip HTML tags for feed snippet fallback text
    const textSnippet = html.replace(/<[^>]*>/g, '') || (image ? 'Shared an image' : '');

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('canafri_access_token') || localStorage.getItem('canafri_admin_access_token')
      : null;
    const authorName = currentUser?.displayName || 'You';
    const authorHandle = currentUser?.username ? `@${currentUser.username.replace(/^@/, '')}` : '@me';
    const authorAvatar = currentUser?.avatarUrl || '';

    let titleText = textSnippet.slice(0, 80).trim();
    if (titleText.length < 3) titleText = (titleText + ' Article Submission').slice(0, 80);
    let bodyText = html || textSnippet || 'Content article body';
    if (bodyText.length < 5) bodyText = bodyText + ' ...';

    let publishedId: string | number = Date.now();

    if (token) {
      try {
        const res = await fetch('/api/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: titleText,
            bodyIpfsHash: bodyText,
            type: visibility === 'premium' ? 'PREMIUM' : 'FREE',
            priceCC: 5,
            topic: topic || undefined,
            publication: publication || undefined,
          }),
        });
        const data = await res.json();
        if (data.success && data.content) {
          publishedId = data.content.id;
          toast('Post submitted! Pending admin review.', 'success');
          // Signal profile & admin review queue to refetch
          window.dispatchEvent(new CustomEvent('canafri:content-published', { detail: { id: publishedId } }));
        } else if (data.message) {
          toast(data.message, 'error');
        }
      } catch (err) {
        console.error('Failed to post content to server:', err);
      }
    } else {
      toast('Post published locally.', 'success');
    }

    const newPost: Post = {
      id: publishedId,
      name: authorName,
      handle: authorHandle,
      date: 'Just now',
      avatarSrc: authorAvatar,
      category: visibility === 'premium' ? 'premium' : 'free',
      stakeReward: '5 CC Read-Stake Required',
      likesCount: 0,
      commentsCount: 0,
      text: textSnippet,
      fullText: html,
      image,
      topic,
      publication,
      contentStatus: 'PENDING',
    };

    setPublishedPosts(prev => [newPost, ...prev]);
    setSelectedPost(newPost);
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setMobileView('detail');
  };

  const handleBack = () => {
    setMobileView('feed');
    setIsReaderExpanded(false);
  };

  const handleAddComment = async (text: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;
    const postId = displayPost?.id;

    // Optimistic local add with real user identity
    const optimistic: CommentItem = {
      id: `c_${Date.now()}`,
      postId: postId ?? '',
      name: currentUser?.displayName || 'You',
      handle: currentUser?.username ? `@${currentUser.username.replace(/^@/, '')}` : '@me',
      text,
      time: 'Just now',
    };
    setCommentsList([optimistic, ...commentsList]);

    // POST to API for persisted replies (only for real API content, not local drafts)
    if (token && postId && typeof postId === 'string') {
      try {
        const res = await fetch(`/api/content/${postId}/replies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ body: text }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast(data.message || 'Failed to post reply', 'error');
          // Remove optimistic entry on failure
          setCommentsList(prev => prev.filter(c => c.id !== optimistic.id));
          return;
        }
        // Replace optimistic with real ID from server
        if (data.reply) {
          setCommentsList(prev =>
            prev.map(c => c.id === optimistic.id ? { ...optimistic, id: data.reply.id } : c)
          );
        }
      } catch (err) {
        console.error('Failed to post reply:', err);
      }
    }

    toast('Reply posted', 'success');
  };

  // Filtering lists of posts — merge locally published + API fetched posts
  const allPosts = [...publishedPosts, ...apiPosts];
  const filteredPosts = allPosts.filter((post) => {
    // Filter out posts from blocked or muted creators
    if (blockedUserHandles.includes(post.handle)) return false;
    if (mutedUserHandles.includes(post.handle)) return false;
    // Filter out explicitly disliked posts
    if (dislikedPostIds.includes(post.id as any)) return false;

    if (activeTab === 'bookmarks') {
      return bookmarkedPostIds.includes(post.id as any);
    }
    if (activeTab === 'favorites') {
      return favoriteCreatorHandles.includes(post.handle);
    }
    // 'premium' tab: show all posts (free and premium mixed)
    return true;
  });

  // Derive a safe selected post (first if none selected)
  const displayPost = selectedPost ?? (filteredPosts[0] ?? null);

  return (
    <div className="min-h-full w-full bg-background flex flex-col">
      {/* 100% Viewport Split Pane */}
      <div className="flex flex-1 min-h-[calc(100vh-70px)] w-full max-w-[1400px] mx-auto">
        
        {/* Left Panel: Feed List */}
        <div
          className={[
            // Mobile: show/hide by mobileView state (no animation needed)
            mobileView === 'detail' ? 'hidden md:flex' : 'flex',
            // Desktop: animated width + opacity collapse when reader is expanded
            'flex-col md:flex-none h-auto overflow-hidden bg-background relative',
            'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[max-width,opacity,transform]',
            isReaderExpanded
              ? 'md:max-w-0 md:opacity-0 md:pointer-events-none md:-translate-x-8 md:border-r-0'
              : 'md:max-w-[480px] md:opacity-100 md:translate-x-0 md:border-r md:border-border/40',
            // Explicit base widths (only matter when NOT collapsed)
            'flex-1 md:w-[420px] lg:w-[480px]',
          ].join(' ')}
        >
          {/* Inner Content Wrapper — fixed width prevents text squishing/wrapping during animation */}
          <div
            className={[
              'flex flex-col w-full md:w-[420px] lg:w-[480px] h-full shrink-0',
              'transition-opacity duration-300 ease-in-out',
              isReaderExpanded ? 'opacity-0' : 'opacity-100',
            ].join(' ')}
          >
            {/* Tab Navigation (Only Free & Premium, dynamic title when Bookmarks or Favorites is active) */}
            <div className="border-b border-border bg-background shrink-0">
              {activeTab === 'bookmarks' ? (
                <div className="flex h-14 items-center justify-between px-5">
                  <div className="flex flex-col gap-0.5">
                    <h2 className="font-sans text-[13px] font-bold text-foreground">Saved</h2>
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
                <div className="flex h-14 items-center justify-between px-5">
                  <div className="flex flex-col gap-0.5">
                    <h2 className="flex items-center gap-1.5 font-sans text-[13px] font-bold text-foreground">
                      <Sparkle size={14} className="text-[#8C5CFF]" fill="currentColor" />
                      Premium Content
                    </h2>
                    <span className="font-sans text-[10px] text-muted">Exclusive research and insights unlocked via CC read-stakes</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Twitter-style Quick Compose Bar ── */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b border-border cursor-text hover:bg-card/30 transition-colors shrink-0"
              onClick={() => setPublishComposerOpen(true)}
            >
              <div className="size-9 rounded-full bg-[#8C5CFF]/15 border border-[#8C5CFF]/30 flex items-center justify-center font-bold text-xs text-[#AC8EF3] shrink-0 overflow-hidden">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.displayName} className="w-full h-full object-cover" />
                ) : (
                  (currentUser?.displayName || currentUser?.username || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 text-left">
                <span className="font-sans text-[13px] text-muted/60 select-none">
                  Share your expertise…
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPublishComposerOpen(true); }}
                className="shrink-0 size-8 rounded-full bg-[#8C5CFF] hover:bg-[#AC8EF3] flex items-center justify-center text-white transition-all active:scale-90 cursor-pointer shadow-lg shadow-[#8C5CFF]/20"
                title="New post"
              >
                <PenSquare size={14} />
              </button>
            </div>

            {/* Posts Feed Scroll Area */}
            <div className="flex flex-col overflow-y-auto no-scrollbar flex-1 pb-20 md:pb-4">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isSelected={displayPost?.id === post.id}
                    onClick={() => handlePostClick(post)}
                    liked={likedPostIds.includes(post.id as any)}
                    bookmarked={bookmarkedPostIds.includes(post.id as any)}
                    isFavoriteCreator={favoriteCreatorHandles.includes(post.handle)}
                    onLikeToggle={() => {
                      if (likedPostIds.includes(post.id as any)) {
                        setLikedPostIds(likedPostIds.filter((id) => id !== post.id));
                      } else {
                        setLikedPostIds([...likedPostIds, post.id]);
                      }
                    }}
                    onBookmarkToggle={() => {
                      if (bookmarkedPostIds.includes(post.id as any)) {
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

            {/* ── Floating Action Button (FAB) — Figma: purple circle with compose icon ── */}
            <button
              type="button"
              onClick={() => setPublishComposerOpen(true)}
              className="fixed bottom-20 right-5 z-30 size-[52px] rounded-full bg-[#8C5CFF] hover:bg-[#AC8EF3] flex items-center justify-center text-white shadow-2xl shadow-[#8C5CFF]/40 transition-all duration-200 active:scale-90 hover:scale-105 md:bottom-20 md:right-8 md:z-50 cursor-pointer"
              title="Publish new content"
              aria-label="Publish new post"
            >
              <PenSquare size={22} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Right Panel: Detail Article Reader */}
        <div
          className={[
            'flex flex-col min-w-0 overflow-hidden bg-background relative',
            'transition-[flex,opacity] duration-500 ease-in-out will-change-[flex,opacity]',
            // On mobile: mirror mobileView toggle
            mobileView === 'feed' ? 'hidden md:flex' : 'flex',
            // On desktop: always flex; grows naturally as left panel collapses
            'flex-1',
          ].join(' ')}
        >
          {displayPost ? (
            <PostDetail
              post={displayPost}
              onBack={handleBack}
              isExpanded={isReaderExpanded}
              onToggleExpand={() => setIsReaderExpanded(!isReaderExpanded)}
              isUnlocked={unlockedPremiumIds.includes(displayPost.id as any)}
              onUnlock={() => setUnlockedPremiumIds([...unlockedPremiumIds, displayPost.id])}
              liked={likedPostIds.includes(displayPost.id as any)}
              bookmarked={bookmarkedPostIds.includes(displayPost.id as any)}
              onLikeToggle={() => {
                if (likedPostIds.includes(displayPost.id as any)) {
                  setLikedPostIds(likedPostIds.filter((id) => id !== displayPost.id));
                } else {
                  setLikedPostIds([...likedPostIds, displayPost.id]);
                }
              }}
              onBookmarkToggle={() => {
                if (bookmarkedPostIds.includes(displayPost.id as any)) {
                  setBookmarkedPostIds(bookmarkedPostIds.filter((id) => id !== displayPost.id));
                } else {
                  setBookmarkedPostIds([...bookmarkedPostIds, displayPost.id]);
                }
              }}
              onShareOpen={() => setSharingPost(displayPost)}
              comments={commentsList}
              onAddComment={handleAddComment}
              currentUser={currentUser}
            />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-muted text-[13px] p-6">
              {loading ? 'Loading content…' : 'No content yet. Be the first to publish!'}
            </div>
          )}
        </div>

      </div>

      {/* Single Full-Width Footer */}
      <div className="hidden md:block w-full mt-[24px] shrink-0 border-t border-[#D8D8D8] dark:border-[#121212]">
        <Footer />
      </div>

      {/* Share dialog modal overlay */}
      {sharingPost && (
        <ShareModal post={sharingPost} onClose={() => setSharingPost(null)} />
      )}

      {/* Publish Composer overlay */}
      {publishComposerOpen && (
        <PublishComposer
          onClose={() => setPublishComposerOpen(false)}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
}
