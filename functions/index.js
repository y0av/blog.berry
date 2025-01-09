const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { onSchedule } = require("firebase-functions/v2/scheduler");
require("dotenv").config();
const OpenAI = require("openai");
const axios = require("axios");


exports.info = onRequest((request, response) => {
    logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase!");
});

exports.createBlogPost = onSchedule("every day 00:00", async (event) => {
    logger.info("Creating blog post!");

});

/**
 * Creates a blog post content using OpenAI's GPT model.
 * @async
 * @param {string} articleContent - The source article content to inspire the blog post
 * @return {Promise<void>} A promise that resolves when the content is generated
 * @throws {Error} If there's an error during content creation
 */
async function getPostContent(articleContent) {
    try {
        const openai = new OpenAI(); // API key is read from the OPENAI_API_KEY environment variable
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    "role": "system",
                    "content": "You are a professional technical writer skilled in creating in-depth, SEO-optimized blog posts. Your task is to write a detailed, structured, and engaging blog post about a given topic. Include an introduction, main content with sections and sub-sections, examples, use cases, and a conclusion."
                },
                {
                    "role": "user",
                    "content": "Write a comprehensive blog post ispired by this article: " + articleContent
                }
            ],
        });

        console.log(completion.choices[0].message.content);
        return (completion.choices[0].message);
    } catch (error) {
        logger.error("Error creating blog post:", error);
        throw new Error("Error creating blog post");
    }
}

// getPostContent();
