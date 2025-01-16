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

        console.log(completion.choices[0].message);
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
 * Extracts and formats the title from an article's content.
 * @param {string} articleContent - The full content of the article
 * @return {string} The formatted title from the first line of the article
 */
function trimTitleFromArticle(articleContent) {
    if (typeof articleContent !== "string") {
        return "";
    }
    const title = articleContent.split("\n")[0].replace(/[^\w\s,']/g, "");
    return title;
}

/**
 * Creates a filename from a title by converting to lowercase, replacing spaces with hyphens,
 * and limiting length to 50 characters.
 * @param {string} title - The title to convert into a filename
 * @return {string} The formatted filename
 */
function createFileNameFromTitle(title) {
    return title.toLowerCase()
        .replace(/\s/g, "-")
        .substring(0, 25); // Limit to 25 chars
}

/**
 * test function
 * @async
 * @param {string} articleContent - The article content to process
 */
async function flow(articleContent) {
    console.log("starting flow function");
    const myBlogPostContent = await getPostContent(articleContent);
    // console.log("content:", myBlogPostContent);
    const postTitle = trimTitleFromArticle(myBlogPostContent.content);
    console.log("postTitle:", postTitle);
    const cloned = await cloneRepo("y0av", "blog.berry");
    console.log("cloned repo:", cloned);
    const fileName = createFileNameFromTitle(postTitle) + ".md";
    const fileShortPath = await createMdFile("blog.berry", fileName, myBlogPostContent, "src/content/blog");
    console.log("created file:", fileShortPath);
    await commitFile("blog.berry", fileShortPath);
    console.log("done flow function");
}
// flow("Sonys comprehensive incamera authentication technology has been a long time coming but it has finally arrived for three of Sonys flagship cameras the Sony a1 a1 II and a9 III Sonys Camera Authenticity Solution (CAS) promises to offer photographers a means of verifying the authenticity of their images providing the confidence that news organizations and people increasingly demand in the age of generative AI Sonys authenticity solution relies upon the Coalition for Content Provenance and Authenticity (C2PA) standard Sonys approach depends upon hardware and software at the time of capture The authentication technology verifies that an image was in fact shot by a camera thanks to a digital situation created incamera at the moment the shutter is clicked This signature is embedded into the captured image in realtime and the digital keys associated with the pictures are stored in the cameras chipset An illustrated sequence of AIgenerated image editing The first shows a speaker and a photographer The second shows digital manipulation labeled as Fake The third and fourth show a photographer capturing a scene and an editor at work However Sonys solution goes further as just because a camera captured an image doesnt necessarily mean the photograph is of an actual real event that the photographer shot in person In addition to the digital signature the image metadata includes 3D depth of information which Sony says makes it possible to verify the authenticity of images with a high degree of accuracy Flowchart illustrating a C2PA compliant workflow for Sonys Camera Authenticity Solution Three main steps Shooting (camera signature) Editing (history signature) Verification (image validation site) Icons and a security lock graphic are included By using cameras from Sony both the image and the 3D depth information can be captured on the sensor along the single light axis providing information of high authenticity Sony adds Further the time and date of image capture can be verified via a secure serveracquired time attached to the image According to Sony this is tamperproof and cannot be changed by anyone Infographic illustrating a threestep process 1) Obtain a license and certificate 2) Shoot with digital signatureenabled camera and 3) Edit using C2PA format apps Includes icons for each step like a camera and computer For photojournalists they can use Sonys new authenticity solution to obtain certificates enable digital signatures and work within a C2PAcompliant workflow The digital signature including 3D metadata can be preserved throughout the capture and editing workflow provided photographers use C2PAcompatible apps like Adobe software Provided that the digital signature embedded in the camera stays intact the authenticity of an image can be verified from capture to publication As a member of the C2PA Steering Committee Sony plays a leading role in developing these standards and driving their broader implementation Sony explains It is worth taking a beat here to note the objective of the C2PA format It is not a solution to say This image is not fake Instead it is a means of confirming that an image is authentic Sonys CAS aims to deliver the trusted verifiable ground truth required to know when an image is real Effective image authenticity starts from a position of truth rather than a fruitless attempt to prove when something is fake Infographic showing image validation processes Top left Camera photo confirmation Top center Real subject verified Top right Capture time verified Bottom left Edited images authenticity verifiable Bottom right Identifies modified image areas Sony has also launched an image validation site which news organizations can use to check if an image was shot on a camera when it was captured whether it shows a reallife subject view the editing history and compare the image against the ground truth photo As of now Sonys Content Authenticity Solution is only available for select news organizations and their staff photographers Alongside the necessary firmware for the a1 a1 II and a9 III  more on that below  Sony has also launched an Image Validation Site and Digital Signature Upgrade License New Sony Firmware Beyond adding CAS compatibility the new firmware updates for the a1 (version 300) a1 II (version 200) and a9 III (300) introduce other new features and improvements While the complete breakdown is presented in the table below some highlights are worth discussing Screenshot of a feature update table detailing changes between previous and new firmware versions Categories include Shooting Functions Movie Functions and Operability and Transfer Functions highlighting preexisting and updated features The superfast Sony a9 III can now shoot at shutter speeds up to 1/80000s at all aperture values provided that users enable Exp Value Expand in the cameras menus Previously the max shutter speed was limited to 1/16000s when using an aperture brighter than f/18 Further the Sony a1 II and a9 III promise improved image quality when applying User LUTs Three Sony Alpha series cameras are displayed against a white background They are positioned with two cameras at the top and one at the bottom each showcasing their lenses and distinctive black design While the a1 II launched late last year with a wide range of usability and workflow improvements the new firmware improves operability for the original a1 and the a9 III including software update alerts FTP transfer scheduling and better operability when using the Sony Creators App The new firmware updates are available to download via the following links Sony a1 Sony a1 II and Sony a9 III");
