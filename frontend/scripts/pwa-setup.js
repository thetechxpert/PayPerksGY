#!/usr/bin/env node

/**
 * Post-export script for PWA assets
 * Copies PWA files (manifest, service worker, etc.) to the dist folder
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const WEB_DIR = path.join(__dirname, '..', 'web');

// Files to copy from public folder
const PUBLIC_FILES = [
  'manifest.json',
  'sw.js',
  'offline.html'
];

console.log('[PWA] Starting post-export PWA setup...');

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  console.log('[PWA] Warning: dist directory does not exist. Run expo export first.');
  process.exit(0);
}

// Copy public files to dist
PUBLIC_FILES.forEach(file => {
  const srcPath = path.join(PUBLIC_DIR, file);
  const destPath = path.join(DIST_DIR, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`[PWA] Copied ${file} to dist/`);
  } else {
    console.log(`[PWA] Warning: ${file} not found in public/`);
  }
});

// Update the main index.html with PWA meta tags
const indexPath = path.join(DIST_DIR, 'index.html');
const customIndexPath = path.join(WEB_DIR, 'index.html');

if (fs.existsSync(indexPath) && fs.existsSync(customIndexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Add PWA meta tags if not present
  if (!indexContent.includes('manifest.json')) {
    const headEndIndex = indexContent.indexOf('</head>');
    if (headEndIndex !== -1) {
      const pwaMetaTags = `
    <!-- PWA Configuration -->
    <meta name="theme-color" content="#00A86B">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="PayPerks GY">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="application-name" content="PayPerks GY">
    <link rel="manifest" href="/manifest.json">
    <link rel="apple-touch-icon" href="/assets/images/icon.png">
`;
      indexContent = indexContent.slice(0, headEndIndex) + pwaMetaTags + indexContent.slice(headEndIndex);
    }
  }
  
  // Add service worker registration if not present
  if (!indexContent.includes('serviceWorker.register')) {
    const bodyEndIndex = indexContent.indexOf('</body>');
    if (bodyEndIndex !== -1) {
      const swScript = `
    <script>
      // Service Worker Registration for PWA
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js')
            .then(function(reg) { console.log('[PWA] SW registered'); })
            .catch(function(err) { console.log('[PWA] SW registration failed:', err); });
        });
      }
    </script>
`;
      indexContent = indexContent.slice(0, bodyEndIndex) + swScript + indexContent.slice(bodyEndIndex);
    }
  }
  
  fs.writeFileSync(indexPath, indexContent);
  console.log('[PWA] Updated index.html with PWA configuration');
}

console.log('[PWA] PWA setup complete!');
