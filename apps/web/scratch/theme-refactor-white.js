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

  let fileContent = fs.readFileSync(filePath, 'utf8');
  let lines = fileContent.split('\n');
  let updatedLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Check if line contains 'text-white'
    if (line.includes('text-white')) {
      // Check if it's a solid colored button/badge/status that MUST remain white on colored bg:
      const shouldKeepWhite = 
        line.includes('bg-red') || 
        line.includes('bg-emerald') || 
        line.includes('bg-[#8C5CFF]') || 
        line.includes('bg-[#8c5cff]') || 
        line.includes('bg-primary') ||
        line.includes('bg-green') ||
        line.includes('bg-[#4ADE80]') ||
        line.includes('bg-purple') ||
        line.includes('bg-rose');
        
      if (!shouldKeepWhite) {
        // Replace text-white with text-foreground
        line = line.replace(/\btext-white\b/g, 'text-foreground');
      }
    }

    updatedLines.push(line);
  }

  fs.writeFileSync(filePath, updatedLines.join('\n'), 'utf8');
  console.log(`Successfully converted plain text-white to text-foreground in ${fileRel}`);
});
