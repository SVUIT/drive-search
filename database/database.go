package database

import (
	"github.com/appwrite/sdk-for-go/appwrite"
	"github.com/appwrite/sdk-for-go/client"
	"github.com/appwrite/sdk-for-go/databases"
	"github.com/appwrite/sdk-for-go/id"
	"github.com/appwrite/sdk-for-go/models"
)

var (
	appwriteClient     client.Client
	studyVaultDB       *models.Database
	subjectsCollection *models.Collection
	appwriteDatabases  *databases.Databases
)

func init() {
	prepareDatabase()
}

func prepareDatabase() {
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
		true,
	)
}

// func seedSubjectsData(tableData TableData) {
// 	awClient = appwrite.NewClient(
// 		appwrite.WithProject("<PROJECT_KEY>"),
// 		appwrite.WithKey("<API_KEY>"),
// 	)
// 	var subjects []models.Subject

// 	for _, row := range tableData.Rows {
// 		theoryCredits, _ := strconv.Atoi(row[11])
// 		practiceCredits, _ := strconv.Atoi(row[12])
// 		subject := models.Subject{
// 			Code:            row[1],
// 			Name:            row[2],
// 			Type:            row[6],
// 			Management:      row[5],
// 			TheoryCredits:   uint8(theoryCredits),
// 			PracticeCredits: uint8(practiceCredits),
// 			URL:             "", // Assuming URL and Note are not provided in JSON
// 			Note:            "",
// 			Documents:       []models.Document{},
// 		}
// 		println((subject.Name))
// 		subjects = append(subjects, subject)
// 	}

// 	for _, subject := range subjects {

// 	}
// }
