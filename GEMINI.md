# 💎 Dreamline FaceScan & Image Studio - Operational Rules

This document outlines the core operational, architectural, and behavioral rules for all AI agents working on the Dreamline FaceScan & Image Studio repository.

---

## 🚀 Autonomous Execution Protocol
- The project owner is a photography business director, not a developer.
- **Do not ask the user to run terminal commands, execute migrations, or push code manually.**
- All bugs must be investigated, resolved, verified, and deployed autonomously using the configured deployment pipelines.

---

## 🛠️ Tech Stack & Key Components

### Frontend (`frontend/`)
- **React 19 + Vite 8 + Tailwind CSS v4**
- **Dreamline Image Studio (`MiniEditor.jsx`)**:
  - 100% In-browser photo editor using HTML5 Canvas 2D and `@imgly/background-removal` WASM.
  - Scale synchronization (`drawW = srcW * scaleFactor`, `drawH = srcH * scaleFactor`) to maintain full-fit image viewing without cropping.
  - In-browser AI subject segmentation with max 1024px pre-scaling and `isnet_quint8` quantized model.
  - Export watermark: "Dreamline Production" at 50% opacity in the bottom-right corner.
- **Deployment**: Vercel (`npx vercel build --prod && npx vercel deploy --prebuilt --prod`). Production URL: `https://app.dreamlineproduction.com`.

### Backend (`backend/`)
- **Node.js 20 + Express + Mongoose + BullMQ Redis Queues**
- **VPS Server**: HostGraber AlmaLinux 9 (`160.187.68.243:5000`). API Domain: `https://api.dreamlineproduction.com/api`.
- **Media Storage**: AWS S3 (`dreamline-facescan-app-222369475851-us-east-1-an`) with presigned URLs.
- **Face API**: Azure Neural Face API (`LargeFaceList` architecture).

---

## 📋 Credentials & Defaults
- **Admin PIN**: `1234`
- **Admin URL**: `https://app.dreamlineproduction.com/admin`
- **UPI Payment**: `8240054002@yescred`
- **WhatsApp**: Direct order routing
