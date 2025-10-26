// controllers/stripeController.js
import dotenv from "dotenv";
dotenv.config();

import Stripe from "stripe";
import User from "../models/User.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ Stripe secret key is missing from .env");
}

// 🧮 Map of available plans
const planMap = {
  pack_10: { amount: 1000, credits: 50, tier: "starter" },
  pack_50: { amount: 5000, credits: 270, tier: "Most Popular" },
  pack_100: { amount: 10000, credits: 600, tier: "Best Value" },
};

// 🧾 Create Stripe checkout session
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

// 💳 Handle Stripe webhook events
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
    console.error("❌ Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { userId, planId } = session.metadata || {};
    const plan = planMap[planId];

    if (userId && plan) {
      try {
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          {
            $inc: { creditsLeft: plan.credits },
            subscription: plan.tier,
          },
          { new: true }
        );

        console.log(
          `✅ User ${updatedUser.username} (${userId}) upgraded to ${plan.tier}, added ${plan.credits} credits.`
        );
      } catch (updateErr) {
        console.error("❌ Error updating user credits:", updateErr.message);
      }
    } else {
      console.warn("⚠️ Missing userId or plan in session metadata.");
    }
  }

  res.status(200).json({ received: true });
};
