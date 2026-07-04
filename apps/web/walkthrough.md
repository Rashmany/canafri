# Walkthrough — Monorepo, Animation, and Sidebar Restructure

This walkthrough highlights the architectural layout reorganizations, backend setups, animations, and the new adaptive "Selling" dropdown and "Saved" navigations.

---

## 💼 Adaptive "Selling" Dropdown & "Saved" Navigation

We refactored the sidebar menu to support an adaptive workspace that switches between **Normal Mode (Buyer)** and **Seller Mode** dynamically:

### 1. Dynamic Mode-based Saved Button
- **When Seller Mode is OFF (Normal Mode)**:
  - The button is labeled **"Saved"**.
  - Clicking it navigates to `'Bookmarks'` (which shows all saved articles/content).
- **When Seller Mode is ON**:
  - The button is dynamically renamed to **"Saved Jobs"** at the main sidebar level.
  - Clicking it navigates to `'Bookmarks:Jobs'` (which shows saved jobs listings).
- In both modes, the Saved button behaves as a single navigation link with no sub-items dropdown/list.

### 2. Adaptive "Selling" Dropdown
- **When Seller Mode is ON**:
  - The **"Selling"** dropdown is shown. Tapping it displays:
    1. **Find a Job** (opens the main freelance job search portal)
    2. **Proposals** (view and track submitted bids and client status)
    3. **Gigs** (manage services, draft gigs, and review impressions/orders)
    4. **Buyer Request** (send customized service offers to active buyers)
    5. **Orders** (track contract milestones, active works, and client delivery)
- **When Seller Mode is OFF**:
  - The **"Selling"** dropdown and its sub-menu list are completely hidden.

### 3. Integrated Dedicated Sub-Pages
Created dedicated mockup views for all new sub-items inside the Turborepo web app:
- **Proposals Page** ([proposals-page.tsx](file:///c:/Users/user/Documents/canafri/apps/web/components/pages/proposals-page.tsx))
- **Gigs Page** ([gigs-page.tsx](file:///c:/Users/user/Documents/canafri/apps/web/components/pages/gigs-page.tsx))
- **Buyer Requests Page** ([buyer-requests-page.tsx](file:///c:/Users/user/Documents/canafri/apps/web/components/pages/buyer-requests-page.tsx))
- **Orders Page** ([orders-page.tsx](file:///c:/Users/user/Documents/canafri/apps/web/components/pages/orders-page.tsx)) — Replaced with the custom sales-management implementation.

---

## ⚡ Animation & Skeleton Loading Systems

### 1. UI Animation System
Appended a premium animation stack to the end of `globals.css` with 12 keyframe definitions (fade, modal scale, bottom sheets slide up/down, dropdown ease, error shake). Uses `transform` and `opacity` only to guarantee low-end mobile performance.

### 2. High-Fidelity Skeleton Loaders
Implemented a centralized skeleton component library at [`skeleton.tsx`](file:///c:/Users/user/Documents/canafri/apps/web/components/ui/skeleton.tsx) mapping exact sizes of components.
- Added a simulated loading state (800ms) + skeleton loading screen to all pages (Dashboard, Find Job, Messages, Wallet, Analysis, Proposals, Gigs, Buyer Requests, Orders).
- Skeletons use clean CSS keyframe sweeps and resolve smoothly via a 200ms fade transition.

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
