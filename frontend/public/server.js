
require('dotenv').config();

const express = require('express');
const { Client, Databases, Query } = require('node-appwrite');
=======
const express = require("express");
const path = require("path");
const { Client, Databases, Query } = require("node-appwrite");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (index.html, style.css, script.js, etc.)
app.use(express.json());
app.use(express.static('.'));

const client = new Client();
client
  .setEndpoint(process.env.ENDPOINT)               
  .setProject(process.env.PROJECT_ID);                              

const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID;         
const COLLECTION_ID = process.env.COLLECTION_ID;       
const DOCUMENTS_COLLECTION_ID = process.env.DOCUMENTS_ID; 

// GET /search?query=your_search_term (subjects search)
app.get('/search', async (req, res) => {
  const searchQuery = req.query.query || '';
  let searchTerms = searchQuery.split(',').map(term => term.trim()).filter(term => term !== '');
  if (searchTerms.length === 0) {
    searchTerms = [searchQuery];
  }
  try {
    const documentMap = new Map();
    await Promise.all(searchTerms.map(async term => {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.search('name', term)]
      );
      result.documents.forEach(doc => documentMap.set(doc.$id, doc));
    }));
    const subjects = Array.from(documentMap.values());
    res.json(subjects);
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /documents?subjectId=...
app.get('/documents', async (req, res) => {
  const subjectId = req.query.subjectId;
  if (!subjectId) {
    return res.status(400).json({ error: "subjectId parameter is required" });
  }
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      DOCUMENTS_COLLECTION_ID,
      [Query.equal('subjectId', subjectId)]
    );
    res.json(result.documents);
  } catch (error) {
    console.error('Error fetching documents for subject:', error);
    res.status(500).json({ error: error.message });
  }
});

// NEW: GET /documents/search?query=... (documents search by name)
app.get('/documents/search', async (req, res) => {
  const query = req.query.query || '';
  let searchTerms = query.split(',').map(term => term.trim()).filter(term => term !== '');
  if (searchTerms.length === 0) {
    searchTerms = [query];
  }
  try {
    const documentMap = new Map();
    await Promise.all(searchTerms.map(async term => {
      const result = await databases.listDocuments(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        [Query.search('name', term)]
      );
      result.documents.forEach(doc => documentMap.set(doc.$id, doc));
    }));
    const documents = Array.from(documentMap.values());
    res.json(documents);
  } catch (error) {
    console.error('Error during document search:', error);
    res.status(500).json({ error: error.message });
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

const client = new Client()
    .setEndpoint(process.env.ENDPOINT)
    .setProject(process.env.PROJECT_ID);

const databases = new Databases(client);

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
  console.log(`Express server listening on port ${PORT}`);
});
