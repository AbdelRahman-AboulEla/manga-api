// Import modules using ES6 syntax
import express from "express";
import axios from "axios";
import { load } from "cheerio"; // Corrected import for cheerio

// Initialize Express app
const app = express();
const port = 3000;

// Function to fetch chapter details
async function getChapterImages(mangaSlug, chapterNumber) {
  const url = `https://lekmanga.net/manga/${mangaSlug}/${chapterNumber}`;
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    const $ = load(response.data); // Use load instead of cheerio.load

    // Extract image URLs (adjust selector based on website structure)
    const imgTags = $(
      ".reading-content .page-break.no-gaps img.wp-manga-chapter-img"
    ); // Example selector
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

// Function to fetch all chapters of a manga
async function getMangaChapters(mangaSlug) {
  const url = `https://lekmanga.net/manga/${mangaSlug}`;
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    const $ = load(response.data); // Use load instead of cheerio.load
    // Extract chapter links (adjust selector based on website structure)
    const chapterLinks = $("ul.main.version-chap li.wp-manga-chapter"); // Example selector

    const chapters = [];
    chapterLinks.each((index, element) => {
      console.log(`element ${index} :=>`, element);
      const chapterLink = $(element).find("a"); // Find the <a> tag inside the <li>
      const chapterNumber = chapterLink.text().trim(); // Extract the chapter number
      const chapterUrl = chapterLink.attr("href"); // Extract the chapter URL
      // Add the chapter details to the list
      chapters.push({
        number: chapterNumber,
        url: chapterUrl,
      });
    });

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
