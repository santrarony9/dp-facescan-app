# 🧠 Project AI Memory: DP Face Scan App & Dreamline Studio

This document serves as the persistent single-source-of-truth memory for the AI assistant and developers across all sessions. It consolidates complete technical history, infrastructure details, credentials, and milestone logs.

---

## 1. Core Project Registry

- **Official Brand Name**: Dreamline Production
- **App Name**: Dreamline Face Scan & Image Studio (`dp-facescan-app`)
- **Primary Channels**:
  - Web App: `https://app.dreamlineproduction.com`
  - Backend API: `https://api.dreamlineproduction.com`
  - Orders & Proofing: WhatsApp Direct Routing
  - UPI Payment ID: `8240054002@yescred`
  - Admin Master PIN: `1234`

---

## 2. Infrastructure & Hosting Details

### 🟢 Production Backend (VPS)
- **Host**: HostGraber VPS (AlmaLinux 9)
- **IP Address**: `160.187.68.243`
- **Internal Port**: `5000` (Reverse-proxied via Nginx on Port 443 with SSL)
- **PM2 Process**: `facescan-backend`
- **Database**: MongoDB 7.0 (Local instance on VPS)
- **Queue/Cache**: Redis 7.x (BullMQ for face-detection & photo-processing)
- **Deployment Automation**: `backend/deploy_vps.js`

### 🔵 Production Frontend (Vercel)
- **Vercel Project**: `dp-facescan-app-final`
- **Primary Domain**: `app.dreamlineproduction.com`
- **Deployment Strategy**:
  - Prebuilt deployment via `npx vercel build --prod && npx vercel deploy --prebuilt --prod`
  - Eliminates stale cache and deployment mismatch errors.

### ☁️ Cloud Storage (AWS S3)
- **Bucket**: `dreamline-facescan-app-222369475851-us-east-1-an`
- **Region**: `us-east-1`
- **Access Key**: `AKIATHRSA5UFQ7ZQBIF2`
- **Upload Flow**: Browser-to-S3 direct PUT via Pre-signed URLs (`GET /api/upload/url`) to avoid Vercel 4.5MB payload limits.

### 💎 Azure Neural Face API
- **Endpoint**: `https://facescan-dp-1.cognitiveservices.azure.com/`
- **Key**: Configured in `backend/.env`
- **Architecture**: Uses `LargeFaceList` for persistent event face catalogs. Includes graceful fallback when waiting for Microsoft cognitive access authorization.

---

## 3. Dreamline Image Studio Specifications

- **Engine Architecture**: 100% In-Browser Client-Side HTML5 Canvas 2D + WebGL / ONNX WASM.
- **Aspect Ratio & Sizing**:
  - Full-fit responsive layout (`scaleFactor` synchronization between container and draw context).
  - Prevents canvas cropping or accidental zoom-in bugs on landscape, portrait, and rotated images.
- **Tone Curve Controls**:
  - Exposure, Brightness, Contrast, Highlights, Shadows, Whites, Blacks, Saturation, Sepia, Grayscale, Hue Rotate.
  - Clarity, Sharpness convolution kernel, Unsharp Mask, Vignette generator, and Film Grain.
- **AI Subject Segmentation / Cutout**:
  - Powered by `@imgly/background-removal` (`isnet_quint8` quantized model).
  - Downscales source buffer to max 1024px to prevent WebAssembly heap exhaustion.
  - Live progress display (`Downloading AI model (45%)...`, `Extracting subject...`).
  - Supports 7 instant backdrops: Transparent, Studio White, Studio Black, Gold Gradient, Midnight Blue, Velvet Rose, and Bokeh Lens Blur.
- **Export & Watermark Engine**:
  - Exports crisp high-resolution images up to 2048px.
  - Automatically embeds **`Dreamline Production`** watermark in the bottom-right corner at 50% opacity with dynamic font scaling and soft drop shadow.
  - Direct Web Share API integration on mobile devices + instant download modal.

---

## 4. Key Milestones & Fixes Changelog

- **2026-04-06**: Migrated from synchronous Face API to Redis BullMQ queues. Overhauled Admin Panel.
- **2026-04-18**: UI/UX Premium Overhaul — Unified black/gold luxury theme for public pages and clean SaaS light-mode for Admin.
- **2026-04-18**: Launched WhatsApp Merchandise Salon with pricing badges and automated lead capture.
- **2026-08-08**: Fixed gallery swipe/tap collision using Euclidean distance touch delta (`Math.hypot(dx, dy) < 10`).
- **2026-08-08**: Fixed stale editor photo state by binding unique React `key` props to `MiniEditor`.
- **2026-08-08**: Updated backend `signPhotos` to presign all photo URL variants (`url`, `imageUrl`, `highResUrl`, `thumbnailUrl`).
- **2026-08-09**: Fixed image editor "zoomed in" viewport by synchronizing `scaleFactor` with canvas `drawToContext` logic.
- **2026-08-09**: Rebranded editor loading state to **"Dreamline Image Studio"** and implemented automated 50% opacity watermark on all exports.
- **2026-08-09**: Upgraded AI Subject Cutout with memory-safe 1024px pre-scaling, quantized model loading, and real-time progress feedback.
