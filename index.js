// index.js
const express = require("express");
const path = require("path");
const cors = require("cors");

// fetch import (Node.js serverda global emas)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());

// 🧾 Asosiy hujjat (Dokumentatsiya sahifasi)
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>🌍 Countries API Proxy</title>
        <style>
          body {
            font-family: sans-serif;
            max-width: 800px;
            margin: 60px auto;
            line-height: 1.6;
          }
          code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 4px;
          }
          h1 {
            color: #0070f3;
          }
        </style>
      </head>
      <body>
        <h1>🌍 Countries API Proxy</h1>
        <p>Welcome to the Countries API Proxy built with Express and deployed on Vercel.</p>

        <h2>🧠 Available Endpoints</h2>
        <ul>
          <li><code>/all</code> — Get all countries</li>
          <li><code>/name/{country}</code> — Search countries by name</li>
        </ul>

        <h2>⚙️ Query Parameters</h2>
        <ul>
          <li><code>?page=1</code> — Pagination page (default: 1)</li>
          <li><code>?limit=10</code> — Items per page (default: 10)</li>
          <li><code>?order=asc|desc</code> — Sort countries alphabetically</li>
        </ul>

        <h2>🚀 Examples</h2>
        <ul>
          <li><a href="/all">/all</a></li>
          <li><a href="/all?page=2&limit=20">/all?page=2&limit=20</a></li>
          <li><a href="/name/uzbekistan">/name/uzbekistan</a></li>
          <li><a href="/all?order=desc">/all?order=desc</a></li>
        </ul>

        <hr />
        <p>Made by <b>Asilbek Xoliyorov</b> — Powered by <a href="https://restcountries.com">REST Countries API</a></p>
      </body>
    </html>
  `);
});

// 🌍 API yo‘naltiruvchi route
app.get("*", async (req, res) => {
  try {
    const endpoint = "https://restcountries.com/v3.1";
    let path = req.path;

    // / ni /all ga yo‘naltiramiz
    if (path === "/") path = "/all";

    // ✅ fields query qo‘shamiz
    const url = `${endpoint}${path}?fields=name,flags,region,population`;

    const response = await fetch(url);
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Failed to fetch from RestCountries" });
    }

    let data = await response.json();
    const totalData = [...data];

    // query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const order = req.query.order;

    // Sorting
    if (order === "asc" || order === "desc") {
      data.sort((a, b) => {
        const nameA = a.name.common.toUpperCase();
        const nameB = b.name.common.toUpperCase();
        return order === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    data = data.slice(startIndex, endIndex);

    const results = {
      total: totalData.length,
      page,
      limit,
      data,
    };

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Server running on port ${port}`));
