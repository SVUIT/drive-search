const express = require("express");
const path = require("path");
const { Client, Databases, Query } = require("node-appwrite");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

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
        return res.status(400).json({ 
            error: 'Query parameter "q" is required.',
            documents: [] 
        });
    }

    try {
        const result = await databases.listDocuments(
            process.env.DATABASE_ID,
            process.env.COLLECTION_ID,
            [
                Query.search("name", queryTerm),
            ],
            [
                Query.select([
                    "$id",
                    "name",
                    "code",
                    "theory_credits",
                    "practice_credits",
                    "URL"
                ])
            ]
        );

        if (result.documents.length === 0) {
            return res.json({
                message: "Không tìm thấy môn học nào phù hợp",
                documents: []
            });
        }

        res.json({
            documents: result.documents.map(doc => ({
                name: doc.name,
                code: doc.code,
                theoryCredits: doc["theory-credits"],
                practiceCredits: doc["practice-credits"],
                url: doc.URL
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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
