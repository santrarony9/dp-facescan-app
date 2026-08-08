# 🤖 Agent Guidelines: Dreamline FaceScan & Image Studio

This guide defines standard development workflows, architectural constraints, and operational patterns for all autonomous agents in this workspace.

---

## 📌 Standard Operating Rules

1. **Autonomous Responsibility**: Always fix, build, test, and deploy without asking the user for terminal actions.
2. **Dreamline Image Studio Standards**:
   - Canvas rendering must always scale image draw bounds symmetrically with canvas internal resolution.
   - AI Cutout MUST pre-scale raw image inputs to max 1024px buffer before invoking neural models.
   - Watermark "Dreamline Production" must be rendered on all exported images at 50% opacity in the bottom-right corner.
3. **Mongoose Pre-Save Hooks**: Always write `async function()` without `next` parameter.
4. **Touch Gestures**: Always use Euclidean distance (`Math.hypot(dx, dy) < 10`) to separate taps from swipes on mobile lightboxes.
5. **Deployment Pipeline**:
   - Frontend: `npx vercel build --prod && npx vercel deploy --prebuilt --prod` from `frontend/` directory.
   - Production Domain: `https://app.dreamlineproduction.com`.
