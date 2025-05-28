require("dotenv").config();
const express = require("express");
const path = require("path");
const { Client, Databases, Query } = require("node-appwrite");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname)); // Serve static files

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
  const tags = req.query.tags ? req.query.tags.split(',') : [];

  try {
    let documents = [];

    if (query) {
      // Nếu có từ khóa, tìm theo tên hoặc tags
      let terms = query.split(",").map(t => t.trim()).filter(Boolean);
      if (!terms.length) terms = [query];

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
      documents = Array.from(map.values());
    } else {
      // Nếu không có từ khóa, lấy tất cả tài liệu
      const result = await databases.listDocuments(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID
      );
      documents = result.documents;
    }

    // Lọc theo tags nếu có tags được chọn
    if (tags.length > 0) {
      documents = documents.filter(doc =>
        Array.isArray(doc.tags) && tags.some(tag => doc.tags.includes(tag))
      );
    }

    res.json(documents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

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
        [
          Query.limit(Math.min(maxLimit, total - offset)),
          Query.offset(offset)
        ]
      );
      page.documents.forEach(doc => (doc.tags || []).forEach(tag => allTags.add(tag)));
      offset += maxLimit;
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
    if (!total || total < 1) return res.json([]);

    const subjects = [];
    const maxLimit = 807;
    let offset = 0;

    while (offset < total) {
      const page = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.limit(Math.min(maxLimit, total - offset)),
          Query.offset(offset)
        ]
      );
      subjects.push(...page.documents);
      offset += maxLimit;
    }

    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
