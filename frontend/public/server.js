const express = require("express");
const path = require("path");
const { Client, Databases, Query, Account } = require("node-appwrite");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the same folder
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const client = new Client()
  .setEndpoint(process.env.ENDPOINT)
  .setProject(process.env.PROJECT_ID);

const databases = new Databases(client);

// /search endpoint: performs a document search on the "name" attribute using a user session.
app.get("/search", async (req, res) => {
  const queryTerm = req.query.q;
  if (!queryTerm) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  try {
    // Truy vấn tài liệu mà không tạo session ẩn danh và thiết lập JWT
    const result = await databases.listDocuments(
      process.env.DATABASE_ID,
      process.env.COLLECTION_ID,
      [Query.search("name", queryTerm)]
    );
    res.json(result);
  } catch (error) {
    console.error("Error fetching from Appwrite:", error);
    res.status(500).json({
      error:
        "Error fetching from Appwrite: " +
        (error.response?.message || error.message)
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});