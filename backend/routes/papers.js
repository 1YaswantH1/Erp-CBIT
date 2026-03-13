const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

const URL = "https://spdc.cbit.org.in/course/index.php?categoryid=89";

router.get("/", async (req, res) => {
  try {
    const { data } = await axios.get(URL);
    const $ = cheerio.load(data);

    const papers = [];

    $(".coursevisible").each((i, el) => {
      const title = $(el).find(".course-title h4").text().trim();
      const link = $(el).find("a").attr("href");

      const style = $(el).find(".course-image-view").attr("style");

      let image = "";
      if (style) {
        const match = style.match(/url\((.*?)\)/);
        if (match) image = match[1];
      }

      papers.push({
        title,
        link,
        image,
      });
    });

    res.json(papers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to scrape papers" });
  }
});

module.exports = router;
