# Walkthrough — CanaFri Backend and Monorepo Reorganization

I have successfully restructured the project into a Turborepo monorepo and implemented the Fastify backend API based on the security stack, data flows, and rate-limiting rules.

---

## 📰 Homepage Dashboard & Article Reader

We converted the provided post feed list and article reader template into a production-grade, theme-responsive Dashboard page component ([dashboard-page.tsx](file:///c:/Users/user/Documents/canafri\apps\web\components\pages\dashboard-page.tsx)) integrated directly into [page.tsx](file:///c:/Users/user/Documents/canafri\apps\web\app\page.tsx).

### 1. Key Features Implemented
- **Responsive Split-View Layout**:
  - **Desktop/Tablet**: Split layout featuring the post feed list on the left and the active article reader on the right side.
  - **Mobile**: Interactive view switching between feed list and full-screen article view with smooth back button navigation.
- **Interactive Action Bar & Gaps (Refactored)**:
  - Spread all icons (Star, Comment, Like, Bookmark, Share) using `justify-between` to **fully fill the space** at the bottom of the card with even, uniform gaps.
  - Hides the Star icon on free cards and displays it on premium cards.
  - Removed the dislike icon from the card front.
  - Wired **Share icon** (`Share2`) to open a sharing modal containing Copy Link, Share on X (Twitter), Telegram, and WhatsApp options, with realistic toast confirmations.
  - Wired **Comment icon** (`MessageSquare`) to open a comments modal showcasing mock replies, supporting local comment posting and toasts.
- **Dots Options Menu**:
  - Wired the options button (`MoreHorizontal`) beside the post timestamp to trigger an absolute-positioned dropdown menu overlay containing:
    1. *Add creator as favorite / Remove from favorites* (Heart icon, toggles state)
    2. *Copy post link* (Copy icon, copy link, success toast)
    3. *Dislike this post* (ThumbsDown icon, filters card out of the active feed list, toast)
    4. *Mute creator* (VolumeX icon, destructive red text, mutes creator and filters posts from active feed, toast)
    5. *Block creator* (Ban icon, destructive red text, blocks creator and filters posts from active feed, toast)
- **Confidential Read-Stake Stakewall (Refactored)**:
  - If a premium article is locked, it shows **60% of the content** (dynamically calculated by splitting paragraphs) before locking out.
  - Rendered a beautiful, smooth **layer blur fade gradient overlay** at the bottom of the 60% preview text.
  - Completely removed borders, gray boxes, shadows, and the padlock icon from the stakewall.
  - Added a small transparent card badge saying `"Read More"` (snug fit padding: `0.5px` top/bottom, `5px` left/right) and kept the wide, clean `"Stake 5 CC & Continue Reading"` button.
  - Tapping the button shows a ledger verification simulation (`"Unlocking on Canton sub-ledger…"`) and unlocks the full article text dynamically.
- **Inline Comments & Composer (Refactored)**:
  - Replaced the modal comment popup window with **borderless inline comment cards** at the bottom of the full article view, mimicking the content feed card style.
  - Removed the top border lines on both the bottom sticky input bar and the mobile `BottomNav` bar for a completely clean, borderless appearance.
  - Built a Twitter-style fullscreen reply composer that includes the original post preview context, character counter circle indicator, picture attachment selectors, and Cancel/Post header control buttons.
  - **Farcaster Layout Alignments**:
    - Moved the post timestamp to the **bottom of the article card, directly below the ActionBar icons**, with no extra border lines.
    - Formatted the timestamp to match the requested dynamic layout style (e.g. `2:09pm · 5/10/2026`).
    - Implemented a **full-width divider border line** separating the main post card block from the replies list, extending all the way across the details panel layout.
  - **Interactive Comment Liking**:
    - Wired the Like button on the reply cards to toggle state dynamically. Clicking it fills the Heart icon with a premium red color and highlights the text label in red.

---

## 🎨 Sidebar Filters Integration (Bookmarks & Favorites)

- **Removed filter buttons** from the top of the content feed list on the dashboard.
- **Added Bookmarks and Favorites** directly to the sidebar navigation menu ([sidebar.tsx](file:///c:/Users/user/Documents/canafri\apps\web\components\layout\sidebar.tsx)) alongside Dashboard, Wallet, and Analysis.
- Wired sidebar navigation triggers to the `DashboardPage` filter controller:
  - Selecting **Bookmarks** in the sidebar displays only bookmarked articles, with a custom header section (*"Bookmarks / Your saved articles & research"*).
  - Selecting **Favorites** in the sidebar displays only posts from favorite creators, with a custom header section (*"Favorite Creators / Latest posts from creators you favor"*).
  - Selecting **Dashboard** in the sidebar displays standard Free vs Premium feed lists.

---

## 📁 Repository Restructure (Turborepo)

The repository has been restructured from a flat Next.js layout into a standard monorepo workspace matching your specification:

```
canafri/
├── apps/
│   ├── web/                  Next.js 16 frontend (moved from root)
│   │   ├── app/              Page routing & app views
│   │   └── package.json      Re-declared package name to 'web'
│   └── api/                  Fastify backend service
│       ├── prisma/
│       └── src/
└── ...
```
*(Refer to full repository folders for backend endpoints and rate-limit logic)*
