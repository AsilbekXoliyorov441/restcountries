const express = require("express");
const cors = require("cors");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("✅ Countries API Proxy is running!");
});

app.get("*", async (req, res) => {
  try {
    const endpoint = "https://restcountries.com/v3.1";
    let path = req.path;

    // agar foydalanuvchi faqat / bo‘lsa => /all ga yo‘naltiramiz
    if (path === "/") path = "/all";

    // 🔧 fields qo‘shamiz
    const query = "?fields=name,flags,region,capital,population";
    const response = await fetch(endpoint + path + query);

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch API" });
    }

    let data = await response.json();
    const totalData = [...data];

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const order = req.query.order;

    if (order === "asc" || order === "desc") {
      data.sort((a, b) => {
        const nameA = a.name.common.toUpperCase();
        const nameB = b.name.common.toUpperCase();
        return order === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    }

    const start = (page - 1) * limit;
    const paginated = data.slice(start, start + limit);

    res.json({
      total: totalData.length,
      page,
      limit,
      data: paginated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Server running on port ${port}`));
