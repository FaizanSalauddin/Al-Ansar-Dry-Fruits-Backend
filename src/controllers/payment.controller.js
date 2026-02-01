import stripe from "../utils/stripe.js";

export const createPaymentIntent = async (req, res) => {
    try {
        const { amount } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // ₹ → paise
            currency: "inr",
            payment_method_types: ["card"],
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
