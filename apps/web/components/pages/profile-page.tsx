'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ChevronLeft,
  Edit3,
  Share2,
  MoreHorizontal,
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Eye,
  Bookmark,
  Shield,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_AVATAR = '/images/default-avatar.png';
const TABS = ['Published', 'Job done', 'Job post', 'Reads'];

// ─── Post Component ───────────────────────────────────────────────────────────

function Post({ date }: { date: string }) {
  return (
    <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border border-border">
      <div className="flex items-start gap-[10px]">
        <div className="relative size-[35px] shrink-0 overflow-hidden rounded-full">
          <Image
            src={DEFAULT_AVATAR}
            alt="John Trek Avatar"
            fill
            sizes="35px"
            className="object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col gap-[15px] min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[9px]">
              <span className="font-sans text-[13px] font-medium text-foreground">John Trek</span>
              <span className="font-sans text-[11px] text-muted">@Johntrek</span>
            </div>
            <span className="shrink-0 font-sans text-[11px] text-muted">{date}</span>
          </div>
          <p className="font-sans text-[14px] leading-[22px] text-foreground/90">
            is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
            industry&apos;s standard dummy text ever since 1966, when designers at Letraset and James
            Mosley, the librarian at St Bride Printing Library, took a 1914.
          </p>
        </div>
        <button type="button" className="text-muted hover:text-foreground shrink-0 p-1">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between border-t border-[#1a1a1a] pt-3">
        <div className="flex items-center gap-6">
          <button type="button" className="flex items-center gap-1.5 text-muted hover:text-[#8C5CFF] transition-colors">
            <ThumbsUp size={14} />
            <span className="text-[11px]">12</span>
          </button>
          <button type="button" className="flex items-center gap-1.5 text-muted hover:text-foreground transition-colors">
            <MessageSquare size={14} />
            <span className="text-[11px]">4</span>
          </button>
          <button type="button" className="flex items-center gap-1.5 text-muted hover:text-foreground transition-colors">
            <Repeat2 size={14} />
            <span className="text-[11px]">2</span>
          </button>
        </div>
        <div className="flex items-center gap-6">
          <button type="button" className="text-muted hover:text-foreground transition-colors">
            <Eye size={14} />
          </button>
          <button type="button" className="text-muted hover:text-foreground transition-colors">
            <Bookmark size={14} />
          </button>
          <button type="button" className="text-muted hover:text-foreground transition-colors">
            <Share2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Page Component ───────────────────────────────────────────────────

interface ProfilePageProps {
  onBack?: () => void;
}

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState('Published');

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      {/* Top Bar */}
      <div className="flex shrink-0 items-center justify-between px-4 py-4 border-b border-border">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex size-8 items-center justify-center rounded-full bg-card hover:bg-foreground/5 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={20} className="text-foreground" />
          </button>
        ) : (
          <div className="size-8" />
        )}
        <div className="flex items-center gap-[15px]">
          {/* Edit Button */}
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full bg-card hover:bg-foreground/5 text-foreground transition-colors"
            aria-label="Edit Profile"
          >
            <Edit3 size={16} />
          </button>
          {/* Share Button */}
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full bg-card hover:bg-foreground/5 text-foreground transition-colors"
            aria-label="Share Profile"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col items-center pt-6 pb-4 shrink-0">
        <div className="relative size-[160px] overflow-hidden rounded-full border-2 border-border shadow-lg mb-4">
          <Image
            src={DEFAULT_AVATAR}
            alt="John Trek Avatar"
            fill
            sizes="160px"
            className="object-cover"
            priority
          />
        </div>
        <p className="font-sans text-[28px] font-bold leading-[36px] tracking-[-0.1px] text-foreground">
          John Trek
        </p>
        <p className="font-sans text-[13px] text-muted">@johntrek</p>
        <p className="font-sans text-[11px] text-muted mt-1">member since April 2026</p>
      </div>

      {/* Stats Summary Grid */}
      <div className="mt-6 shrink-0 bg-card rounded-t-2xl border-t border-border">
        <div className="grid grid-cols-4 items-center py-4 px-2 border-b border-border">
          {[
            ['24', 'Published'],
            ['24', 'Readers'],
            ['24', 'Jobs done'],
            ['98%', 'Trust score'],
          ].map(([val, label]) => (
            <div key={label} className="flex flex-col items-center">
              <p className="font-sans text-[18px] font-semibold leading-[24px] tracking-tight text-foreground">
                {val}
              </p>
              <p className="font-sans text-[10px] text-muted leading-[14px] mt-0.5 text-center truncate w-full px-1">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-4 px-4 py-3 bg-white/[0.01]">
          <p className="font-sans text-[11px] text-muted whitespace-nowrap">Tier Status</p>
          <div className="h-[17px] w-px bg-border shrink-0" />
          <div className="flex items-center gap-4 flex-1 justify-around">
            {[
              { level: 'Bronze', color: 'text-muted' },
              { level: 'Silver', color: 'text-primary' },
              { level: 'Gold', color: 'text-yellow-500' },
            ].map(({ level, color }) => (
              <div key={level} className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1">
                  <Shield size={14} className={color} />
                  <span className="font-sans text-[11px] text-foreground/90 font-medium">{level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card shrink-0 border-b border-border">
        <div className="flex items-center justify-between px-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-[10px] font-sans text-[12px] font-medium leading-[16px] text-center transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted hover:text-foreground/80'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Feed List */}
      <div className="flex flex-col gap-4 p-4 flex-1">
        <Post date="May 10" />
        <Post date="May 10" />
      </div>
    </div>
  );
}
