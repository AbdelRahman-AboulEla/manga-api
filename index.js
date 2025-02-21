// Import modules using ES6 syntax
import express from "express";
import axios from "axios";
import { load } from "cheerio"; // Corrected import for cheerio
import cors from "cors";
import puppeteer from "puppeteer"; // Import Puppeteer

// Initialize Express app
const app = express();
app.use(cors());
const port = 3000;

// Function to fetch chapter images (using axios)
async function getChapterImages(mangaSlug, chapterNumber) {
  const url = `https://lekmanga.net/manga/${mangaSlug}/${chapterNumber}`;
  try {
    const response = await axios.get(url);
    const $ = load(response.data);
    const imgTags = $(
      ".reading-content .page-break.no-gaps img.wp-manga-chapter-img"
    );
    const imageUrls = [];
    imgTags.each((index, element) => {
      imageUrls.push($(element).attr("src"));
    });
    return { chapter: chapterNumber, images: imageUrls };
  } catch (error) {
    console.error(error);
    return { error: "Failed to fetch chapter images" };
  }
}

// Function to fetch manga chapters using Puppeteer
async function getMangaChapters(mangaSlug) {
  const url = `https://lekmanga.net/manga/${mangaSlug}`;
  try {
    // Launch Puppeteer with options required in serverless environments like Vercel
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    // Navigate to the URL and wait for network to be idle
    await page.goto(url, { waitUntil: "networkidle2" });
    // Get page HTML content
    const html = await page.content();
    // Use cheerio to parse the HTML
    const $ = load(html);
    const chapterLinks = $("ul.main.version-chap li.wp-manga-chapter");
    const chapters = [];
    chapterLinks.each((index, element) => {
      const chapterLink = $(element).find("a"); // Find the <a> tag inside the <li>
      const chapterNumber = chapterLink.text().trim(); // Extract the chapter number
      const chapterUrl = chapterLink.attr("href"); // Extract the chapter URL
      chapters.push({
        number: chapterNumber,
        url: chapterUrl,
      });
    });
    await browser.close();
    return { manga: mangaSlug, chapters };
  } catch (error) {
    console.error(error);
    return { error: "Failed to fetch manga chapters" };
  }
}

// API endpoint to get manga chapters
app.get("/api/manga/:mangaSlug", async (req, res) => {
  const mangaSlug = req.params.mangaSlug;
  const result = await getMangaChapters(mangaSlug);
  res.json(result);
});

// API endpoint to get chapter images
app.get("/api/chapter/:mangaSlug/:chapterNumber", async (req, res) => {
  const mangaSlug = req.params.mangaSlug;
  const chapterNumber = req.params.chapterNumber;
  const result = await getChapterImages(mangaSlug, chapterNumber);
  res.json(result);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
