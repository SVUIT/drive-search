const express = require("express");
const path = require("path");
const { Client, Databases, Query } = require("node-appwrite");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// Serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Appwrite Client Setup
const client = new Client()
    .setEndpoint(process.env.ENDPOINT)
    .setProject(process.env.PROJECT_ID);

const databases = new Databases(client);

// Search API
app.get("/search", async (req, res) => {
    const queryTerm = req.query.q?.trim();
    if (!queryTerm) {
        return res.status(400).json({ 
            error: 'Query parameter "q" is required.', 
            documents: [] 
        });
    }

    try {
        const result = await databases.listDocuments(
            process.env.DATABASE_ID,
            process.env.COLLECTION_ID,
            [Query.search("name", queryTerm)]
        );

        if (!result.documents.length) {
            return res.json({
                message: "Không tìm thấy môn học nào phù hợp.",
                documents: []
            });
        }

        res.json({
            documents: result.documents.map(doc => ({
                name: doc.name || "Chưa có tên",
                code: doc.code || "Chưa cập nhật",
                theoryCredits: doc.theoryCredits || 0,
                practiceCredits: doc.practiceCredits || 0,
                url: doc.url || null
            }))
        });
    } catch (error) {
        console.error("Error fetching from Appwrite:", error);
        res.status(500).json({ 
            error: "Error fetching from Appwrite.", 
            documents: [] 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
