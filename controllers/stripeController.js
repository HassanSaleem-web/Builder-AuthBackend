// controllers/stripeController.js
import dotenv from "dotenv";
dotenv.config(); // make sure .env is loaded before using process.env

import Stripe from "stripe";
import User from "../models/User.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ Stripe secret key is missing from .env");
}

const planMap = {
  pack_10: { amount: 10, credits: 50 },
  pack_50: { amount: 50, credits: 270 },
  pack_100: { amount: 100, credits: 600 },
};

export const createCheckoutSession = async (req, res) => {
  try {
    const { planId, userId } = req.body;
    const plan = planMap[planId];
    if (!plan) return res.status(400).json({ error: "Invalid plan ID" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `${plan.credits} Credits Pack` },
            unit_amount: plan.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscribe`,
      metadata: { planId, userId },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe session error:", err);
    res.status(500).json({ error: "Failed to create session" });
  }
};

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { userId, planId } = session.metadata || {};
    const plan = planMap[planId];

    if (userId && plan) {
      await User.findByIdAndUpdate(userId, {
        $inc: { creditsLeft: plan.credits },
      });
      console.log(`✅ Added ${plan.credits} credits to user ${userId}`);
    }
  }

  res.status(200).json({ received: true });
};
