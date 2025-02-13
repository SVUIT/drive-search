// database.go
package database

import (
	"github.com/appwrite/sdk-for-go/appwrite"
	"github.com/appwrite/sdk-for-go/id"
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
