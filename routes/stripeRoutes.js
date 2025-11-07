import express from "express";
import {
  createCheckoutSession,
  handleStripeWebhook,
} from "../controllers/stripeController.js";

const router = express.Router();

// ✅ Normal routes use JSON parsing
router.post("/create-checkout-session", createCheckoutSession);

// ✅ Webhook route must use raw body for signature verification
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

export default router;
