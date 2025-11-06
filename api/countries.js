// api/countries.js
// Vercel Serverless Function for Countries API

const fetchFn = global.fetch
  ? global.fetch.bind(global)
  : (...args) =>
      import("node-fetch").then(({ default: fetch }) => fetch(...args));

// simple in-memory cache
let cache = null;
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 min

async function getAllCountries() {
  const now = Date.now();
  if (cache && now - cache.ts < CACHE_TTL_MS) return cache.data;

  const url =
    "https://restcountries.com/v3.1/all?fields=name,flags,region,capital,population";
  const res = await fetchFn(url);
  const txt = await res.text();
  let data;
  try {
    data = JSON.parse(txt);
  } catch (e) {
    throw new Error("Upstream returned invalid JSON: " + txt);
  }
  if (!res.ok) throw { upstream: data, status: res.status };

  cache = { data, ts: now };
  return data;
}

// utils
function applySearch(data, q) {
  if (!q) return data;
  const qLower = q.toLowerCase();
  return data.filter((c) => {
    const name = (c?.name?.common || "").toLowerCase();
    const capital = ((c?.capital && c.capital[0]) || "").toLowerCase();
    return name.includes(qLower) || capital.includes(qLower);
  });
}
function applyRegionFilter(data, region) {
  if (!region) return data;
  const r = region.toLowerCase();
  return data.filter((c) => (c.region || "").toLowerCase() === r);
}
function applyPopulationFilter(data, minPop, maxPop) {
  return data.filter((c) => {
    const pop = Number(c.population || 0);
    if (minPop != null && pop < minPop) return false;
    if (maxPop != null && pop > maxPop) return false;
    return true;
  });
}
function applySort(data, order) {
  if (!order) return data;
  const ord = order.toLowerCase();
  if (ord === "asc" || ord === "desc") {
    return data.sort((a, b) => {
      const A = (a?.name?.common || "").toUpperCase();
      const B = (b?.name?.common || "").toUpperCase();
      return ord === "asc" ? A.localeCompare(B) : B.localeCompare(A);
    });
  }
  return data;
}
function paginate(data, page = 1, limit = 10) {
  page = Number(page) || 1;
  limit = Number(limit) || 10;
  const total = data.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  return { total, page, pages, limit, data: data.slice(start, start + limit) };
}

// handler
module.exports = async (req, res) => {
  try {
    const all = await getAllCountries();
    const { q, order, region, page, limit, minPop, maxPop } = req.query;

    let result = all;
    result = applySearch(result, q);
    result = applyRegionFilter(result, region);
    result = applyPopulationFilter(
      result,
      minPop != null ? Number(minPop) : null,
      maxPop != null ? Number(maxPop) : null
    );
    result = applySort(result, order);
    const pag = paginate(result, page, limit);
    res.status(200).json(pag);
  } catch (err) {
    console.error("ERROR /api/countries:", err);
    if (err.upstream) return res.status(err.status || 502).json(err.upstream);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: err.message });
  }
};
