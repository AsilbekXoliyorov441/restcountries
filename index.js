const express = require("express");
const path = require("path");
const cors = require("cors");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args)); // ✅ fetch qo‘shildi

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("*", async (req, res) => {
  try {
    const endpoint = "https://restcountries.com/v3.1";
    const basePath = req.path; // ✅ faqat path
    const response = await fetch(endpoint + basePath);

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch API" });
    }

    let data = await response.json();
    const totalData = [...data];

    // ✅ query params to‘g‘ri olish
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const order = req.query.order;

    // ✅ tartiblash
    if (order === "asc" || order === "desc") {
      data.sort((a, b) => {
        const nameA = a.name.common.toUpperCase();
        const nameB = b.name.common.toUpperCase();
        return order === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    }

    // ✅ pagination
    const startIndex = (page - 1) * limit;
    const paginatedData = data.slice(startIndex, startIndex + limit);

    res.json({
      total: totalData.length,
      page,
      limit,
      data: paginatedData,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Server running on port ${port}`));
