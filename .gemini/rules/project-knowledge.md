# DP FaceScan App & Dreamline Studio - Project Knowledge Base

This file contains critical project context and operational rules for AI assistants working on this codebase.

---

## 1. Architecture Overview

This is a **Face Recognition Photo Gallery & Professional Image Studio** SaaS platform designed for professional photography studios.
- **Frontend**: React 19 + Vite 8 + Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- **Backend**: Node.js + Express + Mongoose (MongoDB 7.0) + BullMQ (Redis queues)
- **AI/ML**: 
  - Azure Face API (`recognition_04` model) for facial recognition & clustering
  - `@imgly/background-removal` (`isnet_quint8` ONNX model) for 100% in-browser client-side subject cutout
- **Storage**: AWS S3 (pre-signed URLs for direct browser upload and image streaming)
- **Hosting**: 
  - Frontend: Vercel (`app.dreamlineproduction.com` → `dp-facescan-app-final`)
  - Backend: AlmaLinux 9 VPS (`160.187.68.243:5000` via Nginx reverse proxy at `api.dreamlineproduction.com`)

---

## 2. Dreamline Image Studio Implementation Rules

- **Component**: `frontend/src/components/MiniEditor.jsx`
- **Viewport & Scaling**:
  - The canvas rendering math calculates `scaleFactor = maxDim / Math.max(unscaledTargetW, unscaledTargetH)`.
  - When calling `ctx.drawImage()`, `drawW = srcW * scaleFactor` and `drawH = srcH * scaleFactor`. Never use raw unscaled `srcW`/`srcH` directly in `drawToContext()`.
  - Always enforce `style={{ maxWidth: '100%', maxHeight: '100%' }}` and `className="object-contain"` on `<canvas>`.
- **AI Background Removal**:
  - Pre-scale the input to max 1024px before calling `removeBackground()`.
  - Use `publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/'` and `model: 'isnet_quint8'`.
  - Provide live progress text via `progress: (key, current, total)` callback.
- **Export Watermark**:
  - In `renderCanvas(true, false)`, add a 50% opacity text watermark (`Dreamline Production`) in the bottom-right corner with a soft drop shadow for contrast against all image tones.

---

## 3. Critical Deployment Rules

### Frontend (Vercel)
- **Project Name**: `dp-facescan-app-final` (never deploy to legacy `dist` or `dp-facescan-app`).
- **Production Domain**: `https://app.dreamlineproduction.com`
- **Build & Deploy Command**:
  ```bash
  cd frontend
  npx vercel build --prod
  npx vercel deploy --prebuilt --prod
  ```

### Backend (VPS)
- **VPS IP**: `160.187.68.243`
- **PM2 process name**: `facescan-backend`
- **Backend API domain**: `https://api.dreamlineproduction.com/api`
- **Deploy script**: `backend/deploy_vps.js`

---

## 4. Key Credentials & Business Details

- **Admin Master PIN**: `1234`
- **Admin URL**: `https://app.dreamlineproduction.com/admin`
- **UPI ID for Payments**: `8240054002@yescred`
- **AWS S3 Bucket**: `dreamline-facescan-app-222369475851-us-east-1-an` (Region: `us-east-1`)
- **Azure Endpoint**: `https://facescan-dp-1.cognitiveservices.azure.com/`

---

## 5. Common Pitfalls & Strict Rules

1. **Mongoose Pre-Save Hooks**: MUST use `async function()` without the `next` parameter (e.g. `EventSchema.pre('save', async function() { ... })`). Using `next` parameter causes fatal "next is not a function" crash.
2. **Mobile Gallery Swiping**: Always use Euclidean distance check (`Math.hypot(dx, dy) < 10`) on touch events to prevent accidental image skipping during taps.
3. **Editor State Re-use**: Always provide a unique `key` prop on `<MiniEditor key={selectedPhoto._id || selectedPhoto.url} />` to avoid stale canvas or filter states.
4. **User Persona**: The user is a professional photographer and studio business owner, NOT a programmer. Take 100% autonomous responsibility to write clean code, test, build, and deploy all fixes.
