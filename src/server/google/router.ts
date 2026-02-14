import { Router } from "express";
import { googleAuth } from "./auth.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";

export const googleAuthRouter = Router();

/** GET /status — check if Google is connected */
googleAuthRouter.get("/status", async (_req, res) => {
  const status = await googleAuth.getStatus();
  res.json(status);
});

/** GET /start — generate OAuth consent URL */
googleAuthRouter.get("/start", (_req, res) => {
  const { url } = googleAuth.generateAuthUrl();
  res.json({ url });
});

/** GET /callback — OAuth callback from Google */
googleAuthRouter.get("/callback", async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    res.redirect(
      `${FRONTEND_URL}/onboarding/callback?error=${encodeURIComponent(String(error))}`
    );
    return;
  }

  if (!code || !state) {
    res.redirect(
      `${FRONTEND_URL}/onboarding/callback?error=${encodeURIComponent("Missing code or state")}`
    );
    return;
  }

  // Validate CSRF state
  if (!googleAuth.validateState(String(state))) {
    res.redirect(
      `${FRONTEND_URL}/onboarding/callback?error=${encodeURIComponent("Invalid or expired state. Please try again.")}`
    );
    return;
  }

  try {
    await googleAuth.handleCallback(String(code));
    res.redirect(`${FRONTEND_URL}/onboarding/callback?success=true`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[google-auth] Callback error:", message);
    res.redirect(
      `${FRONTEND_URL}/onboarding/callback?error=${encodeURIComponent(message)}`
    );
  }
});

/** POST /disconnect — remove tokens and disconnect */
googleAuthRouter.post("/disconnect", async (_req, res) => {
  await googleAuth.disconnect();
  res.json({ disconnected: true });
});
