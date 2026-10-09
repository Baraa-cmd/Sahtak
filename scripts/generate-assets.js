import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// 1. SVG content for the Medical App Icon
const medicalIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="50%" stop-color="#047857" />
      <stop offset="100%" stop-color="#064e3b" />
    </linearGradient>
    <linearGradient id="crossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f0fdf4" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#022c22" flood-opacity="0.4" />
    </filter>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#34d399" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Background rounded squircle -->
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)" />

  <!-- Inner subtle border glow -->
  <rect x="16" y="16" width="480" height="480" rx="114" fill="none" stroke="#6ee7b7" stroke-width="4" stroke-opacity="0.35" />

  <!-- Medical Cross with Shadow -->
  <g filter="url(#shadow)">
    <!-- Main Cross Body -->
    <path d="M 216 96 C 216 85 225 76 236 76 L 276 76 C 287 76 296 85 296 96 L 296 216 L 416 216 C 427 216 436 225 436 236 L 436 276 C 436 287 427 296 416 296 L 296 296 L 296 416 C 296 427 287 436 276 436 L 236 436 C 225 436 216 427 216 416 L 216 296 L 96 296 C 85 296 76 287 76 276 L 76 236 C 76 225 85 216 96 216 L 216 216 Z" fill="url(#crossGrad)" />
  </g>

  <!-- ECG Heartbeat Wave across the cross -->
  <path d="M 88 256 L 180 256 L 210 180 L 244 330 L 276 220 L 306 280 L 328 256 L 424 256" 
        fill="none" 
        stroke="#047857" 
        stroke-width="16" 
        stroke-linecap="round" 
        stroke-linejoin="round" />

  <!-- Heart pulse dots -->
  <circle cx="210" cy="180" r="8" fill="#10b981" />
  <circle cx="244" cy="330" r="8" fill="#047857" />
  <circle cx="276" cy="220" r="8" fill="#10b981" />

  <!-- Subtle Crescent Top Right -->
  <circle cx="390" cy="120" r="16" fill="#a7f3d0" opacity="0.9" />
</svg>
`;

// 2. SVG content for Foreground Adaptive Icon (no background squircle, fits within 108dp circle)
const medicalForegroundSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="fgCrossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f0fdf4" />
    </linearGradient>
    <filter id="fgShadow">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#022c22" flood-opacity="0.35" />
    </filter>
  </defs>

  <g transform="translate(256, 256) scale(0.72) translate(-256, -256)" filter="url(#fgShadow)">
    <!-- Medical Cross -->
    <path d="M 216 96 C 216 85 225 76 236 76 L 276 76 C 287 76 296 85 296 96 L 296 216 L 416 216 C 427 216 436 225 436 236 L 436 276 C 436 287 427 296 416 296 L 296 296 L 296 416 C 296 427 287 436 276 436 L 236 436 C 225 436 216 427 216 416 L 216 296 L 96 296 C 85 296 76 287 76 276 L 76 236 C 76 225 85 216 96 216 L 216 216 Z" fill="url(#fgCrossGrad)" />
    
    <!-- Heartbeat Line -->
    <path d="M 88 256 L 180 256 L 210 180 L 244 330 L 276 220 L 306 280 L 328 256 L 424 256" 
          fill="none" 
          stroke="#047857" 
          stroke-width="18" 
          stroke-linecap="round" 
          stroke-linejoin="round" />

    <circle cx="210" cy="180" r="9" fill="#10b981" />
    <circle cx="244" cy="330" r="9" fill="#047857" />
    <circle cx="276" cy="220" r="9" fill="#10b981" />
  </g>
</svg>
`;

// 3. SVG content for Professional Medical Splash Screen
function createSplashSvg(width, height) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <radialGradient id="splashGlow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#047857" />
      <stop offset="50%" stop-color="#064e3b" />
      <stop offset="100%" stop-color="#022c22" />
    </radialGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#ecfdf5" />
    </linearGradient>
    <filter id="splashShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#splashGlow)" />

  <!-- Center Group -->
  <g transform="translate(${width / 2}, ${height * 0.42})">
    <!-- Emblem Background Container -->
    <g filter="url(#splashShadow)">
      <rect x="-90" y="-90" width="180" height="180" rx="48" fill="url(#cardGrad)" />
      
      <!-- Cross Icon inside -->
      <path d="M -24 -60 C -24 -64 -20 -68 -16 -68 L 16 -68 C 20 -68 24 -64 24 -60 L 24 -24 L 60 -24 C 64 -24 68 -20 68 -16 L 68 16 C 68 20 64 24 60 24 L 24 24 L 24 60 C 24 64 20 68 16 68 L -16 68 C -20 68 -24 64 -24 60 L -24 24 L -60 24 C -64 24 -68 20 -68 16 L -68 -16 C -68 -20 -64 -24 -60 -24 L -24 -24 Z" fill="#047857" />
      
      <!-- Heartbeat inside cross -->
      <path d="M -60 0 L -28 0 L -18 -26 L -4 28 L 8 -16 L 18 10 L 28 0 L 60 0" 
            fill="none" 
            stroke="#ffffff" 
            stroke-width="5" 
            stroke-linecap="round" 
            stroke-linejoin="round" />
    </g>

    <!-- App Title in Arabic -->
    <text y="145" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Tahoma, Arial, sans-serif" font-size="34" font-weight="800" fill="#ffffff" letter-spacing="1">صحتك دير حافر</text>

    <!-- Subtitle Badge -->
    <rect x="-150" y="172" width="300" height="36" rx="18" fill="#065f46" stroke="#34d399" stroke-width="1.5" stroke-opacity="0.4" />
    <text y="196" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Tahoma, Arial, sans-serif" font-size="15" font-weight="600" fill="#a7f3d0">دليلك الطبي للمناوبات والرعاية الصحية</text>
  </g>

  <!-- Bottom Pulse Loading Indicator -->
  <g transform="translate(${width / 2}, ${height * 0.88})">
    <circle cx="-24" cy="0" r="5" fill="#34d399" opacity="0.4" />
    <circle cx="0" cy="0" r="6" fill="#10b981" />
    <circle cx="24" cy="0" r="5" fill="#34d399" opacity="0.4" />
    <text y="30" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="#6ee7b7" opacity="0.75">جاري تحديث بيانات المناوبات...</text>
  </g>
</svg>
`;
}

async function run() {
  console.log('Generating medical icons and splash screens...');

  // Update public/icon.svg
  fs.writeFileSync('public/icon.svg', medicalIconSvg.trim());

  // Generate PWA icons
  await sharp(Buffer.from(medicalIconSvg)).resize(192, 192).png().toFile('public/pwa-192x192.png');
  await sharp(Buffer.from(medicalIconSvg)).resize(512, 512).png().toFile('public/pwa-512x512.png');
  await sharp(Buffer.from(medicalIconSvg)).resize(512, 512).png().toFile('public/pwa-maskable-512x512.png');
  await sharp(Buffer.from(medicalIconSvg)).resize(180, 180).png().toFile('public/apple-touch-icon.png');
  console.log('✓ PWA icons generated');

  // Android mipmap sizes
  const mipmapSizes = {
    'mipmap-mdpi': { icon: 48, fg: 108 },
    'mipmap-hdpi': { icon: 72, fg: 162 },
    'mipmap-xhdpi': { icon: 96, fg: 216 },
    'mipmap-xxhdpi': { icon: 144, fg: 324 },
    'mipmap-xxxhdpi': { icon: 192, fg: 432 }
  };

  const resBase = 'android/app/src/main/res';

  for (const [folder, sizes] of Object.entries(mipmapSizes)) {
    const dir = path.join(resBase, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // ic_launcher.png (Full medical icon)
    await sharp(Buffer.from(medicalIconSvg))
      .resize(sizes.icon, sizes.icon)
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    // ic_launcher_round.png
    await sharp(Buffer.from(medicalIconSvg))
      .resize(sizes.icon, sizes.icon)
      .composite([{
        input: Buffer.from(`<svg><circle cx="${sizes.icon/2}" cy="${sizes.icon/2}" r="${sizes.icon/2}" fill="#fff"/></svg>`),
        blend: 'dest-in'
      }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    // ic_launcher_foreground.png
    await sharp(Buffer.from(medicalForegroundSvg))
      .resize(sizes.fg, sizes.fg)
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));
  }
  console.log('✓ Android mipmap icons generated');

  // Splash screen resolutions
  const splashScreens = [
    { dir: 'drawable', file: 'splash.png', w: 720, h: 1280 },
    { dir: 'drawable-port-mdpi', file: 'splash.png', w: 320, h: 480 },
    { dir: 'drawable-port-hdpi', file: 'splash.png', w: 480, h: 800 },
    { dir: 'drawable-port-xhdpi', file: 'splash.png', w: 720, h: 1280 },
    { dir: 'drawable-port-xxhdpi', file: 'splash.png', w: 960, h: 1600 },
    { dir: 'drawable-port-xxxhdpi', file: 'splash.png', w: 1280, h: 1920 },
    { dir: 'drawable-land-mdpi', file: 'splash.png', w: 480, h: 320 },
    { dir: 'drawable-land-hdpi', file: 'splash.png', w: 800, h: 480 },
    { dir: 'drawable-land-xhdpi', file: 'splash.png', w: 1280, h: 720 },
    { dir: 'drawable-land-xxhdpi', file: 'splash.png', w: 1600, h: 960 },
    { dir: 'drawable-land-xxxhdpi', file: 'splash.png', w: 1920, h: 1280 },
  ];

  for (const item of splashScreens) {
    const dir = path.join(resBase, item.dir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const svgStr = createSplashSvg(item.w, item.h);
    await sharp(Buffer.from(svgStr))
      .resize(item.w, item.h)
      .png()
      .toFile(path.join(dir, item.file));
  }
  console.log('✓ Android splash screens generated');

  // Also write SVG splash for web preload
  fs.writeFileSync('public/splash.svg', createSplashSvg(720, 1280).trim());
  console.log('Done generating all assets!');
}

run().catch(console.error);
