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
// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// GET /search?query=...
app.get("/search", async (req, res) => {
  const searchQuery = req.query.query || "";
  let searchTerms = searchQuery.split(",").map((term) => term.trim()).filter((term) => term !== "");
  
  if (searchTerms.length === 0) {
    searchTerms = [searchQuery];
  }

  try {
    const documentMap = new Map();
    await Promise.all(searchTerms.map(async (term) => {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.search("name", term)]
      );
      result.documents.forEach((doc) => documentMap.set(doc.$id, doc));
    }));

    res.json(Array.from(documentMap.values()));
  } catch (error) {
    console.error("Error during search:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /documents?subjectId=...
app.get("/documents", async (req, res) => {
  const subjectId = req.query.subjectId;
  if (!subjectId) {
    return res.status(400).json({ error: "subjectId parameter is required" });
  }

  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      DOCUMENTS_COLLECTION_ID,
      [Query.equal("subjectId", subjectId)]
    );
    res.json(result.documents);
  } catch (error) {
    console.error("Error fetching documents for subject:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /documents/search?query=...
app.get("/documents/search", async (req, res) => {
  const query = req.query.query || "";
  let searchTerms = query.split(",").map((term) => term.trim()).filter((term) => term !== "");

  if (searchTerms.length === 0) {
    searchTerms = [query];
  }

  try {
    const documentMap = new Map();
    await Promise.all(searchTerms.map(async (term) => {
      const result = await databases.listDocuments(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        [Query.search("name", term)]
      );
      result.documents.forEach((doc) => documentMap.set(doc.$id, doc));
    }));

    res.json(Array.from(documentMap.values()));
  } catch (error) {
    console.error("Error during document search:", error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/documents/search", async (req, res) => {
  const query = req.query.query || "";
  let searchTerms = query.split(",").map((term) => term.trim()).filter((term) => term !== "");

  if (searchTerms.length === 0) {
    searchTerms = [query];
  }

  try {
    const documentMap = new Map();

    await Promise.all(searchTerms.map(async (term) => {
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

      [...byName.documents, ...byTags.documents].forEach((doc) => {
        documentMap.set(doc.$id, doc);
      });
    }));

    res.json(Array.from(documentMap.values()));
  } catch (error) {
    console.error("Error during document search:", error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/documents/tags", async (req, res) => {
  try {
    const allTags = new Set();
    const limit = 1311;
    let offset = 0;

    while (true) {
      const page = await databases.listDocuments(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        [ Query.limit(limit), Query.offset(offset) ]
      );
      page.documents.forEach(doc => {
        (doc.tags || []).forEach(tag => allTags.add(tag));
      });
      if (page.documents.length < limit) break;
      offset += limit;
    }

    res.json(Array.from(allTags));
  } catch (error) {
    console.error("Error fetching all tags:", error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/subjects", async (req, res) => {
  const allSubjects = [];
  const limit = 61;   
  let offset = 0;

  while (true) {
    const page = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [ Query.limit(limit), Query.offset(offset) ]
    );
    allSubjects.push(...page.documents);
    if (page.documents.length < limit) break;  
    offset += limit;
  }

  res.json(allSubjects);
});

app.use(express.static(__dirname));
// Start Server
app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});
