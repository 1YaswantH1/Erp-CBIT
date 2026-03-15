const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

const URL =
  "https://www.cbit.ac.in/current_students/ug-and-pg-syllabus-structure/";

router.get("/:type", async (req, res) => {
  try {
    const type = req.params.type; // ug or pg

    const { data } = await axios.get(URL);
    const $ = cheerio.load(data);

    let tableId = type === "ug" ? "#tablepress-37" : "#tablepress-38";

    const rows = [];

    $(`${tableId} tbody tr`).each((i, row) => {
      const cols = [];

      $(row)
        .find("td")
        .each((j, cell) => {
          const link = $(cell).find("a").attr("href");
          const text = $(cell).text().trim();

          cols.push({
            text,
            link: link || null,
          });
        });

      if (cols.length > 0) rows.push(cols);
    });

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Scraping failed" });
  }
});

module.exports = router;
