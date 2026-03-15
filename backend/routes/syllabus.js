const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

const URL =
  "https://www.cbit.ac.in/current_students/ug-and-pg-syllabus-structure/";

// PG table columns map (index → regulation name)
const PG_COLUMNS = {
  2: "R25 Scheme",
  3: "R23 Scheme",
  4: "R20 - AICTE Model Curriculum",
  5: "R19 Scheme",
  6: "R16 Scheme",
  7: "R13 Scheme",
};

function scrapeUG($) {
  const result = [];
  let currentBranch = "";
  let currentSno = "";

  $("#tablepress-37 tbody tr").each((i, row) => {
    const cols = $(row).find("td");
    if (cols.length === 0) return;

    const texts = cols.map((i, el) => $(el).text().trim()).get();

    let branch = "";
    let regulation = "";
    let syllabusCell;

    if (cols.length >= 4 && texts[0]) {
      currentSno = texts[0];
      currentBranch = texts[1];
      branch = currentBranch;
      regulation = texts[2];
      syllabusCell = cols.eq(3);
    } else if (cols.length >= 2) {
      branch = currentBranch;
      regulation = texts[0];
      syllabusCell = cols.eq(1);
    } else {
      return;
    }

    if (
      !regulation ||
      regulation.length > 50 ||
      !/[A-Za-z0-9]/.test(regulation)
    )
      return;

    const syllabus = [];
    syllabusCell.find("a").each((i, a) => {
      syllabus.push({ text: $(a).text().trim(), link: $(a).attr("href") });
    });

    if (syllabus.length === 0) return;

    result.push({ sno: currentSno, branch, regulation, syllabus });
  });

  return result;
}

function scrapePG($) {
  const result = [];

  $("#tablepress-38 tbody tr").each((i, row) => {
    const cols = $(row).find("td");
    if (cols.length < 8) return;

    const sno = $(cols.eq(0)).text().trim();
    const branch = $(cols.eq(1)).text().trim();

    // Skip header row
    if (!sno || isNaN(sno)) return;

    Object.entries(PG_COLUMNS).forEach(([colIndex, regulation]) => {
      const cell = cols.eq(Number(colIndex));
      const syllabus = [];

      cell.find("a").each((i, a) => {
        const text = $(a).text().trim();
        const link = $(a).attr("href");
        if (text && link) syllabus.push({ text, link });
      });

      if (syllabus.length === 0) return;

      result.push({ sno, branch, regulation, syllabus });
    });
  });

  return result;
}

router.get("/:type", async (req, res) => {
  try {
    const type = req.params.type;
    const { data } = await axios.get(URL);
    const $ = cheerio.load(data);

    const result = type === "ug" ? scrapeUG($) : scrapePG($);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Scraping failed" });
  }
});

module.exports = router;
