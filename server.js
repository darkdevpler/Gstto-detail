const express = require("express");
const axios = require("axios");

const app = express();

const PORT = process.env.PORT || 3000;

const UPSTREAM_API =
  process.env.UPSTREAM_API ||
  "https://gst-pan-api.onrender.com";

const DEVELOPER = "darkdevpler02";

app.use(express.json());

/* ==========================
   HOME
========================== */

app.get("/", (req, res) => {
  res.json({
    status: true,
    message: "GST API is online",
    developer: DEVELOPER
  });
});

/* ==========================
   HEALTH CHECK
========================== */

app.get("/health", (req, res) => {
  res.json({
    status: true,
    message: "OK",
    developer: DEVELOPER
  });
});

/* ==========================
   GSTIN API
========================== */

app.get("/gstin/:gstin", async (req, res) => {
  const gstin = String(req.params.gstin)
    .trim()
    .toUpperCase();

  // Basic GSTIN validation
  if (!/^[0-9A-Z]{15}$/.test(gstin)) {
    return res.status(400).json({
      status: false,
      message: "Invalid GSTIN format",
      developer: DEVELOPER
    });
  }

  try {
    const apiUrl =
      `${UPSTREAM_API}/gstin/${encodeURIComponent(gstin)}`;

    const response = await axios.get(apiUrl, {
      timeout: 15000,
      validateStatus: (status) => status >= 200 && status < 300
    });

    const upstream = response.data;

    if (!upstream || typeof upstream !== "object") {
      return res.status(502).json({
        status: false,
        message: "Invalid response from upstream service",
        developer: DEVELOPER
      });
    }

    /*
      Deliberately construct a new response.
      This prevents upstream "source" and "credit"
      fields from being returned.
    */

    const result = {
      gstin: upstream.gstin || gstin,
      data: upstream.data || {},
      developer: DEVELOPER
    };

    return res.status(200).json(result);

  } catch (error) {

    console.error(
      "Upstream error:",
      error.response?.status || error.message
    );

    return res.status(502).json({
      status: false,
      message: "GST service temporarily unavailable",
      developer: DEVELOPER
    });
  }
});

/* ==========================
   404 HANDLER
========================== */

app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: "Endpoint not found",
    developer: DEVELOPER
  });
});

/* ==========================
   ERROR HANDLER
========================== */

app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    status: false,
    message: "Internal server error",
    developer: DEVELOPER
  });
});

/* ==========================
   START SERVER
========================== */

app.listen(PORT, () => {
  console.log(`GST API running on port ${PORT}`);
});
