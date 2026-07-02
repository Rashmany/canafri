'use client';

import { useState } from "react";
import { FileText, Share2, Mail, Star, Archive, Ban, Trash2 } from "lucide-react";

const AVATAR_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/d41c8641e39adfbbaa60ab5faeec252a85b98a20?width=70";

interface Conversation {
  id: number;
  name: string;
  preview: string;
  sub: string;
  time: string;
  unread: boolean;
}

interface Message {
  id: number;
  text: string;
  self: boolean;
}

const CONVERSATIONS: Conversation[] = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: "Amara Chibueze",
  preview: "Can you share your portfolio link?",
  sub: "Canton wallet job",
  time: "2m ago",
  unread: i < 2,
}));

const MESSAGES: Message[] = [
  {
    id: 1,
    text: "Can you share your portfolio link? Can you share your portfolio link?Can you share your portfolio link?",
    self: false,
  },
  {
    id: 2,
    text: "Can you share your portfolio link? Can you share your portfolio link?Can you share your portfolio link?",
    self: true,
  },
  {
    id: 3,
    text: "Can you share your portfolio link? Can you share your portfolio link?Can you share your portfolio link?",
    self: false,
  },
  {
    id: 4,
    text: "Can you share your portfolio link? Can you share your portfolio link?Can you share your portfolio link?",
    self: true,
  },
];

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

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-muted shrink-0">
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
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
  selected: number | null;
  onSelect: (id: number) => void;
  onBack?: () => void;
}

function MessagesPanel({
  selected,
  onSelect,
  onBack,
}: MessagesPanelProps) {
  const [search, setSearch] = useState("");

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
            placeholder="search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-[#010101] dark:text-[rgba(255,255,255,0.8)] text-[13px] leading-[18px] placeholder-muted outline-none"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {CONVERSATIONS.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map((conv) => (
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
              <img
                src={AVATAR_URL}
                alt={conv.name}
                className="w-[46px] h-[46px] rounded-full object-cover"
              />
              {conv.unread && (
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
              <span className="text-muted text-[11px] leading-[15px] truncate">
                {conv.sub}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatPanel({ onBack }: { onBack: () => void }) {
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>(MESSAGES);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Dynamic dropdown interactive state
  const [isStarred, setIsStarred] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isUnread, setIsUnread] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [fileCount, setFileCount] = useState(0);

  const handleSend = () => {
    if (!input.trim() || isBlocked) return;
    const newMsg: Message = {
      id: Date.now(),
      text: input,
      self: true,
    };
    setChatMessages(prev => [...prev, newMsg]);
    setInput("");
  };

  const menuOptions = [
    {
      label: fileCount === 0 ? "Files" : `Files (${fileCount})`,
      icon: <FileText size={14} className="shrink-0 text-muted" />,
      onClick: () => {
        setFileCount(prev => prev + 1);
      }
    },
    {
      label: isShared ? "Link Copied!" : "Share",
      icon: <Share2 size={14} className={`shrink-0 ${isShared ? "text-green-500" : "text-muted"}`} />,
      onClick: () => {
        setIsShared(true);
        navigator.clipboard.writeText("https://canafri.com/messages/amara");
        setTimeout(() => setIsShared(false), 1500);
      }
    },
    {
      label: isUnread ? "Marked Unread" : "Mark as unread",
      icon: <Mail size={14} className={`shrink-0 ${isUnread ? "text-[#8C5CFF]" : "text-muted"}`} />,
      onClick: () => {
        setIsUnread(prev => !prev);
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
      }
    },
    {
      label: isArchived ? "Archived" : "Archive",
      icon: <Archive size={14} className={`shrink-0 ${isArchived ? "text-green-500 fill-green-500/20" : "text-muted"}`} />,
      onClick: () => {
        setIsArchived(prev => !prev);
      }
    },
    {
      label: isBlocked ? "Unblock user" : "Block user",
      icon: <Ban size={14} className="shrink-0 text-red-500" />,
      className: "text-red-500 hover:bg-red-500/10",
      onClick: () => {
        setIsBlocked(prev => !prev);
      }
    },
    {
      label: "Delete",
      icon: <Trash2 size={14} className="shrink-0 text-red-500" />,
      className: "text-red-500 hover:bg-red-500/10",
      onClick: () => {
        if (confirm("Are you sure you want to delete this conversation?")) {
          onBack();
        }
      }
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#FDFDFD] dark:bg-[#080808]">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-[#FDFDFD] dark:bg-[#080808]">
        {/* Only show back button on mobile/tablets */}
        <button
          onClick={onBack}
          className="opacity-80 hover:opacity-100 transition-opacity lg:hidden"
        >
          <ArrowBackIcon />
        </button>
        <div className="flex items-center gap-2.5 flex-1">
          <img
            src={AVATAR_URL}
            alt="Amara Chibueze"
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex flex-col">
            <span className="text-[#010101] dark:text-white text-[13px] font-medium leading-[18px] flex items-center gap-1.5">
              Amara Chibueze
              {isStarred && <Star size={12} className="text-yellow-500 fill-yellow-500 shrink-0" />}
              {isArchived && <Archive size={12} className="text-green-500 shrink-0" />}
            </span>
            <span className="text-muted text-[10px] leading-[13px]">
              {isBlocked ? "Blocked" : isUnread ? "Unread message flag set" : "Last seen 3:45pm"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="opacity-80 hover:opacity-100 transition-opacity">
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
                {/* Backdrop to handle click-outside */}
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
        {/* Today label */}
        <div className="flex justify-center">
          <span className="px-4 py-[4px] rounded-full bg-[rgba(140,92,255,0.15)] dark:bg-[rgba(140,92,255,0.35)] text-[#8C5CFF] dark:text-[rgba(255,255,255,0.8)] text-[11px] leading-[16px]">
            Today
          </span>
        </div>

        {chatMessages.map((msg) =>
          msg.self ? (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[70%] px-4 py-3 rounded-2xl rounded-tr-sm bg-[#8C5CFF]/10 dark:bg-[#2A2A3D]">
                <p className="text-[#010101]/95 dark:text-[rgba(255,255,255,0.85)] text-[13px] leading-[20px] break-words">
                  {msg.text}
                </p>
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex justify-start">
              <div className="max-w-[70%] px-4 py-3 rounded-2xl rounded-tl-sm bg-[#F5F8FB] dark:bg-[#161616] border border-[#D8D8D8] dark:border-0">
                <p className="text-[#010101]/95 dark:text-[rgba(255,255,255,0.85)] text-[13px] leading-[20px] break-words">
                  {msg.text}
                </p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Message input */}
      <div className="flex items-center gap-3 px-4 py-4 bg-[#FDFDFD] dark:bg-[#080808]">
        <div className="flex-1 px-4 py-[10px] rounded-full bg-[#F5F8FB] dark:bg-[#111]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Write a message..."
            className="w-full bg-transparent text-[#010101] dark:text-[rgba(255,255,255,0.8)] text-[13px] leading-[18px] placeholder-muted outline-none"
          />
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/[0.04] dark:hover:bg-[#1e1e1e] transition-colors">
          <PlusIcon />
        </button>
        <button
          onClick={handleSend}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#8C5CFF] hover:bg-[#7a4de8] transition-colors"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

interface MessagesPageProps {
  onBack?: () => void;
  onMobileViewChange?: (view: "list" | "chat") => void;
}

export default function MessagesPage({ onBack, onMobileViewChange }: MessagesPageProps) {
  const [selectedConv, setSelectedConv] = useState<number | null>(1);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const handleSelect = (id: number) => {
    setSelectedConv(id);
    setMobileView("chat");
    if (onMobileViewChange) {
      onMobileViewChange("chat");
    }
  };

  const handleBack = () => {
    setMobileView("list");
    if (onMobileViewChange) {
      onMobileViewChange("list");
    }
  };

  return (
    <div className="h-full w-full flex overflow-hidden">
      <div className="flex flex-1 h-full">
        {/* Left: Conversation list */}
        <div
          className={`flex-col w-full lg:w-[380px] lg:flex-shrink-0 h-full border-r border-[#D8D8D8] dark:border-[#121212] ${
            mobileView === "chat" ? "hidden lg:flex" : "flex"
          }`}
        >
          <MessagesPanel selected={selectedConv} onSelect={handleSelect} onBack={onBack} />
        </div>

        {/* Right: Chat */}
        <div
          className={`flex-col flex-1 min-w-0 h-full ${
            mobileView === "list" ? "hidden lg:flex" : "flex"
          }`}
        >
          {selectedConv ? (
            <ChatPanel onBack={handleBack} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <span className="text-muted text-[13px]">
                Select a conversation
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
