require("dotenv").config()
const express = require("express")
const path = require("path")
const { Client, Databases, Query } = require("node-appwrite")

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.static(path.join(__dirname)))

const client = new Client()
  .setEndpoint(process.env.ENDPOINT)
  .setProject(process.env.PROJECT_ID)

const databases = new Databases(client)
const DATABASE_ID = process.env.DATABASE_ID
const SUBJECTS_COLLECTION_ID = process.env.COLLECTION_ID
const DOCUMENTS_COLLECTION_ID = process.env.DOCUMENTS_ID

async function getTotalCount(db, collection, query = []) {
  const res = await databases.listDocuments(db, collection, [Query.limit(1), ...query])
  return res.total
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

app.get("/search", async (req, res) => {
  const query = req.query.query || ""
  const terms = query.split(",").map(t => t.trim()).filter(Boolean)
  const resultsMap = new Map()
  try {
    await Promise.all(terms.map(async term => {
      const result = await databases.listDocuments(DATABASE_ID, SUBJECTS_COLLECTION_ID, [Query.search("name", term)])
      result.documents.forEach(doc => resultsMap.set(doc.$id, doc))
    }))
    const uniqueMap = new Map()
    for (const doc of resultsMap.values()) {
      const key = (doc.code || doc.name || "").toLowerCase()
      if (!uniqueMap.has(key)) uniqueMap.set(key, doc)
    }
    res.json(Array.from(uniqueMap.values()))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get("/subjects", async (req, res) => {
  try {
    const total = await getTotalCount(DATABASE_ID, SUBJECTS_COLLECTION_ID)
    if (!total) return res.json([])
    const subjects = []
    let offset = 0
    const limit = 100
    while (offset < total) {
      const page = await databases.listDocuments(
        DATABASE_ID,
        SUBJECTS_COLLECTION_ID,
        [Query.limit(limit), Query.offset(offset)]
      )
      subjects.push(...page.documents)
      offset += limit
    }
    res.json(subjects)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get("/documents", async (req, res) => {
  const subjectId = req.query.documents;
  if (!subjectId) {
    return res.status(400).json({ error: "Subject ID is required" });
  }

  try {
    // Get the subject document (which holds the related document IDs)
    const subjectDoc = await databases.getDocument(
      DATABASE_ID,
      SUBJECTS_COLLECTION_ID,
      subjectId
    );

    const documentIds = subjectDoc.documents || [];

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return res.json({ documents: [] }); // Return empty list if no related documents
    }

    // Fetch all related documents in parallel
    const docs = await Promise.all(
      documentIds.map(async (docId) => {
        try {
          return await databases.getDocument(DATABASE_ID, DOCUMENTS_COLLECTION_ID, docId);
        } catch {
          return null; // Skip any that fail to load
        }
      })
    );

    // Filter out failed ones and return
    res.json({ documents: docs.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/documents/search", async (req, res) => {
  const query = req.query.query || ""
  const tags = req.query.tags ? req.query.tags.split(",") : []
  const docField = req.query.documents || ""

  try {
    let documents = []

    if (query) {
      const terms = query.split(",").map(t => t.trim()).filter(Boolean)
      const resultsMap = new Map()

      await Promise.all(terms.map(async term => {
        const [byName, byTags] = await Promise.all([
          databases.listDocuments(DATABASE_ID, DOCUMENTS_COLLECTION_ID, [
            Query.search("name", term)
          ]),
          databases.listDocuments(DATABASE_ID, DOCUMENTS_COLLECTION_ID, [
            Query.search("tags", term)
          ])
        ])
        ;[...byName.documents, ...byTags.documents].forEach(doc => resultsMap.set(doc.$id, doc))
      }))

      documents = Array.from(resultsMap.values())

    } else if (docField) {
      //  Load subject by ID (docField)
      const subject = await databases.getDocument(
        DATABASE_ID,
        SUBJECTS_COLLECTION_ID,
        docField
      )

      //  Get related document IDs
      const documentIds = Array.isArray(subject.documents)
        ? subject.documents.map(d => d.$id || d)
        : []

      //  Fetch each batch of up to 100 docs
      for (let i = 0; i < documentIds.length; i += 100) {
        const batch = documentIds.slice(i, i + 100)
        const result = await databases.listDocuments(
          DATABASE_ID,
          DOCUMENTS_COLLECTION_ID,
          [Query.equal("$id", batch)]
        )
        documents.push(...result.documents)
      }

    } else {
      const total = await getTotalCount(DATABASE_ID, DOCUMENTS_COLLECTION_ID)
      let offset = 0
      const limit = 5000

      while (offset < total) {
        const page = await databases.listDocuments(
          DATABASE_ID,
          DOCUMENTS_COLLECTION_ID,
          [Query.limit(limit), Query.offset(offset)]
        )
        documents.push(...page.documents)
        offset += limit
      }
    }

    // ✅ Filter by tags (if provided)
    if (tags.length > 0) {
      documents = documents.filter(doc =>
        Array.isArray(doc.tags) &&
        tags.some(tag =>
          doc.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())
        )
      )
    }

    res.json(documents)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})


app.get("/documents/tags", async (req, res) => {
  try {
    const total = await getTotalCount(DATABASE_ID, DOCUMENTS_COLLECTION_ID)
    if (!total) return res.json([])
    const tagsSet = new Set()
    let offset = 0
    const limit = 5000
    while (offset < total) {
      const page = await databases.listDocuments(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        [Query.limit(limit), Query.offset(offset)]
      )
      page.documents.forEach(doc => (doc.tags || []).forEach(tag => tagsSet.add(tag)))
      offset += limit
    }
    res.json(Array.from(tagsSet))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => console.log(`✅ Server on ${PORT}`))