// Load environment variables
require("dotenv").config();

const express = require("express");
const path = require("path");
const { Client, Databases, Query } = require("node-appwrite");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname)); // Serve static files

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.ENDPOINT)
  .setProject(process.env.PROJECT_ID);

const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID;
const COLLECTION_ID = process.env.COLLECTION_ID;
const DOCUMENTS_COLLECTION_ID = process.env.DOCUMENTS_ID;

// Utility: get total count of documents matching a query
async function getTotalCount(databaseId, collectionId, query = []) {
  // Call listDocuments and read its `total` property directly
  const result = await databases.listDocuments(
    databaseId,
    collectionId,
    [Query.limit(1), ...query]
  );
  return result.total;
}

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// GET /search?query=...
app.get("/search", async (req, res) => {
  const searchQuery = req.query.query || "";
  let terms = searchQuery.split(",").map(t => t.trim()).filter(Boolean);
  if (!terms.length) terms = [searchQuery];

  try {
    const map = new Map();
    await Promise.all(terms.map(async term => {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.search("name", term)]
      );
      result.documents.forEach(doc => map.set(doc.$id, doc));
    }));

    res.json(Array.from(map.values()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /documents?subjectId=...
app.get("/documents", async (req, res) => {
  const subjectId = req.query.subjectId;
  if (!subjectId) return res.status(400).json({ error: "subjectId required" });

  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      DOCUMENTS_COLLECTION_ID,
      [Query.equal("subjectId", subjectId)]
    );
    res.json(result.documents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /documents/search?query=...
app.get("/documents/search", async (req, res) => {
  const query = req.query.query || "";
  let terms = query.split(",").map(t => t.trim()).filter(Boolean);
  if (!terms.length) terms = [query];

  try {
    const map = new Map();
    await Promise.all(terms.map(async term => {
      const [byName, byTags] = await Promise.all([
        databases.listDocuments(
          DATABASE_ID,
          DOCUMENTS_COLLECTION_ID,
          [Query.search("name", term)]
        ),
        databases.listDocuments(
          DATABASE_ID,
          DOCUMENTS_COLLECTION_ID,
          [Query.search("tags", term)]
        )
      ]);
      [...byName.documents, ...byTags.documents].forEach(doc => map.set(doc.$id, doc));
    }));
    res.json(Array.from(map.values()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /documents/tags
app.get("/documents/tags", async (req, res) => {
  try {
    const total = await getTotalCount(DATABASE_ID, DOCUMENTS_COLLECTION_ID);
    const limit = Math.min(total, 807);      // Appwrite max 5000 per request
    let offset = 0;
    const allTags = new Set();

    while (offset < total) {
      const page = await databases.listDocuments(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        [Query.limit(limit), Query.offset(offset)]
      );
      page.documents.forEach(doc => (doc.tags || []).forEach(tag => allTags.add(tag)));
      offset += limit;
    }

    res.json(Array.from(allTags));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /subjects
app.get("/subjects", async (req, res) => {
  try {
    const total = await getTotalCount(DATABASE_ID, COLLECTION_ID);
    const limit = Math.min(total, 807);
    let offset = 0;
    const subjects = [];

    while (offset < total) {
      const page = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.limit(limit), Query.offset(offset)]
      );
      subjects.push(...page.documents);
      offset += limit;
    }

    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
