const fs = require('fs');
const path = require('path');

const targetFiles = [
  'apps/web/components/layout/sidebar.tsx',
  'apps/web/components/layout/top-nav.tsx',
  'apps/web/components/pages/settings-page.tsx',
  'apps/web/components/pages/profile-page.tsx',
  'apps/web/components/ui/two-factor-auth-modal.tsx',
  'apps/web/components/ui/personal-info-modal.tsx',
  'apps/web/components/ui/contact-modals.tsx',
  'apps/web/components/ui/change-password-modal.tsx',
  'apps/web/components/ui/frame-component21.tsx'
];

const basePath = 'c:/Users/user/Documents/canafri';

targetFiles.forEach(fileRel => {
  const filePath = path.join(basePath, fileRel);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping non-existent file: ${fileRel}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Let's do replacements:
  
  // 1. Text opacity and text-white replacements:
  // Convert text-white to text-foreground, except when it is a primary button, badge, red text, etc.
  // Note: we can use a regex to look at text-white class usages.
  // We want to avoid replacing button text which usually has text-white.
  // E.g. bg-[#8C5CFF] text-white should remain text-white.
  // E.g. bg-primary text-white should remain text-white.
  // E.g. bg-red-600 text-white should remain text-white.
  // E.g. text-white by itself inside headers, paragraphs, spans, icons, chevrons, etc. should become text-foreground.
  
  // Let's match classes like text-white/90, text-white/85, text-white/80, text-white/70, text-white/60, text-white/50, text-white/40, text-white/30, text-white/20, text-white/10, text-white/5
  // These should definitely become text-foreground/... because opacity modifiers on foreground adapt correctly to light/dark themes.
  content = content.replace(/text-white\/([0-9]+)/g, 'text-foreground/$1');
  
  // Also replace hover:text-white and hover:text-white/85
  content = content.replace(/hover:text-white\/([0-9]+)/g, 'hover:text-foreground/$1');
  content = content.replace(/hover:text-white/g, 'hover:text-foreground');
  
  // Placeholder text-white modifiers:
  content = content.replace(/placeholder:text-white\/([0-9]+)/g, 'placeholder:text-foreground/$1');
  
  // Replace absolute bg-white opacities with bg-foreground opacities (e.g. hover:bg-white/5 -> hover:bg-foreground/5, bg-white/10 -> bg-foreground/10)
  // EXCEPT when the element has a class like "bg-white p-2" (like QR codes which need a solid white background)
  // Let's replace 'bg-white/10' with 'bg-foreground/10', 'bg-white/5' with 'bg-foreground/5', 'hover:bg-white/5' with 'hover:bg-foreground/5'
  content = content.replace(/bg-white\/10/g, 'bg-foreground/10');
  content = content.replace(/bg-white\/5/g, 'bg-foreground/5');
  content = content.replace(/hover:bg-white\/5/g, 'hover:bg-foreground/5');
  content = content.replace(/hover:bg-white\/10/g, 'hover:bg-foreground/10');
  
  // 2. Modals: replace bg-[#0b0b0b] with bg-card, bg-[#121212] / bg-[#161616] / bg-[#1a1a1a] with bg-background
  content = content.replace(/bg-\[#0b0b0b\]/gi, 'bg-card');
  content = content.replace(/bg-\[#121212\]/gi, 'bg-background');
  content = content.replace(/bg-\[#161616\]/gi, 'bg-background');
  content = content.replace(/bg-\[#1a1a1a\]/gi, 'bg-background');
  
  // 3. Settings menu item active/hover: active ? 'bg-[#161616]' : 'bg-card hover:bg-[#111]'
  content = content.replace(/bg-\[#111\]/gi, 'bg-border/30');
  content = content.replace(/active \? 'bg-background' : 'bg-card hover:bg-border\/30'/gi, 'active ? \'bg-border/60\' : \'bg-card hover:bg-border/30\'');
  
  // 4. Toggle switch classes in sidebar and settings-page:
  // 'border border-[#242424]' -> 'border border-border'
  // enabled ? 'bg-[#8C5CFF]' : 'bg-[#2A2C33]' -> enabled ? 'bg-[#8C5CFF]' : 'bg-border/50'
  // checked ? 'bg-[#8C5CFF]' : 'bg-[#2A2C33]' -> checked ? 'bg-[#8C5CFF]' : 'bg-border/50'
  content = content.replace(/border-\[#242424\]/g, 'border-border');
  content = content.replace(/bg-\[#2A2C33\]/g, 'bg-border/50');
  content = content.replace(/bg-\[#A0A0A0\]/g, 'bg-muted');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully refactored general classes in ${fileRel}`);
});
