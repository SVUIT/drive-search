package database

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/appwrite/sdk-for-go/appwrite"
	"github.com/appwrite/sdk-for-go/id"
)

// Read data from CSV file
func readCSV(filePath string) [][]string {
	file, err := os.Open(filePath)
	if err != nil {
		log.Fatalf("Failed to open file: %v", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		log.Fatalf("Failed to read CSV data: %v", err)
	}

	return records
}

// Read JSON file
func readJSON(filePath string) []byte {
	file, err := os.ReadFile(filePath)
	if err != nil {
		log.Fatalf("Failed to read JSON file: %v", err)
	}
	return file
}

// Parse Subject details from JSON
func parseSubjectDetails(data []byte) map[string]map[string]interface{} {
	var jsonData struct {
		Headers []string   `json:"headers"`
		Rows    [][]string `json:"rows"`
	}

	if err := json.Unmarshal(data, &jsonData); err != nil {
		log.Fatalf("Failed to parse JSON: %v", err)
	}

	// Key: Code - Value: subject's detail
	subjectDetails := make(map[string]map[string]interface{})

	for _, row := range jsonData.Rows {
		code := row[1]
		theoryCredits, _ := strconv.Atoi(row[11])
		practiceCredits, _ := strconv.Atoi(row[12])
		subjectDetails[code] = map[string]interface{}{
			"name":             row[2],
			"type":             row[6],
			"management":       row[5],
			"theory-credits":   theoryCredits,
			"practice-credits": practiceCredits,
		}
	}

	return subjectDetails
}

// Map Documents to Subjects
func mapDocumentsToSubjects(documentRecords [][]string) map[string][]map[string]interface{} {

	// Key: Code - Value: document's detail
	documentsBySubjectCode := make(map[string][]map[string]interface{})

	for _, record := range documentRecords {
		parsedTime, _ := time.Parse(time.RFC3339Nano, record[8])
		subjectCode := record[3] // Extract subject-code

		document := map[string]interface{}{
			"name":          record[1],
			"type":          record[2],
			"upload-date":   parsedTime,
			"semester":      record[4],
			"academic-year": record[5],
			"URL":           record[6],
			"Note":          record[9],
		}

		documentsBySubjectCode[subjectCode] = append(documentsBySubjectCode[subjectCode], document)
	}

	return documentsBySubjectCode
}

// Function to seed Subjects with Documents
func seedSubjectsWithDocuments(subjectRecords [][]string, documentRecords [][]string, subjectDetails map[string]map[string]interface{}) {

	documentsBySubjectCode := mapDocumentsToSubjects(documentRecords) /*get document's detail of key: value*/

	for _, record := range subjectRecords {
		code := record[1]
		url := record[2]

		details, exists := subjectDetails[code] /*get subject's detail of key: code*/
		if !exists {
			log.Printf("Subject code %s not found in JSON data", code)
			continue
		}

		subject := map[string]interface{}{
			"code":             code,
			"name":             details["name"],
			"type":             details["type"],
			"management":       details["management"],
			"theory-credits":   details["theory-credits"],
			"practice-credits": details["practice-credits"],
			"URL":              url,
			"Note":             "",
			"documents":        documentsBySubjectCode[code],
		}

		_, err := appwriteDatabases.CreateDocument(
			studyVaultDB.Id,
			subjectsCollection.Id,
			id.Unique(),
			subject,
		)
		if err != nil {
			log.Printf("Failed to insert subject: %v", err)
		} else {
			fmt.Printf("Subject %s seeded successfully\n", code)
		}
	}
}

// Function to seed all data
func SeedAllData(csvPathURLFile string, csvPathURLFolder string, jsonPath string) {
	appwriteClient = appwrite.NewClient(
		appwrite.WithEndpoint("https://cloud.appwrite.io/v1"),
		appwrite.WithProject("<PROJECT_KEY>"),
		appwrite.WithKey("<API_KEY>"),
	)
	appwriteDatabases = appwrite.NewDatabases(appwriteClient)
	studyVaultDB, _ = appwriteDatabases.Get("<DATABASE_ID>")
	documentsCollection, _ = appwriteDatabases.GetCollection(studyVaultDB.Id, "<DOCUMENT_ID>")
	subjectsCollection, _ = appwriteDatabases.GetCollection(studyVaultDB.Id, "<SUBJECT_ID>")

	documentRecords := readCSV(csvPathURLFile)
	subjectRecords := readCSV(csvPathURLFolder)
	jsonData := readJSON(jsonPath)
	subjectDetails := parseSubjectDetails(jsonData)

	seedSubjectsWithDocuments(subjectRecords, documentRecords, subjectDetails)
}
