'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { FileText, Share2, Mail, Star, Archive, Ban, Trash2, Loader2, Paperclip, X, Check, CheckCheck, Lock } from "lucide-react";
import { MessagesPageSkeleton } from '@/components/ui/skeleton';
import { useToast } from "@/components/ui/toast";
import { getSocket } from "@/lib/socket";

export interface TargetUser {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  presence?: 'online' | 'offline';
  lastSeen?: string | null;
}

export interface ConversationItem {
  id: string;
  name: string;
  avatarUrl?: string;
  preview: string;
  sub?: string;
  time: string;
  unread: boolean;
  unreadCount?: number;
  presence?: 'online' | 'offline';
  lastSeen?: string | null;
  rawUser?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export interface AttachmentInfo {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface ChatMessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  attachments?: AttachmentInfo[];
  fileUrl?: string;
  fileType?: string;
  createdAt: string;
  read: boolean;
  self: boolean;
}



const UNSAFE_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.vbs', '.msi',
  '.dll', '.scr', '.jar', '.py', '.app', '.htc', '.cpl', '.pif'
];

function formatRelativeTime(dateStr?: string | null) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted shrink-0">
      <path
        d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 14L11.1 11.1"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowBackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-foreground shrink-0">
      <path
        d="M6.921 12.5L12.714 18.292L12 19L5 12L12 5L12.714 5.708L6.92 11.5H19V12.5H6.921Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-muted shrink-0">
      <path
        d="M9 2H5C4.46957 2 3.96086 2.21071 3.58579 2.58579C3.21071 2.96086 3 3.46957 3 4V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V4C21 3.46957 20.7893 2.96086 20.4142 2.58579C20.0391 2.21071 19.5304 2 19 2H15M9 2C9 2.53043 9.21071 3.03914 9.58579 3.41421C9.96086 3.78929 10.4696 4 11 4H13C13.5304 4 14.0391 3.78929 14.4142 3.41421C14.7893 3.03914 15 2.53043 15 2M9 2C9 1.46957 9.21071 0.960859 9.58579 0.585786C9.96086 0.210714 10.4696 0 11 0H13C13.5304 0 14.0391 0.210714 14.4142 0.585786C14.7893 0.960859 15 1.46957 15 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-muted shrink-0">
      <path
        d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
        fill="currentColor"
      />
      <path
        d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z"
        fill="currentColor"
      />
      <path
        d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white shrink-0">
      <path
        d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface MessagesPanelProps {
  conversations: ConversationItem[];
  selected: string | null;
  onSelect: (id: string) => void;
  onBack?: () => void;
}

function MessagesPanel({
  conversations,
  selected,
  onSelect,
}: MessagesPanelProps) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.preview.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#FAFAFD] dark:bg-[#0B0B0B]">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-[7px] mb-4">
          <h1 className="text-[#010101] dark:text-white text-[18px] font-semibold leading-[24px]">
            Messages
          </h1>
        </div>
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-[10px] rounded-full bg-[#F5F8FB] dark:bg-[#161616] border border-[#D8D8D8] dark:border-[#1e1e1e]">
          <SearchIcon />
          <input
            type="text"
            placeholder="search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-[#010101] dark:text-[rgba(255,255,255,0.8)] text-[13px] leading-[18px] placeholder-muted outline-none"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-muted text-[13px]">
            No conversations found
          </div>
        ) : (
          filtered.map((conv) => {
            const initials = conv.name
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            const isOnline = conv.presence === 'online';

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full flex items-center gap-3 px-5 py-4 border-b border-[#D8D8D8] dark:border-[#121212] transition-colors text-left ${
                  selected === conv.id
                    ? "bg-[#F0EDFC] dark:bg-[#161626]"
                    : "hover:bg-black/[0.02] dark:hover:bg-[#111] bg-transparent"
                }`}
              >
                <div className="relative flex-shrink-0">
                  {conv.avatarUrl ? (
                    <img
                      src={conv.avatarUrl}
                      alt={conv.name}
                      className="w-[46px] h-[46px] rounded-full object-cover border border-black/10 dark:border-white/10"
                    />
                  ) : (
                    <div className="w-[46px] h-[46px] rounded-full bg-[#291D46] flex items-center justify-center flex-shrink-0 text-white text-[15px] font-semibold">
                      {initials}
                    </div>
                  )}
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-[11px] h-[11px] rounded-full bg-emerald-500 border-2 border-[#FAFAFD] dark:border-[#0B0B0B]" />
                  )}
                  {conv.unread && !isOnline && (
                    <div className="absolute bottom-0 right-0 w-[10px] h-[10px] rounded-full bg-[#8C5CFF] border-2 border-[#FAFAFD] dark:border-[#0B0B0B]" />
                  )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-[2px]">
                    <span className="text-[#010101] dark:text-white text-[13px] font-medium leading-[18px] truncate">
                      {conv.name}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <span className="text-muted text-[10px] leading-[13px]">
                        {conv.time}
                      </span>
                      {conv.unread && (
                        <div className="w-[6px] h-[6px] rounded-full bg-[#8C5CFF]" />
                      )}
                    </div>
                  </div>
                  <span className="text-muted text-[11px] leading-[15px] truncate">
                    {conv.preview}
                  </span>
                  {conv.sub && (
                    <span className="text-muted/70 text-[10px] leading-[14px] truncate">
                      {conv.sub}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

interface ChatPanelProps {
  selectedUserId: string;
  chatUser: TargetUser | null;
  messages: ChatMessageItem[];
  hasMore: boolean;
  loadingOlder: boolean;
  isTyping: boolean;
  onLoadOlder: () => void;
  onSendMessage: (text: string, attachments: AttachmentInfo[]) => Promise<void>;
  onBack: () => void;
  onDeleteConversation: (userId: string) => void;
}

function ChatPanel({
  selectedUserId,
  chatUser,
  messages,
  hasMore,
  loadingOlder,
  isTyping,
  onLoadOlder,
  onSendMessage,
  onBack,
  onDeleteConversation,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<AttachmentInfo[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Dynamic dropdown interactive state
  const [isStarred, setIsStarred] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isUnread, setIsUnread] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [fileCount, setFileCount] = useState(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isTyping]);

  // Handle Typing event debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    const socket = getSocket();
    if (!socket || !selectedUserId) return;

    socket.emit("typing_start", { receiverId: selectedUserId });

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("typing_stop", { receiverId: selectedUserId });
    }, 2500);
  };

  // Attachment File Pick & Validation
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (attachments.length + files.length > 10) {
      toast("Maximum 10 attachments allowed per message", "error");
      return;
    }

    const newAtts: AttachmentInfo[] = [];
    let currentTotal = attachments.reduce((acc, curr) => acc + curr.size, 0);

    for (const f of files) {
      const ext = `.${f.name.split('.').pop()?.toLowerCase()}`;
      if (UNSAFE_EXTENSIONS.includes(ext)) {
        toast(`File "${f.name}" is an unsafe executable file type`, "error");
        continue;
      }
      if (f.size > 25 * 1024 * 1024) {
        toast(`File "${f.name}" exceeds maximum size of 25 MB`, "error");
        continue;
      }
      if (currentTotal + f.size > 100 * 1024 * 1024) {
        toast("Total attachment payload size cannot exceed 100 MB", "error");
        break;
      }
      currentTotal += f.size;

      newAtts.push({
        url: URL.createObjectURL(f),
        name: f.name,
        size: f.size,
        mimeType: f.type || 'application/octet-stream',
      });
    }

    setAttachments(prev => [...prev, ...newAtts]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isSending || isBlocked) return;
    const textToSend = input.trim();
    const attsToSend = [...attachments];
    setInput("");
    setAttachments([]);

    // Stop typing notification
    const socket = getSocket();
    if (socket) socket.emit("typing_stop", { receiverId: selectedUserId });

    setIsSending(true);
    try {
      await onSendMessage(textToSend, attsToSend);
    } catch (err: any) {
      toast(err?.message || "Failed to send message", "error");
    } finally {
      setIsSending(false);
    }
  };

  const menuOptions = [
    {
      label: fileCount === 0 ? "Files" : `Files (${fileCount})`,
      icon: <FileText size={14} className="shrink-0 text-muted" />,
      onClick: () => {
        setFileCount(prev => prev + 1);
        fileInputRef.current?.click();
      }
    },
    {
      label: isShared ? "Link Copied!" : "Share Profile Link",
      icon: <Share2 size={14} className={`shrink-0 ${isShared ? "text-green-500" : "text-muted"}`} />,
      onClick: () => {
        setIsShared(true);
        if (typeof window !== "undefined") {
          navigator.clipboard.writeText(`${window.location.origin}/messages/${selectedUserId}`);
        }
        toast("Conversation link copied to clipboard", "success");
        setTimeout(() => setIsShared(false), 1500);
      }
    },
    {
      label: isUnread ? "Marked Unread" : "Mark as unread",
      icon: <Mail size={14} className={`shrink-0 ${isUnread ? "text-[#8C5CFF]" : "text-muted"}`} />,
      onClick: () => {
        setIsUnread(prev => !prev);
        toast(isUnread ? "Marked read" : "Marked conversation as unread", "info");
      }
    },
    {
      label: isStarred ? "Starred" : "Star",
      icon: (
        <Star
          size={14}
          className={`shrink-0 ${isStarred ? "text-yellow-500 fill-yellow-500" : "text-muted"}`}
        />
      ),
      onClick: () => {
        setIsStarred(prev => !prev);
        toast(isStarred ? "Removed star" : "Starred conversation", "success");
      }
    },
    {
      label: isArchived ? "Archived" : "Archive",
      icon: <Archive size={14} className={`shrink-0 ${isArchived ? "text-green-500 fill-green-500/20" : "text-muted"}`} />,
      onClick: () => {
        setIsArchived(prev => !prev);
        toast(isArchived ? "Unarchived" : "Archived conversation", "info");
      }
    },
    {
      label: isBlocked ? "Unblock user" : "Block user",
      icon: <Ban size={14} className="shrink-0 text-red-500" />,
      className: "text-red-500 hover:bg-red-500/10",
      onClick: () => {
        setIsBlocked(prev => !prev);
        toast(isBlocked ? "User unblocked" : "User blocked from sending messages", isBlocked ? "success" : "error");
      }
    },
    {
      label: "Delete Conversation",
      icon: <Trash2 size={14} className="shrink-0 text-red-500" />,
      className: "text-red-500 hover:bg-red-500/10",
      onClick: () => {
        if (confirm("Are you sure you want to delete this conversation thread?")) {
          onDeleteConversation(selectedUserId);
          toast("Conversation deleted", "info");
        }
      }
    },
  ];

  const displayName = chatUser?.name || "User";
  const userInitials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isUserOnline = chatUser?.presence === 'online';

  return (
    <div className="flex flex-col h-full bg-[#FDFDFD] dark:bg-[#080808]">
      {/* Hidden file input for attachment upload */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#D8D8D8]/50 dark:border-[#121212] bg-[#FDFDFD] dark:bg-[#080808]">
        {/* Mobile Back Button */}
        <button
          onClick={onBack}
          className="opacity-80 hover:opacity-100 transition-opacity lg:hidden"
        >
          <ArrowBackIcon />
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="relative shrink-0">
            {chatUser?.avatarUrl ? (
              <img
                src={chatUser.avatarUrl}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#291D46] flex items-center justify-center text-white text-[11px] font-semibold">
                {userInitials}
              </div>
            )}
            {isUserOnline && (
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#080808]" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[#010101] dark:text-white text-[13px] font-medium leading-[18px] flex items-center gap-1.5 truncate">
              {displayName}
              {isStarred && <Star size={12} className="text-yellow-500 fill-yellow-500 shrink-0" />}
              {isArchived && <Archive size={12} className="text-green-500 shrink-0" />}
            </span>
            <span className="text-muted text-[10px] leading-[13px]">
              {isBlocked
                ? "Blocked"
                : isUserOnline
                ? "Active Now"
                : chatUser?.lastSeen
                ? `Last seen ${formatRelativeTime(chatUser.lastSeen)}`
                : "Offline"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                navigator.clipboard.writeText(`${window.location.origin}/messages/${selectedUserId}`);
              }
              toast("Direct message link copied", "success");
            }}
            className="opacity-80 hover:opacity-100 transition-opacity"
            title="Copy conversation link"
          >
            <ClipboardIcon />
          </button>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="opacity-80 hover:opacity-100 transition-opacity flex items-center"
            >
              <DotsIcon />
            </button>
            
            {dropdownOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[#D8D8D8] dark:border-[#121212] bg-[#FDFDFD] dark:bg-[#080808] shadow-lg py-1.5 z-40 animate-in fade-in duration-100">
                  {menuOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        opt.onClick();
                        setDropdownOpen(false);
                      }}
                      className={`flex items-center gap-2.5 w-full px-4 py-2 text-[12px] transition-colors text-left ${
                        opt.className || "text-[#010101] dark:text-[rgba(255,255,255,0.85)] hover:bg-black/[0.03] dark:hover:bg-white/5"
                      }`}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-5 flex flex-col gap-4">
        {hasMore && (
          <div className="flex justify-center my-1">
            <button
              type="button"
              disabled={loadingOlder}
              onClick={onLoadOlder}
              className="px-3 py-1 rounded-full bg-[#8C5CFF]/10 text-[#8C5CFF] text-[11px] font-medium hover:bg-[#8C5CFF]/20 transition-colors flex items-center gap-1.5"
            >
              {loadingOlder && <Loader2 size={12} className="animate-spin" />}
              Load older messages (30)
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-muted/60 text-[11px] py-1 select-none">
          <Lock size={11} className="text-muted/60" />
          <span>Messages are end-to-end encrypted</span>
        </div>

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-70">
            <p className="text-[13px] text-muted mb-1">No previous messages with {displayName}</p>
            <p className="text-[11px] text-muted/60">Type a message below to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) =>
            msg.self ? (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm bg-[#8C5CFF] text-white shadow-sm">
                  <p className="text-[13px] leading-[20px] break-words">
                    {msg.text}
                  </p>

                  {/* Render attachments if any */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-white/20">
                      {msg.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/20 text-white text-[11px] hover:bg-black/30 transition-colors"
                        >
                          <Paperclip size={13} />
                          <span className="truncate flex-1">{att.name}</span>
                          <span className="text-[9px] opacity-70">{formatFileSize(att.size)}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    <span className="text-[9px] text-white/70">
                      {formatRelativeTime(msg.createdAt)}
                    </span>
                    {msg.read ? (
                      <span title="Read"><CheckCheck size={12} className="text-white shrink-0" /></span>
                    ) : (
                      <span title="Sent"><Check size={12} className="text-white/70 shrink-0" /></span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tl-sm bg-[#F5F8FB] dark:bg-[#161616] border border-[#D8D8D8] dark:border-[#1f1f1f] shadow-sm">
                  <p className="text-[#010101]/95 dark:text-[rgba(255,255,255,0.85)] text-[13px] leading-[20px] break-words">
                    {msg.text}
                  </p>

                  {/* Render attachments if any */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-border/40">
                      {msg.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-card text-foreground text-[11px] border border-border/50 hover:bg-foreground/5 transition-colors"
                        >
                          <Paperclip size={13} className="text-[#8C5CFF]" />
                          <span className="truncate flex-1">{att.name}</span>
                          <span className="text-[9px] text-muted">{formatFileSize(att.size)}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  <span className="block text-[9px] text-muted text-left mt-1">
                    {formatRelativeTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            )
          )
        )}
        {/* Animated 3-dot typing indicator bubble */}
        {isTyping && (
          <div className="flex justify-start items-center animate-in fade-in duration-200">
            <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-[#F5F8FB] dark:bg-[#161616] border border-[#D8D8D8] dark:border-[#1f1f1f] shadow-sm flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
              <span className="size-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
              <span className="size-1.5 rounded-full bg-white animate-bounce" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Pills Preview Bar */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1 border-t border-[#D8D8D8]/40 dark:border-[#121212] bg-[#FDFDFD] dark:bg-[#080808]">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8C5CFF]/10 text-[#8C5CFF] text-[11px] font-medium border border-[#8C5CFF]/20"
            >
              <Paperclip size={12} />
              <span className="max-w-[120px] truncate">{att.name}</span>
              <span className="text-[9px] opacity-70">({formatFileSize(att.size)})</span>
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="hover:text-red-500 transition-colors ml-0.5"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message input */}
      <div className="flex items-center gap-3 px-4 py-4 border-t border-[#D8D8D8]/40 dark:border-[#121212] bg-[#FDFDFD] dark:bg-[#080808]">
        <div className="flex-1 px-4 py-[10px] rounded-full bg-[#F5F8FB] dark:bg-[#111] border border-[#D8D8D8]/50 dark:border-[#1e1e1e]">
          <input
            type="text"
            value={input}
            disabled={isBlocked || isSending}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isBlocked ? "User is blocked" : `Write a message to ${displayName}...`}
            className="w-full bg-transparent text-[#010101] dark:text-[rgba(255,255,255,0.8)] text-[13px] leading-[18px] placeholder-muted outline-none disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/[0.04] dark:hover:bg-[#1e1e1e] transition-colors text-muted"
          title="Attach files (Max 10 files, 25MB each)"
        >
          <Paperclip size={18} />
        </button>
        <button
          onClick={handleSend}
          disabled={(!input.trim() && attachments.length === 0) || isSending || isBlocked}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#8C5CFF] hover:bg-[#7a4de8] disabled:opacity-50 transition-colors cursor-pointer"
        >
          {isSending ? (
            <Loader2 size={16} className="animate-spin text-white" />
          ) : (
            <SendIcon />
          )}
        </button>
      </div>
    </div>
  );
}

interface MessagesPageProps {
  onBack?: () => void;
  onMobileViewChange?: (view: "list" | "chat") => void;
  initialTargetUser?: TargetUser | null;
  /** Fired whenever the total unread message count changes */
  onUnreadCountChange?: (count: number) => void;
}

export default function MessagesPage({ onBack, onMobileViewChange, initialTargetUser, onUnreadCountChange }: MessagesPageProps) {
  const getInitialTargetUser = (): TargetUser | null => {
    if (initialTargetUser) return initialTargetUser;
    if (typeof window !== 'undefined') {
      const activeRec = localStorage.getItem('canafri_active_chat_recipient');
      if (activeRec) {
        try {
          const parsed = JSON.parse(activeRec);
          if (parsed.userId) {
            return {
              id: parsed.userId,
              name: parsed.name || 'User',
              username: parsed.username,
            };
          }
        } catch (e) {}
      }
    }
    return null;
  };

  const activeTargetUser = getInitialTargetUser();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(activeTargetUser?.id || null);
  const [chatUser, setChatUser] = useState<TargetUser | null>(activeTargetUser || null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const { toast } = useToast();

  // Emit live total unread count to parent safely after render phase whenever conversations change
  useEffect(() => {
    if (!onUnreadCountChange) return;
    const total = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    onUnreadCountChange(total);
  }, [conversations, onUnreadCountChange]);

  // Sync active open chat ID globally so parent app knows when user is actively viewing a thread
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__canafri_active_chat_user_id = selectedConvId;
    }
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).__canafri_active_chat_user_id = null;
      }
    };
  }, [selectedConvId]);

  const setConversationsAndNotify = setConversations;

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("canafri_access_token");
  };

  const getMyUserId = () => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("canafri_user_profile");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.id || null;
      } catch (e) {}
    }
    return null;
  };

  // Fetch all user conversations ONCE on page mount
  const loadConversations = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.conversations)) {
        const mapped: ConversationItem[] = data.conversations.map((item: any) => ({
          id: item.user.id,
          name: item.user.displayName || item.user.username || "User",
          avatarUrl: item.user.avatarUrl || "",
          preview: item.lastMessage?.content || "Started conversation",
          time: formatRelativeTime(item.lastMessage?.createdAt),
          unread: item.unreadCount > 0,
          unreadCount: item.unreadCount || 0,
          presence: item.user.presence || 'offline',
          lastSeen: item.user.lastSeen || null,
          rawUser: item.user,
        }));

        if (activeTargetUser && !mapped.some(c => c.id === activeTargetUser.id)) {
          mapped.unshift({
            id: activeTargetUser.id,
            name: activeTargetUser.name,
            avatarUrl: activeTargetUser.avatarUrl || "",
            preview: "New conversation",
            time: "just now",
            unread: false,
            unreadCount: 0,
            presence: activeTargetUser.presence || "offline",
            lastSeen: activeTargetUser.lastSeen || null,
            rawUser: {
              id: activeTargetUser.id,
              username: activeTargetUser.username || "",
              displayName: activeTargetUser.name,
              avatarUrl: activeTargetUser.avatarUrl,
            },
          });
        }

        setConversationsAndNotify(mapped);
        if (!selectedConvId && mapped.length > 0) {
          setSelectedConvId(mapped[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations from backend:", err);
    }
  }, [initialTargetUser, selectedConvId]);

  // Fetch single chat thread ONCE when conversation opens (limit 30)
  const loadThread = useCallback(async (token: string, targetUserId: string, cursor?: string) => {
    try {
      const url = cursor
        ? `/api/messages/${targetUserId}?limit=30&cursor=${cursor}`
        : `/api/messages/${targetUserId}?limit=30`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        const myId = getMyUserId();
        if (data.targetUser) {
          setChatUser({
            id: data.targetUser.id,
            name: data.targetUser.displayName || data.targetUser.username || "User",
            username: data.targetUser.username,
            avatarUrl: data.targetUser.avatarUrl,
            presence: data.targetUser.presence || 'offline',
            lastSeen: data.targetUser.lastSeen || null,
          });
        }

        if (Array.isArray(data.messages)) {
          const mappedMsgs: ChatMessageItem[] = data.messages.map((m: any) => {
            let parsedAtts: AttachmentInfo[] = [];
            if (m.fileType === 'attachments' && m.fileUrl) {
              try { parsedAtts = JSON.parse(m.fileUrl); } catch (e) {}
            }

            return {
              id: m.id,
              senderId: m.senderId,
              receiverId: m.receiverId,
              text: m.content,
              attachments: parsedAtts,
              fileUrl: m.fileUrl,
              fileType: m.fileType,
              createdAt: m.createdAt,
              read: m.read,
              self: myId ? m.senderId === myId : m.senderId !== targetUserId,
            };
          });

          if (cursor) {
            // Append older messages to top
            setMessages(prev => [...mappedMsgs, ...prev]);
          } else {
            setMessages(mappedMsgs);
          }

          setHasMore(!!data.hasMore);
          setNextCursor(data.nextCursor || null);
        }
      }
    } catch (err) {
      console.error("Failed to load message thread:", err);
      setMessages([]);
    }
  }, []);

  // Initial load on page mount
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    loadConversations(token)
      .then(() => {
        const activeTarget = initialTargetUser?.id || selectedConvId;
        if (activeTarget) {
          return loadThread(token, activeTarget);
        }
      })
      .finally(() => setLoading(false));
  }, [loadConversations, loadThread, initialTargetUser]);

  // SOCKET.IO REAL-TIME SUBSCRIPTIONS (NO POLLING!)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const myId = getMyUserId();

    // 1. Handle incoming real-time messages
    const handleNewMessage = (msg: any) => {
      const isFromActiveThread =
        (selectedConvId && msg.senderId === selectedConvId) ||
        (selectedConvId && msg.receiverId === selectedConvId);

      if (isFromActiveThread) {
        let parsedAtts: AttachmentInfo[] = [];
        if (msg.fileType === 'attachments' && msg.fileUrl) {
          try { parsedAtts = JSON.parse(msg.fileUrl); } catch (e) {}
        }

        const newMsgItem: ChatMessageItem = {
          id: msg.id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          text: msg.content,
          attachments: parsedAtts,
          fileUrl: msg.fileUrl,
          fileType: msg.fileType,
          createdAt: msg.createdAt,
          read: msg.read,
          self: myId ? msg.senderId === myId : msg.senderId !== selectedConvId,
        };

        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;

          if (myId && msg.senderId === myId) {
            const tempIdx = prev.findIndex(m => m.id.startsWith('temp-'));
            if (tempIdx !== -1) {
              const updated = [...prev];
              updated[tempIdx] = {
                ...newMsgItem,
                id: msg.id,
              };
              return updated;
            }
          }

          return [...prev, newMsgItem];
        });

        if (msg.senderId === selectedConvId) {
          socket.emit('mark_read', { conversationId: selectedConvId });
        }
      }

      // Update sidebar conversation preview & ordering
      const otherUserId = msg.senderId === myId ? msg.receiverId : msg.senderId;
      const otherUserObj = msg.senderId === myId ? msg.receiver : msg.sender;

      setConversationsAndNotify(prev => {
        const exists = prev.find(c => c.id === otherUserId);
        const updatedItem: ConversationItem = {
          id: otherUserId,
          name: otherUserObj?.displayName || otherUserObj?.username || exists?.name || 'User',
          avatarUrl: otherUserObj?.avatarUrl || exists?.avatarUrl || '',
          preview: msg.content,
          time: 'just now',
          unread: msg.senderId !== myId && selectedConvId !== otherUserId,
          unreadCount: (exists?.unreadCount || 0) + (msg.senderId !== myId && selectedConvId !== otherUserId ? 1 : 0),
          presence: exists?.presence || 'online',
          lastSeen: exists?.lastSeen || null,
          rawUser: otherUserObj || exists?.rawUser,
        };

        const filtered = prev.filter(c => c.id !== otherUserId);
        return [updatedItem, ...filtered];
      });
    };

    // 2. Handle read receipts
    const handleMessagesRead = (data: { readByUserId: string; senderId: string }) => {
      if (selectedConvId && data.readByUserId === selectedConvId) {
        setMessages(prev =>
          prev.map(m => (m.self ? { ...m, read: true } : m))
        );
      }
    };

    // 3. Handle typing indicator
    const handleUserTyping = (data: { senderId: string; isTyping: boolean }) => {
      if (selectedConvId && data.senderId === selectedConvId) {
        setIsTyping(data.isTyping);
      }
    };

    // 4. Handle presence updates
    const handlePresenceUpdate = (data: { userId: string; status: 'online' | 'offline'; lastSeen: string }) => {
      setConversationsAndNotify(prev =>
        prev.map(c => (c.id === data.userId ? { ...c, presence: data.status, lastSeen: data.lastSeen } : c))
      );
      if (selectedConvId && data.userId === selectedConvId) {
        setChatUser(prev => prev ? { ...prev, presence: data.status, lastSeen: data.lastSeen } : null);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('user_typing', handleUserTyping);
    socket.on('presence_update', handlePresenceUpdate);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('user_typing', handleUserTyping);
      socket.off('presence_update', handlePresenceUpdate);
    };
  }, [selectedConvId]);

  // Handle selecting a conversation
  const handleSelect = (id: string) => {
    setSelectedConvId(id);
    setMobileView("chat");
    setIsTyping(false);
    if (onMobileViewChange) {
      onMobileViewChange("chat");
    }

    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setChatUser({
        id: conv.id,
        name: conv.name,
        username: conv.rawUser?.username,
        avatarUrl: conv.avatarUrl,
        presence: conv.presence || 'offline',
        lastSeen: conv.lastSeen,
      });
      // Mark read in local state
      setConversationsAndNotify(prev =>
        prev.map(c => (c.id === id ? { ...c, unread: false, unreadCount: 0 } : c))
      );
    }

    const token = getAuthToken();
    if (token) {
      loadThread(token, id);

      const socket = getSocket();
      if (socket) {
        socket.emit('mark_read', { conversationId: id });
      }
    } else {
      setMessages([]);
    }
  };

  // Load older messages for pagination (limit 30)
  const handleLoadOlder = async () => {
    if (!selectedConvId || !nextCursor || loadingOlder) return;
    const token = getAuthToken();
    if (!token) return;

    setLoadingOlder(true);
    try {
      await loadThread(token, selectedConvId, nextCursor);
    } finally {
      setLoadingOlder(false);
    }
  };

  // Send message via POST API & emit Socket.IO event
  const handleSendMessage = async (text: string, attachments: AttachmentInfo[]) => {
    if (!selectedConvId) return;

    const token = getAuthToken();
    const myId = getMyUserId();

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const newMsg: ChatMessageItem = {
      id: tempId,
      senderId: myId || "me",
      receiverId: selectedConvId,
      text,
      attachments,
      createdAt: new Date().toISOString(),
      read: false,
      self: true,
    };

    setMessages(prev => [...prev, newMsg]);

    // Update conversation list preview
    setConversationsAndNotify(prev => {
      const exists = prev.find(c => c.id === selectedConvId);
      const updated: ConversationItem = {
        id: selectedConvId,
        name: exists?.name || chatUser?.name || "User",
        avatarUrl: exists?.avatarUrl || chatUser?.avatarUrl || "",
        preview: text || (attachments.length > 0 ? `[${attachments.length} attachment(s)]` : "Sent a message"),
        time: "just now",
        unread: false,
        unreadCount: 0,
        presence: exists?.presence || 'offline',
        lastSeen: exists?.lastSeen || null,
        rawUser: exists?.rawUser,
      };
      return [updated, ...prev.filter(c => c.id !== selectedConvId)];
    });

    if (!token) {
      // Offline preview mode simulation
      return;
    }

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        receiverId: selectedConvId,
        content: text || (attachments.length > 0 ? `Sent ${attachments.length} file attachment(s)` : "File attachment"),
        attachments,
      }),
    });

    const data = await res.json();

    if (res.status === 429) {
      throw new Error(data.message || "Message rate limit exceeded. Please slow down.");
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to send message");
    }

    // Replace optimistic temp message with real DB message
    if (data.message) {
      setMessages(prev => {
        if (prev.some(m => m.id === data.message.id)) {
          return prev.filter(m => m.id !== tempId);
        }
        return prev.map(m => (m.id === tempId ? { ...m, id: data.message.id, createdAt: data.message.createdAt } : m));
      });
    }
  };

  const handleDeleteConversation = (userId: string) => {
    setConversationsAndNotify(prev => prev.filter(c => c.id !== userId));
    setSelectedConvId(null);
    setChatUser(null);
    setMessages([]);
    handleBack();
  };

  const handleBack = () => {
    setMobileView("list");
    if (onMobileViewChange) {
      onMobileViewChange("list");
    }
  };

  if (loading) return <MessagesPageSkeleton />;

  return (
    <div className="h-full w-full flex overflow-hidden">
      <div className="flex flex-1 h-full">
        {/* Left: Conversation list */}
        <div
          className={`flex-col w-full lg:w-[380px] lg:flex-shrink-0 h-full overflow-y-auto no-scrollbar border-r border-[#D8D8D8] dark:border-[#121212] ${
            mobileView === "chat" ? "hidden lg:flex" : "flex"
          }`}
        >
          <MessagesPanel
            conversations={conversations}
            selected={selectedConvId}
            onSelect={handleSelect}
            onBack={onBack}
          />
        </div>

        {/* Right: Chat Panel */}
        <div
          className={`flex-col flex-1 min-w-0 h-full overflow-y-auto no-scrollbar ${
            mobileView === "list" ? "hidden lg:flex" : "flex"
          }`}
        >
          {selectedConvId ? (
            <ChatPanel
              selectedUserId={selectedConvId}
              chatUser={chatUser}
              messages={messages}
              hasMore={hasMore}
              loadingOlder={loadingOlder}
              isTyping={isTyping}
              onLoadOlder={handleLoadOlder}
              onSendMessage={handleSendMessage}
              onBack={handleBack}
              onDeleteConversation={handleDeleteConversation}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-[#FDFDFD] dark:bg-[#080808]">
              <div className="w-12 h-12 rounded-full bg-[#8C5CFF]/10 text-[#8C5CFF] flex items-center justify-center mb-3">
                <Mail size={24} />
              </div>
              <p className="text-[#010101] dark:text-white font-medium text-[15px] mb-1">
                Messages
              </p>
              <p className="text-muted text-[13px] max-w-sm">
                Select a conversation to continue your discussion or start a new one with clients, sellers, and other members.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
