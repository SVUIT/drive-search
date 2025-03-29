package database

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/appwrite/sdk-for-go/appwrite"
	"github.com/appwrite/sdk-for-go/id"
	"github.com/appwrite/sdk-for-go/query"
	"github.com/joho/godotenv"
)

type TableData struct {
	URL string
	Tag []string
}

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

func SeedTagData(csvPathURLFile string) {

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

	tagData := readCSV(csvPathURLFile)
	var data []TableData
	for i, row := range tagData {
		if i == 0 {
			continue
		}
		// Kiểm tra số cột để tránh lỗi index out of range
		if len(row) < 8 {
			continue
		}
		// Xử lý cột Subject và Tag
		url := row[6]
		tag := row[10]
		tag = strings.Trim(tag, "[]") // Xóa dấu []
		tag = strings.ReplaceAll(tag, "'", "")
		tags := strings.Split(tag, ",") // Tách thành mảng các tag
		data = append(data, TableData{URL: url, Tag: tags})
	}

	//Tạo map URL -> Tags từ TableData
	urlToTags := make(map[string][]string)
	for _, record := range data {
		urlToTags[record.URL] = record.Tag
	}

	for url, newTags := range urlToTags {
		response, err := appwriteDatabases.ListDocuments(
			databaseId,
			documentsId,
			appwriteDatabases.WithListDocumentsQueries(
				[]string{query.Equal("URL", url)}),
		)

		if err != nil {
			log.Printf("Lỗi khi lấy document có URL %s: %v\n", url, err)
			continue
		}

		if len(response.Documents) == 0 {
			log.Printf("Không tìm thấy document nào có URL: %s\n", url)
			continue
		}
		// var docData map[string]interface{}
		for _, doc := range response.Documents {
			updatedTags := newTags
			//Cập nhật document
			_, err := appwriteDatabases.UpdateDocument(
				databaseId,
				documentsId,
				doc.Id,
				appwriteDatabases.WithUpdateDocumentData(map[string]interface{}{
					"tags": updatedTags,
				}),
			)
			if err != nil {
				log.Printf("Lỗi cập nhật document %s: %v", doc.Id, err)
			} else {
				log.Printf("Cập nhật thành công document %s với tags: %v", doc.Id, updatedTags)
			}
		}
	}
}
