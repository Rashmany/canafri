'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronDown, CheckCircle2, ArrowRight } from 'lucide-react';
import Footer from '@/components/layout/footer';

import MyTicketsPage from '@/components/pages/my-tickets-page';

// ─── FAQ Data Model ──────────────────────────────────────────────────────────

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  // Account
  {
    id: 'acc-1',
    category: 'Account',
    question: 'How do I create an account?',
    answer: 'Click the Register button in the top menu. Enter your display name, username, email, and password. Once submitted, verify your email with the 6-digit code sent to your inbox to activate your account.',
  },
  {
    id: 'acc-2',
    category: 'Account',
    question: "Why didn't I receive my verification email?",
    answer: 'Check your spam or junk folder. Make sure your email address was typed correctly during sign-up. If it still has not arrived after a few minutes, click "Resend Code" on the verification screen.',
  },
  {
    id: 'acc-3',
    category: 'Account',
    question: 'How do I reset my password?',
    answer: 'Go to the Login page and click "Forgot Password". Enter your registered email address to receive a password reset link or verification code.',
  },

  // Wallet
  {
    id: 'wal-1',
    category: 'Wallet',
    question: 'How do I connect my wallet?',
    answer: 'Navigate to the Wallet tab in your account dashboard. Click "Connect Wallet" and select your supported provider (e.g. MetaMask, WalletConnect). Approve the connection request in your wallet extension.',
  },
  {
    id: 'wal-2',
    category: 'Wallet',
    question: 'Which wallets are supported?',
    answer: 'We support standard EVM-compatible wallets including MetaMask, Rabby, Coinbase Wallet, and WalletConnect-enabled mobile wallets.',
  },
  {
    id: 'wal-3',
    category: 'Wallet',
    question: 'Why is my wallet connection failing?',
    answer: 'Ensure your wallet extension is unlocked and set to the correct network. Clear your browser cache or try reconnecting after refreshing the page.',
  },

  // Freelancing
  {
    id: 'free-1',
    category: 'Freelancing',
    question: 'How do I become a freelancer?',
    answer: 'From your profile menu, select "Become a Seller". Fill out your seller application, including your skills, portfolio links, and phone verification. Applications are reviewed by our team.',
  },
  {
    id: 'free-2',
    category: 'Freelancing',
    question: 'Why was my seller application rejected?',
    answer: 'Applications may be rejected if portfolio links are invalid, profile information is incomplete, or submitted details violate our service terms. You may reapply with updated information.',
  },
  {
    id: 'free-3',
    category: 'Freelancing',
    question: 'How do I receive payment?',
    answer: 'Earnings from completed jobs are deposited directly into your connected wallet or account balance once the client approves the delivered work.',
  },

  // Content Creation
  {
    id: 'cont-1',
    category: 'Content Creation',
    question: 'How do I publish content?',
    answer: 'As an approved creator, navigate to the Content section and click "Create Post". Draft your update, set visibility (Public or Subscriber-only), and publish.',
  },
  {
    id: 'cont-2',
    category: 'Content Creation',
    question: 'How do subscriptions work?',
    answer: 'Users pay a monthly fee to access exclusive creator content. Subscriptions auto-renew until cancelled by the user.',
  },
  {
    id: 'cont-3',
    category: 'Content Creation',
    question: 'How do creator earnings work?',
    answer: 'Creators receive revenue from direct subscriber fees and content tips, minus standard platform processing fees.',
  },

  // Payments
  {
    id: 'pay-1',
    category: 'Payments',
    question: 'How do withdrawals work?',
    answer: 'Request a withdrawal from your Wallet balance. Withdrawals are processed to your connected wallet address once verified.',
  },
  {
    id: 'pay-2',
    category: 'Payments',
    question: 'Why is my withdrawal pending?',
    answer: 'Withdrawals undergo standard security checks. Larger amounts or new payout addresses may require manual review by our finance team (typically within 24 hours).',
  },
  {
    id: 'pay-3',
    category: 'Payments',
    question: 'What are the platform fees?',
    answer: 'Platform fees cover escrow, network infrastructure, and payment processing. Specific rates are displayed transparently before every transaction.',
  },

  // Security
  {
    id: 'sec-1',
    category: 'Security',
    question: 'How do I report suspicious activity?',
    answer: 'Use the "Report a Bug / Report Abuse" category in the Contact Support form below to flag unauthorized account access or suspicious listings.',
  },
  {
    id: 'sec-2',
    category: 'Security',
    question: 'How do I secure my account?',
    answer: 'Enable Two-Factor Authentication (2FA) in your Account Security settings and use a strong, unique password.',
  },

  // Escrow
  {
    id: 'esc-1',
    category: 'Escrow',
    question: 'How does escrow protect buyers?',
    answer: 'Funds for a job are locked securely in smart contract escrow when an order starts. Payment is released to the seller only after the buyer approves the work.',
  },
  {
    id: 'esc-2',
    category: 'Escrow',
    question: 'What happens during disputes?',
    answer: 'If work is incomplete or does not meet agreed requirements, either party can initiate a resolution. A support moderator reviews delivered assets and communications to issue a fair resolution.',
  },
];

const CATEGORIES = [
  'All',
  'Account',
  'Wallet',
  'Freelancing',
  'Content Creation',
  'Payments',
  'Security',
  'Escrow',
];

const FORM_CATEGORIES = [
  'Account & Login',
  'Wallet Connection',
  'Payments & Withdrawals',
  'Freelancing',
  'Content Creation',
  'Subscription',
  'Escrow',
  'Report a Bug',
  'Report Abuse',
  'Other',
];

interface SupportPageProps {
  onBack?: () => void;
}

export default function SupportPage({ onBack }: SupportPageProps) {
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'my-tickets'>('faq');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>('acc-1');

  // Contact Form State
  const [formCategory, setFormCategory] = useState<string>(FORM_CATEGORIES[0]);
  const [email, setEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<{ ticketNumber: string } | null>(null);

  // Filter FAQs
  const filteredFAQs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!email.trim()) {
      setSubmitError('Please provide your email address.');
      return;
    }
    if (!subject.trim()) {
      setSubmitError('Please enter a subject line.');
      return;
    }
    if (message.trim().length < 10) {
      setSubmitError('Please provide a detailed description (at least 10 characters).');
      return;
    }

    if (attachmentFile) {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(attachmentFile.type)) {
        setSubmitError('Only PNG, JPG, and PDF files are allowed for attachments.');
        return;
      }
      if (attachmentFile.size > 5 * 1024 * 1024) {
        setSubmitError('Attachment file size must be less than 5 MB.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let res: Response;
      const token = typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (attachmentFile) {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('category', formCategory);
        formData.append('subject', subject);
        formData.append('message', message);
        formData.append('file', attachmentFile);

        res = await fetch('/api/support/tickets', {
          method: 'POST',
          headers,
          body: formData,
        });
      } else {
        headers['Content-Type'] = 'application/json';
        res = await fetch('/api/support/tickets', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            email,
            category: formCategory,
            subject,
            message,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit support request.');
      }

      setSubmittedTicket({ ticketNumber: data.ticketNumber });
      setSubject('');
      setMessage('');
      setAttachmentFile(null);
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col font-sans">
      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-2">
            Support Center
          </h1>
          <p className="text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">
            Find answers to common questions or reach out to our support team for assistance.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-center mb-8 border-b border-neutral-800">
          <button
            onClick={() => setActiveTab('faq')}
            className={`pb-3 px-4 sm:px-5 text-xs sm:text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'faq'
                ? 'border-[#8C5CFF] text-[#8C5CFF]'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Help Center (FAQ)
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`pb-3 px-4 sm:px-5 text-xs sm:text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'contact'
                ? 'border-[#8C5CFF] text-[#8C5CFF]'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Submit a Request
          </button>
          <button
            onClick={() => setActiveTab('my-tickets')}
            className={`pb-3 px-4 sm:px-5 text-xs sm:text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'my-tickets'
                ? 'border-[#8C5CFF] text-[#8C5CFF]'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            My Support Tickets
          </button>
        </div>

        {/* ─── TAB 1: FAQ Section ────────────────────────────────────────── */}
        {activeTab === 'faq' && (
          <div className="space-y-6">
            {/* Search Input */}
            <div className="relative w-full max-w-xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search size={16} className="text-neutral-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search help articles..."
                className="w-full bg-[#121212] border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-[#8C5CFF]/60 transition-colors"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#8C5CFF] text-white shadow-sm shadow-[#8C5CFF]/30'
                      : 'bg-[#141414] text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Accordion Questions List */}
            <div className="mt-6 space-y-3">
              {filteredFAQs.length === 0 ? (
                <div className="text-center py-12 border border-neutral-900 rounded-lg bg-[#111]">
                  <p className="text-sm text-neutral-400">No help articles match your search.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    className="mt-3 text-xs text-[#8C5CFF] hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                filteredFAQs.map((item) => {
                  const isExpanded = expandedId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="border border-neutral-800/80 bg-[#111111] rounded-lg transition-colors overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-left focus:outline-none"
                        aria-expanded={isExpanded}
                      >
                        <span className="text-sm font-medium text-neutral-200 pr-4">
                          {item.question}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-neutral-400 shrink-0 transition-transform duration-300 ease-in-out ${
                            isExpanded ? 'rotate-180 text-[#8C5CFF]' : ''
                          }`}
                        />
                      </button>
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${
                          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-neutral-400 leading-relaxed border-t border-neutral-900">
                            {item.answer}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Need More Help Prompt */}
            <div className="mt-10 p-5 rounded-lg border border-neutral-800 bg-[#121212] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-white">Can't find what you need?</h3>
                <p className="text-xs text-neutral-400">Send a message to our support team and we will assist you.</p>
              </div>
              <button
                onClick={() => setActiveTab('contact')}
                className="px-4 py-2 bg-[#8C5CFF] hover:bg-[#AC8EF3] text-white rounded-md text-xs font-semibold shrink-0 transition-all shadow-md shadow-[#8C5CFF]/20 flex items-center gap-1.5 active:scale-98"
              >
                <span>Submit Request</span>
                <ArrowRight size={14} className="text-white" />
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB 2: Submit a Request Form ──────────────────────────────── */}
        {activeTab === 'contact' && (
          <div className="max-w-xl mx-auto">
            {submittedTicket ? (
              /* Success Confirmation Banner */
              <div className="border border-neutral-800 bg-[#111] rounded-lg p-6 text-center space-y-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 size={20} />
                </div>
                <h2 className="text-lg font-semibold text-white">Request Received</h2>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Your support ticket <span className="font-mono text-white font-medium">#{submittedTicket.ticketNumber}</span> has been logged. Our team will review your request.
                </p>
                <div className="pt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setSubmittedTicket(null)}
                    className="px-4 py-2 border border-neutral-800 hover:border-neutral-700 rounded-md text-xs font-medium text-neutral-300 transition-colors"
                  >
                    Submit Another Request
                  </button>
                  <button
                    onClick={() => setActiveTab('faq')}
                    className="px-4 py-2 bg-[#8C5CFF] hover:bg-[#AC8EF3] text-white rounded-md text-xs font-semibold transition-all active:scale-98"
                  >
                    Return to FAQ
                  </button>
                </div>
              </div>
            ) : (
              /* Support Form */
              <form onSubmit={handleSubmit} className="border border-neutral-800/80 bg-[#111111] rounded-lg p-6 space-y-5">
                {submitError && (
                  <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {submitError}
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#161616] border border-neutral-800 rounded-md px-3.5 py-2 text-xs sm:text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-[#8C5CFF]/60"
                  />
                </div>

                {/* Category Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-[#161616] border border-neutral-800 rounded-md px-3.5 py-2 text-xs sm:text-sm text-neutral-200 appearance-none focus:outline-none focus:border-[#8C5CFF]/60"
                    >
                      {FORM_CATEGORIES.map((c) => (
                        <option key={c} value={c} className="bg-[#161616] text-neutral-200">
                          {c}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>

                {/* Subject Line */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Subject <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of your issue"
                    className="w-full bg-[#161616] border border-neutral-800 rounded-md px-3.5 py-2 text-xs sm:text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-[#8C5CFF]/60"
                  />
                </div>

                {/* Message / Description */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please explain your question or issue in detail..."
                    className="w-full bg-[#161616] border border-neutral-800 rounded-md px-3.5 py-2 text-xs sm:text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-[#8C5CFF]/60 resize-y min-h-[100px]"
                  />
                </div>

                {/* File Attachment (Optional) */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Attachment <span className="text-neutral-500 font-normal">(Optional — PNG, JPG, PDF up to 5 MB)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,application/pdf"
                    onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-[#1f1f1f] file:text-neutral-200 hover:file:bg-[#282828] cursor-pointer"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-[#8C5CFF] hover:bg-[#AC8EF3] text-white disabled:opacity-50 rounded-md text-xs sm:text-sm font-semibold transition-all shadow-md shadow-[#8C5CFF]/20 active:scale-98 flex items-center justify-center cursor-pointer"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Support Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ─── TAB 3: My Support Tickets ─────────────────────────────────── */}
        {activeTab === 'my-tickets' && (
          <MyTicketsPage onNavigateToCreate={() => setActiveTab('contact')} />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
