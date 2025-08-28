# Landing Page Images

Place your new UI screenshots in this folder. 

## Recommended Image Guidelines:

### File Naming Convention:
- `dashboard-main.png` - Main dashboard view
- `dashboard-mobile.png` - Mobile dashboard view
- `tradelog-desktop.png` - Trade log desktop view
- `tradelog-mobile.png` - Trade log mobile view
- `tradelog-add.png` - Add trade dialog
- `journal-desktop.png` - Journal page
- `goals-desktop.png` - Goals page
- `calendar-heatmap.png` - Calendar/heatmap view
- `charts-equity.png` - Equity curve chart
- `analytics-stats.png` - Analytics/statistics view

### Image Specifications:
- **Format**: PNG or WebP (for better compression)
- **Resolution**: 
  - Desktop screenshots: 1920x1080 or 2880x1620 (for retina)
  - Mobile screenshots: 390x844 (iPhone 14) or 412x915 (Android)
- **File Size**: Try to keep under 500KB per image (use compression tools)
- **Background**: Transparent or matching the app theme

### Optimization Tips:
1. Use tools like TinyPNG or ImageOptim to compress images
2. Consider using WebP format for better compression
3. Provide 2x versions for retina displays
4. Ensure consistent aspect ratios for similar views

### How to Add Images:
1. Place your images in this folder (`/public/images/landing/`)
2. Update the landing page component to reference them
3. Images will be available at `/images/landing/filename.png`

### Example Usage in Code:
```jsx
images={[
  { src: "/images/landing/dashboard-main.png", alt: "TradeVault Dashboard" },
  { src: "/images/landing/tradelog-desktop.png", alt: "Trade Log View" }
]}
```