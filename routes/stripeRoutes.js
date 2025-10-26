import express from "express";
import {
  createCheckoutSession,
  handleStripeWebhook,
} from "../controllers/stripeController.js";

const router = express.Router();

router.post("/create-checkout-session", createCheckoutSession);
router.post("/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

export default router;
