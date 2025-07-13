require("dotenv").config();
const express = require("express");
const path = require("path");
const { Client, Databases, Query } = require("node-appwrite");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

const client = new Client()
  .setEndpoint(process.env.ENDPOINT)
  .setProject(process.env.PROJECT_ID);

const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID;
const COLLECTION_ID = process.env.COLLECTION_ID;
const DOCUMENTS_COLLECTION_ID = process.env.DOCUMENTS_ID;

async function getTotalCount(databaseId, collectionId, query = []) {
  const res = await databases.listDocuments(databaseId, collectionId, [Query.limit(1), ...query]);
  return res.total;
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/search", async (req, res) => {
  const searchQuery = req.query.query || "";
  let terms = searchQuery.split(",").map(t => t.trim()).filter(Boolean);
  if (!terms.length) terms = [searchQuery];

  try {
    const map = new Map();
    await Promise.all(terms.map(async term => {
      const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.search("name", term)]);
      result.documents.forEach(doc => map.set(doc.$id, doc));
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
    res.status(500).json({ error: err.message });
  }
});

app.get("/subjects", async (req, res) => {
  try {
    const total = await getTotalCount(DATABASE_ID, COLLECTION_ID);
    if (!total || total < 1) return res.json([]);

    const subjects = [];
    const maxLimit = 100;
    let offset = 0;

    while (offset < total) {
      const page = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.limit(maxLimit), Query.offset(offset)]);
      subjects.push(...page.documents);
      offset += maxLimit;
    }

    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/documents", async (req, res) => {
  const documents = req.query.documents;
  if (!documents) return res.status(400).json({ error: "documents required" });

  try {
    const result = await databases.listDocuments(DATABASE_ID, DOCUMENTS_COLLECTION_ID, [Query.equal("documents", documents)]);
    res.json(result.documents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/documents/search", async (req, res) => {
  const query = req.query.query || "";
  const tags = req.query.tags ? req.query.tags.split(',') : [];

  try {
    let documents = [];

    if (query) {
      const terms = query.split(",").map(t => t.trim()).filter(Boolean);
      const map = new Map();

      await Promise.all(terms.map(async term => {
        const [byName, byTags] = await Promise.all([
          databases.listDocuments(DATABASE_ID, DOCUMENTS_COLLECTION_ID, [Query.search("name", term)]),
          databases.listDocuments(DATABASE_ID, DOCUMENTS_COLLECTION_ID, [Query.search("tags", term)])
        ]);
        [...byName.documents, ...byTags.documents].forEach(doc => map.set(doc.$id, doc));
      }));

      documents = Array.from(map.values());
    } else {
      const total = await getTotalCount(DATABASE_ID, DOCUMENTS_COLLECTION_ID);
      const maxLimit = 5000;
      let offset = 0;
      let allDocuments = [];

      while (offset < total) {
        const page = await databases.listDocuments(DATABASE_ID, DOCUMENTS_COLLECTION_ID, [Query.limit(maxLimit), Query.offset(offset)]);
        allDocuments.push(...page.documents);
        offset += maxLimit;
      }
      documents = allDocuments;
    }

    if (tags.length > 0) {
      documents = documents.filter(doc => Array.isArray(doc.tags) && tags.some(tag => doc.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())));
    }

    res.json(documents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/documents/tags", async (req, res) => {
  const documents = req.query.documents;
  if (!documents) return res.json([]);

  try {
    const result = await databases.listDocuments(DATABASE_ID,COLLECTION_ID, [Query.equal("documents", documents)]);
    const allTags = new Set();

    result.documents.forEach(doc => {
      (doc.tags || []).forEach(tag => allTags.add(tag));
    });

    res.json(Array.from(allTags));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
