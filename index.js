const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("*", async (req, res) => {
  const endpoint = "https://restcountries.com/v3.1";
  let response = await fetch(endpoint + req.url.split("?")[0]);
  let data = await response.json();

  let totalData = JSON.parse(JSON.stringify(data));

  let {
    query: { page, limit = 10, order },
  } = req;

  if (order === "asc") {
    data.sort((a, b) => {
      const nameA = a.name.common.toUpperCase();
      const nameB = b.name.common.toUpperCase();

      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
  }

  if (order === "desc") {
    data.sort((a, b) => {
      const nameA = a.name.common.toUpperCase();
      const nameB = b.name.common.toUpperCase();

      if (nameB > nameA) {
        return 1;
      }

      if (nameB < nameA) {
        return -1;
      }

      return 0;
    });
  }

  if (page) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    data = data.slice(startIndex, endIndex);
  }

  const results = {
    data,
    total: totalData.length,
  };

  res.send(results);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
