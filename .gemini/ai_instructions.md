# 💎 Project AI Instructions: DP Face Scan App & Dreamline Studio

This document defines the strict coding, architectural, and operational standards for the Dreamline project. Every AI session must read and strictly adhere to these instructions.

---

## 1. Core Architectural & System Standards

### 📸 1.1 Dreamline Image Studio (In-Browser Pro Editor)
*   **Zero Server Compute / 100% Free**: All image edits, tone curves, rotations, sharpens, unsharps, and AI background segmentations execute 100% client-side in the user's browser (HTML5 Canvas 2D + WebGL / ONNX WASM).
*   **Resolution Scaling & Aspect Ratio Containment**:
    *   Never draw raw unscaled images onto smaller canvas buffers. Always calculate `scaleFactor = maxDim / Math.max(unscaledTargetW, unscaledTargetH)` (preview maxDim: 1200px, export maxDim: 2048px).
    *   Image draw dimensions (`drawW`, `drawH`) must strictly equal `srcW * scaleFactor` and `srcH * scaleFactor` to guarantee the photo is always 100% full fit without accidental zooming or cropping.
    *   The canvas element must always maintain `object-contain`, `maxWidth: 100%`, `maxHeight: 100%`.
*   **AI Background Removal & Subject Cutout**:
    *   Input to `@imgly/background-removal` must ALWAYS be pre-scaled to a max 1024px buffer before calling `removeBackground()`. Passing full 12MP-24MP raw blobs directly into WebAssembly causes Out-Of-Memory (OOM) crashes on mobile devices.
    *   Use the quantized model `model: 'isnet_quint8'` with `publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/'` for rapid 2-3s processing and low network payload (~40MB).
    *   Always track download & segmentation progress via `progress: (key, current, total)` and display real-time percentage feedback.
    *   Cache the resulting cutout image in state so switching backdrops (Transparent, White, Black, Gold Gradient, Midnight, Rose, Bokeh Blur) happens instantaneously without re-running AI.
*   **Watermark on Export**:
    *   Every exported photo from the Studio must render the watermark text **`Dreamline Production`** in the bottom-right corner with 50% opacity (`rgba(255, 255, 255, 0.5)`) and a soft shadow (`rgba(0, 0, 0, 0.6)`) to ensure high readability on all backgrounds.
    *   Font size must scale proportionally with export dimensions (`Math.max(16, Math.round(targetW * 0.025))`).

### 📱 1.2 Mobile Touch & Gallery Navigation
*   **Touch vs Tap Separation**: When implementing touch gesture handlers on mobile image carousels / lightboxes, always track Euclidean distance (`Math.hypot(dx, dy) < 10`) between touch start and touch end to differentiate between intentional swipes and taps. Never trigger next/prev navigation on tap or long-press.
*   **Stale Component State Prevention**: Always pass unique keys (e.g. `key={selectedPhoto.id || selectedPhoto.url}`) to modal editors so React reconstructs fresh state when switching photos.

### ⚙️ 1.3 Backend & Worker Processing Flow
*   **Asynchronous AI Processing**: High-latency tasks like Azure Face detection or matching MUST be dispatched to Redis BullMQ queues (`photo-detection`, `face-processing`).
*   **Presigned S3 URLs**: All photo endpoints must presign all URL fields (`url`, `imageUrl`, `highResUrl`, `thumbnailUrl`) to prevent S3 CORS and 403 Forbidden errors in client browsers.
*   **Mongoose Pre-Save Syntax**: Mongoose pre-save hooks MUST use `async function()` syntax without the `next` parameter (e.g., `EventSchema.pre('save', async function() { ... })`). Using `next()` in async pre-save hooks causes a fatal runtime crash.

---

## 2. Design & UI Guidelines

### 🎨 Luxury Client UI vs SaaS Admin UI
*   **Public Client & Guest Galleries**: Luxury dark mode theme (`#030712` / `#0f172a`), refined gold/emerald accents (`#10b981`, `#f59e0b`), smooth glassmorphic cards (`backdrop-blur-xl`), and modern typography (`Outfit` and `Inter`).
*   **Admin Dashboard**: Clean, professional, high-contrast light SaaS theme (white/slate/blue) optimized for fast photo tagging, lead management, and proofing workflows.
*   **Animations**: Framer Motion for page transitions, modals, and smooth micro-interactions.

---

## 3. Infrastructure & Deployment Protocol

### 🌐 Frontend (Vercel)
*   **Project Name**: `dp-facescan-app-final`
*   **Production Domain**: `https://app.dreamlineproduction.com`
*   **Build & Deploy Command**:
    ```bash
    # From frontend directory:
    npx vercel build --prod
    npx vercel deploy --prebuilt --prod
    ```

### 🖥️ Backend (VPS)
*   **Server**: AlmaLinux 9 VPS at `160.187.68.243`
*   **API Domain**: `https://api.dreamlineproduction.com/api`
*   **Process Manager**: PM2 (`facescan-backend`)
*   **Deploy Script**: `backend/deploy_vps.js`

---

## 4. Autonomous Agent Persona & Communication Style
*   **100% Autonomous Execution**: The user is a professional photographer and studio owner, NOT a coder. DO NOT ask the user to run terminal commands, debug scripts, or deploy manually. The AI must take full initiative to test, build, format, and deploy all fixes to production.
*   **No Broken Placeholders**: Never leave mock data or incomplete placeholders. All features must be fully functional, free, and production-ready.
*   **Continuous Memory Maintenance**: Keep `.gemini/ai_memory.md` and `.gemini/rules/project-knowledge.md` synchronized after every milestone or architectural change.
