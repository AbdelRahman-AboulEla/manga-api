// Import modules using ES6 syntax
import express from "express";
import { load } from "cheerio"; // Corrected import for cheerio
import cors from "cors";
import cloudscraper from "cloudscraper"; // Add cloudscraper import

// Initialize Express app
const app = express();
app.use(cors());
const port = 3000;

// Function to fetch chapter images using cloudscraper and Cheerio with retry mechanism
async function getChapterImages(mangaSlug, chapterNumber, retries = 3) {
  const url = `https://lekmanga.net/manga/${mangaSlug}/${chapterNumber}`;
  try {
    const response = await cloudscraper.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        Referer: "https://lekmanga.net/",
      },
    });
    const html = response;
    const $ = load(html);
    const imgTags = $(
      ".reading-content .page-break.no-gaps img.wp-manga-chapter-img"
    );
    const imageUrls = [];
    imgTags.each((index, element) => {
      imageUrls.push($(element).attr("src"));
    });

    if (imageUrls.length === 0 && retries > 0) {
      console.warn(`Retrying... (${3 - retries + 1})`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
      return getChapterImages(mangaSlug, chapterNumber, retries - 1);
    }

    return { chapter: chapterNumber, images: imageUrls };
  } catch (error) {
    if (error.statusCode === 403 && retries > 0) {
      console.warn(`Retrying... (${3 - retries + 1})`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
      return getChapterImages(mangaSlug, chapterNumber, retries - 1);
    }
    console.error(error);
    return { error: "Failed to fetch chapter images" };
  }
}

// Function to fetch manga chapters using cloudscraper and Cheerio with retry mechanism
async function getMangaChapters(mangaSlug, retries = 3) {
  const url = `https://lekmanga.net/manga/${mangaSlug}`;
  try {
    const response = await cloudscraper.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        Referer: "https://lekmanga.net/",
      },
    });
    const html = response;
    const $ = load(html);
    const chapterLinks = $("ul.main.version-chap li.wp-manga-chapter");
    const chapters = [];
    chapterLinks.each((index, element) => {
      const chapterLink = $(element).find("a");
      const chapterNumber = chapterLink.text().trim();
      const chapterUrl = chapterLink.attr("href");
      chapters.push({
        number: chapterNumber,
        url: chapterUrl,
      });
    });

    if (chapters.length === 0 && retries > 0) {
      console.warn(`Retrying... (${3 - retries + 1})`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
      return getMangaChapters(mangaSlug, retries - 1);
    }

    return { manga: mangaSlug, chapters };
  } catch (error) {
    if (error.statusCode === 403 && retries > 0) {
      console.warn(`Retrying... (${3 - retries + 1})`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
      return getMangaChapters(mangaSlug, retries - 1);
    }
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
