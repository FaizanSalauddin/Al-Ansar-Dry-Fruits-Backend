import OpenAI from "openai";
import Product from "../models/Product.model.js";

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

export const chatWithBot = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        const lowerMsg = message.toLowerCase().trim();

        // Detect greeting from user
        const greetingWords = ["hi", "hello", "salam", "assalam", "hey"];
        const isGreeting = greetingWords.some(word =>
            lowerMsg === word || lowerMsg.startsWith(word + " ")
        );

        // AI response
        const aiResponse = await client.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content: `
You are "Ansari", an AI assistant for AL-Ansar Dry Fruits Store.

Behavior rules:
1. Only greet the user if they greet first.
2. Do NOT greet in normal answers.
3. Only answer questions related to:
   - Dry fruits
   - Health benefits
   - Nutrition
   - Usage or recipes
4. If the user asks anything outside this domain:
   - Politely refuse.
   - Say: "I can only help with dry fruits and health-related questions."

Tone:
- Friendly
- Short answers
- Helpful and polite
`,
                },
                {
                    role: "user",
                    content: message,
                },
            ],
            temperature: 0.5,
            max_tokens: 200,
        });

        let reply = aiResponse.choices[0].message.content.trim();

        // Add closing line only for real answers (not greetings or refusals)
        const lowerReply = reply.toLowerCase();

        if (
            !isGreeting &&
            !lowerReply.includes("anything else") &&
            !lowerReply.includes("only help with dry fruits") &&
            lowerMsg.length > 2
        ) {
            reply += "\n\nAnything else I can help you with?";
        }

        // -------- SMART PRODUCT DETECTION --------

        const categoryKeywords = {
            almonds: ["almond", "badam"],
            cashews: ["cashew", "kaju"],
            pistachios: ["pistachio", "pista"],
            walnuts: ["walnut", "akhrot"],
            dates: ["date", "khajoor", "ajwa"],
            raisins: ["raisin", "kishmish"],
            "dry-apricots": ["apricot"],
            "dry-figs": ["fig", "anjeer"],
        };

        let matchedCategories = [];
        const replyLower = reply.toLowerCase();

        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            for (const word of keywords) {
                if (replyLower.includes(word)) {
                    matchedCategories.push(category);
                    break;
                }
            }
        }

        // Remove duplicates
        matchedCategories = [...new Set(matchedCategories)];

        let products;

        // Only fetch products if categories found
        if (matchedCategories.length > 0) {
            const productDocs = await Product.find({
                category: { $in: matchedCategories },
                inStock: true,
            }).limit(6);

            products = productDocs.map((p) => ({
                id: p._id,
                name: p.name,
                price: p.discountedPrice || p.price,
                image:
                    p.images && p.images.length > 0
                        ? p.images[0].url
                        : null,
            }));
        }

        // Final response
        const response = { reply };

        if (products && products.length > 0) {
            response.products = products;
        }

        res.json(response);
    } catch (error) {
        console.error("Chatbot error:", error);
        res.status(500).json({ message: "Chatbot error" });
    }
};
