const fs = require('fs');
const path = require('path');

const targetFiles = [
  'apps/web/app/page.tsx',
  'apps/web/components/layout/sidebar.tsx',
  'apps/web/components/layout/top-nav.tsx',
  'apps/web/components/layout/bottom-nav.tsx'
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

  if (fileRel === 'apps/web/app/page.tsx') {
    // Replace outer container bg-[#0a0a0a] with bg-background
    content = content.replace(/bg-\[#0a0a0a\]/g, 'bg-background');
  }

  if (fileRel === 'apps/web/components/layout/sidebar.tsx') {
    // Replace sidebar class fields with adaptive values:
    content = content.replace(/sidebar:\s+'bg-\[#101010\]',/g, "sidebar:       'bg-sidebar',");
    content = content.replace(/bg-\[#101010\]/g, 'bg-sidebar');
    content = content.replace(/bg-\[#242424\]/g, 'bg-border');
    content = content.replace(/bg-\[#2e2e2e\]/g, 'bg-border');
    content = content.replace(/border-\[#2e2e2e\]/g, 'border-border');
    content = content.replace(/border-\[#242424\]/g, 'border-border');
    content = content.replace(/text-\[#A0A0A0\]/g, 'text-muted');
  }

  if (fileRel === 'apps/web/components/layout/top-nav.tsx') {
    // Replace hardcoded border-b border-[#121212] bg-[#080808] with border-b border-border bg-background
    content = content.replace(/border-\[#121212\]/g, 'border-border');
    content = content.replace(/bg-\[#080808\]/g, 'bg-background');
    content = content.replace(/border-\[#2e2e2e\]/g, 'border-border');
    content = content.replace(/border-\[#1e1e1e\]/g, 'border-border');
  }

  if (fileRel === 'apps/web/components/layout/bottom-nav.tsx') {
    // Replace border-t border-[#121212] bg-[#080808] with border-t border-border bg-background
    content = content.replace(/border-\[#121212\]/g, 'border-border');
    content = content.replace(/bg-\[#080808\]/g, 'bg-background');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully refactored layouts in ${fileRel}`);
});
