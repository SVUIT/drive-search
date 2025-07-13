require("dotenv").config();
const express = require("express");
const path = require("path");
const { Client, Databases, Query } = require("node-appwrite");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname)); // Serve static files like index.html

// Appwrite client setup
const client = new Client()
  .setEndpoint(process.env.ENDPOINT)
  .setProject(process.env.PROJECT_ID);

const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID;
const COLLECTION_ID = process.env.COLLECTION_ID;
const DOCUMENTS_COLLECTION_ID = process.env.DOCUMENTS_ID;

// Utility: get total count of documents matching a query
async function getTotalCount(databaseId, collectionId, query = []) {
  const res = await databases.listDocuments(
    databaseId,
    collectionId,
    [Query.limit(1), ...query]
  );
  return res.total;
}

// Serve the index.html file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Search subjects
app.get("/search", async (req, res) => {
  const searchQuery = req.query.query || "";
  let terms = searchQuery.split(",").map(t => t.trim()).filter(Boolean);
  if (!terms.length) terms = [searchQuery];

  try {
    const map = new Map();

    await Promise.all(terms.map(async term => {
      try {
        const result = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [Query.search("name", term)]
        );
        result.documents.forEach(doc => map.set(doc.$id, doc));
      } catch (err) {
        console.error(`Search failed for term "${term}":`, err.message);
      }
    }));

    const uniqueByCode = new Map();
    for (const doc of map.values()) {
      const key = doc.code?.toLowerCase() || doc.name?.toLowerCase();
      if (key && !uniqueByCode.has(key)) {
        uniqueByCode.set(key, doc);
      }
    }

    res.json(Array.from(uniqueByCode.values()));
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all subjects
app.get("/subjects", async (req, res) => {
  try {
    const total = await getTotalCount(DATABASE_ID, COLLECTION_ID);
    if (!total || total < 1) return res.json([]);

    const subjects = [];
    const maxLimit = 100;
    let offset = 0;

    while (offset < total) {
      const page = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.limit(maxLimit), Query.offset(offset)]
      );
      subjects.push(...page.documents);
      offset += maxLimit;
    }

    res.json(subjects);
  } catch (err) {
    console.error("Subjects fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// View documents by subjectId
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
    console.error("Documents fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Search documents with query/tags
app.get("/documents/search", async (req, res) => {
  const query = req.query.query || "";
  const tags = req.query.tags ? req.query.tags.split(',') : [];

  try {
    let documents = [];

    if (query) {
      const terms = query.split(",").map(t => t.trim()).filter(Boolean);
      const map = new Map();

      await Promise.all(terms.map(async term => {
        try {
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
        } catch (err) {
          console.error(`Document search failed for term "${term}":`, err.message);
        }
      }));

      documents = Array.from(map.values());
    } else {
      const total = await getTotalCount(DATABASE_ID, DOCUMENTS_COLLECTION_ID);
      const maxLimit = 5000;
      let offset = 0;
      let allDocuments = [];

      while (offset < total) {
        const page = await databases.listDocuments(
          DATABASE_ID,
          DOCUMENTS_COLLECTION_ID,
          [Query.limit(maxLimit), Query.offset(offset)]
        );
        allDocuments.push(...page.documents);
        offset += maxLimit;
      }
      documents = allDocuments;
    }

    // Filter by tags if selected
    if (tags.length > 0) {
      documents = documents.filter(doc =>
        Array.isArray(doc.tags) &&
        tags.some(tag =>
          doc.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())
        )
      );
    }

    res.json(documents);
  } catch (err) {
    console.error("Documents search error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get distinct tags
app.get("/documents/tags", async (req, res) => {
  try {
    const total = await getTotalCount(DATABASE_ID, DOCUMENTS_COLLECTION_ID);
    if (!total || total < 1) return res.json([]);

    const allTags = new Set();
    const maxLimit = 5000;
    let offset = 0;

    while (offset < total) {
      const page = await databases.listDocuments(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        [Query.limit(maxLimit), Query.offset(offset)]
      );
      page.documents.forEach(doc => {
        (doc.tags || []).forEach(tag => allTags.add(tag));
      });
      offset += maxLimit;
    }

    res.json(Array.from(allTags));
  } catch (err) {
    console.error("Tags fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
