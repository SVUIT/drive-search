// database.go
package database

import (
	"log"
	"os"

	"github.com/appwrite/sdk-for-go/appwrite"
	"github.com/appwrite/sdk-for-go/id"
	"github.com/joho/godotenv"
)

func createSubjectAttributes() {

	appwriteDatabases.CreateStringAttribute(
		studyVaultDB.Id,
		subjectsCollection.Id,
		"code",
		255,
		true,
	)

	appwriteDatabases.CreateStringAttribute(
		studyVaultDB.Id,
		subjectsCollection.Id,
		"name",
		255,
		true,
	)

	appwriteDatabases.CreateStringAttribute(
		studyVaultDB.Id,
		subjectsCollection.Id,
		"type",
		255,
		true,
	)

	appwriteDatabases.CreateStringAttribute(
		studyVaultDB.Id,
		subjectsCollection.Id,
		"management",
		255,
		true,
	)

	appwriteDatabases.CreateIntegerAttribute(
		studyVaultDB.Id,
		subjectsCollection.Id,
		"theory-credits",
		true,
	)

	appwriteDatabases.CreateIntegerAttribute(
		studyVaultDB.Id,
		subjectsCollection.Id,
		"practice-credits",
		true,
	)

	appwriteDatabases.CreateStringAttribute(
		studyVaultDB.Id,
		subjectsCollection.Id,
		"URL",
		512,
		true,
	)

	appwriteDatabases.CreateStringAttribute(
		studyVaultDB.Id,
		subjectsCollection.Id,
		"Note",
		512,
		false,
	)

	appwriteDatabases.CreateRelationshipAttribute(
		studyVaultDB.Id,
		subjectsCollection.Id,
		documentsCollection.Id,
		"oneToMany",
		appwriteDatabases.WithCreateRelationshipAttributeKey("documents"),
		appwriteDatabases.WithCreateRelationshipAttributeOnDelete("restrict"),
		appwriteDatabases.WithCreateRelationshipAttributeTwoWay(false),
	)

}

func createDocumentAttributes() {

	appwriteDatabases.CreateStringAttribute(
		studyVaultDB.Id,
		documentsCollection.Id,
		"name",
		255,
		true,
	)

	appwriteDatabases.CreateStringAttribute(
		studyVaultDB.Id,
		documentsCollection.Id,
		"type",
		255,
		true,
	)

	appwriteDatabases.CreateDatetimeAttribute(
		studyVaultDB.Id,
		documentsCollection.Id,
		"upload-date",
		true,
	)

	appwriteDatabases.CreateStringAttribute(
		studyVaultDB.Id,
		documentsCollection.Id,
		"semester",
		255,
		false,
	)

	appwriteDatabases.CreateStringAttribute(
		studyVaultDB.Id,
		documentsCollection.Id,
		"academic-year",
		255,
		false,
	)

	appwriteDatabases.CreateStringAttribute(
		studyVaultDB.Id,
		documentsCollection.Id,
		"URL",
		255,
		true,
	)

	appwriteDatabases.CreateStringAttribute(
		studyVaultDB.Id,
		documentsCollection.Id,
		"Note",
		255,
		false,
	)

}

func SchemaDatabase() {

	appwriteClient = appwrite.NewClient(
		appwrite.WithEndpoint("https://cloud.appwrite.io/v1"),
		appwrite.WithProject("<PROJECT_KEY>"),
		appwrite.WithKey("<API_KEY>"),
	)

	appwriteDatabases = appwrite.NewDatabases(appwriteClient)

	studyVaultDB, _ = appwriteDatabases.Create(
		id.Unique(),
		"StudyVault",
	)

	subjectsCollection, _ = appwriteDatabases.CreateCollection(
		studyVaultDB.Id,
		id.Unique(),
		"Subjects",
	)

	documentsCollection, _ = appwriteDatabases.CreateCollection(
		studyVaultDB.Id,
		id.Unique(),
		"Documents",
	)

	createDocumentAttributes()
	createSubjectAttributes()
}

func AddTagAttributes() {

	godotenv.Load()
	projectKey := os.Getenv("PROJECT_KEY")
	apiKey := os.Getenv("API_KEY")
	databaseId := os.Getenv("DATABASE_ID")
	documentsId := os.Getenv("DOCUMENTS_ID")
	subjectsId := os.Getenv("SUBJECTS_ID")
	appwriteClient = appwrite.NewClient(
		appwrite.WithEndpoint("https://cloud.appwrite.io/v1"),
		appwrite.WithProject(projectKey),
		appwrite.WithKey(apiKey),
	)

	appwriteDatabases = appwrite.NewDatabases(appwriteClient)
	studyVaultDB, _ = appwriteDatabases.Get(databaseId)
	documentsCollection, _ = appwriteDatabases.GetCollection(studyVaultDB.Id, documentsId)
	subjectsCollection, _ = appwriteDatabases.GetCollection(studyVaultDB.Id, subjectsId)

	if studyVaultDB == nil || documentsCollection == nil {
		log.Fatal("Lỗi: studyVaultDB hoặc documentsCollection là nil")
	}
	_, err := appwriteDatabases.CreateStringAttribute(
		studyVaultDB.Id,
		documentsCollection.Id,
		"tags",
		255,
		false,
		appwriteDatabases.WithCreateStringAttributeArray(true),
	)

	// Kiểm tra lỗi
	if err != nil {
		log.Fatalf("Lỗi khi tạo attribute 'tags': %v", err)
	}
}
