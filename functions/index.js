const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { onSchedule } = require("firebase-functions/v2/scheduler");
require("dotenv").config();
const OpenAI = require("openai");
const fs = require("fs");
const git = require("simple-git");
const path = require("path");
const os = require("os");


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

/**
 * Creates a Markdown file with the given content
 * @async
 * @param {string} folderName - The name of the repo folder
 * @param {string} fileName - The name of the file to create
 * @param {string} content - The content to write to the file
 * @param {string} blogPostsFolder - The folder path where blog posts are stored
 * @return {Promise<void>}
 */
async function createMdFile(folderName, fileName, content, blogPostsFolder) {
    try {
        const tempFilePath = path.join(os.tmpdir(), folderName, blogPostsFolder, fileName);
        console.log({ tempFilePath });
        fs.writeFileSync(tempFilePath, content, "utf8");
        return tempFilePath;
    } catch (error) {
        console.error("Error creating file:", error);
        throw error;
    }
}

/**
 * Clones a GitHub repository to a local temporary directory.
 * @async
 * @param {string} userName - The name of the repository owner
 * @param {string} repoName - The name of the repository
 * @return {Promise<string>} The remote path to the cloned repository
 */
async function cloneRepo(userName, repoName) {
    // const USER = "y0av";
    const TOKEN = process.env.GITHUB_TOKEN;
    const remote = `https://${TOKEN}@github.com/${userName}/${repoName}`;
    const localPath = path.join(os.tmpdir(), repoName);

    try {
        await git().clone(remote, localPath);
        return remote;
    } catch (error) {
        console.error("Error cloning repository:", error);
        throw error;
    }
}

/**
 * Commits the specified file to a GitHub repository.
 * @async
 * @param {string} repoName - The name of the repository 
 * @param {string} fileShortPath - The short path tp the file to commit
 * @return {Promise<number>} 200 if successful, otherwise if there is an error
 */
async function commitFile(repoName, fileShortPath) {
    try {
        const localRepoPath = path.join(os.tmpdir(), repoName);
        const filePath = path.join(localRepoPath, fileShortPath);

        await git(localRepoPath)
            .add(filePath)
            .commit("Add new blog post file")
            .push("origin", "main");
        console.log("File committed and pushed to GitHub repository");
        return 200;
    } catch (error) {
        console.error("Error committing file:", error);
        return 400;
    }
}

/**
 * test function
 * @async
 */
async function test() {
    console.log("starting test function");
    const cloned = await cloneRepo("y0av", "blog.berry");
    console.log("cloned repo:", cloned);
    const fileShortPath = await createMdFile("blog.berry", "test.md", "Hello, file!", "src/content/blog");
    console.log("created file:", fileShortPath);
    await commitFile("blog.berry", fileShortPath);
    console.log("done test function");
}
// test();
