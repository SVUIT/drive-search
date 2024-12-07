package main

import (
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/PuerkitoBio/goquery"
	"github.com/appwrite/sdk-for-go/appwrite"
	awclient "github.com/appwrite/sdk-for-go/client"
	"github.com/appwrite/sdk-for-go/databases"
	awmodels "github.com/appwrite/sdk-for-go/models"
	"github.com/svuit/drive-search/models"
)

var (
	awClient             awclient.Client
	studyVaultDB         *awmodels.Database
	studyVaultCollection *awmodels.Collection
	awDatabases          *databases.Databases
)

type TableData struct {
	Headers []string   `json:"headers"`
	Rows    [][]string `json:"rows"`
}

func getSubjectsData(url string) {
	// Make GET request
	resp, err := http.Get(url)
	if err != nil {
		log.Fatalf("Failed to make GET request: %v", err)
	}
	defer resp.Body.Close()

	// Parse HTML
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		log.Fatalf("Failed to parse HTML: %v", err)
	}

	// Find table
	table := doc.Find("table")
	if table.Length() == 0 {
		log.Fatalf("No table found")
	}

	// Extract table headers
	var headers []string
	table.Find("thead th").Each(func(i int, s *goquery.Selection) {
		headers = append(headers, s.Text())
	})

	// Extract table rows
	var rows [][]string
	table.Find("tbody tr").Each(func(i int, tr *goquery.Selection) {
		var row []string
		tr.Find("td").Each(func(j int, td *goquery.Selection) {
			row = append(row, td.Text())
		})
		rows = append(rows, row)
	})

	// Create TableData struct
	tableData := TableData{
		Headers: headers,
		Rows:    rows,
	}

	// Convert to JSON
	jsonData, err := json.MarshalIndent(tableData, "", "  ")
	if err != nil {
		log.Fatalf("Failed to convert to JSON: %v", err)
	}

	// Write JSON to file
	file, err := os.Create("table_data.json")
	if err != nil {
		log.Fatalf("Failed to create JSON file: %v", err)
	}
	defer file.Close()

	_, err = file.Write(jsonData)
	if err != nil {
		log.Fatalf("Failed to write JSON to file: %v", err)
	}
}

func seedSubjectsData(tableData TableData) {
	awClient = appwrite.NewClient(
		appwrite.WithProject("<PROJECT_KEY>"),
		appwrite.WithKey("<API_KEY>"),
	)
	var subjects []models.Subject

	for _, row := range tableData.Rows {
		theoryCredits, _ := strconv.Atoi(row[11])
		practiceCredits, _ := strconv.Atoi(row[12])
		subject := models.Subject{
			Code:            row[1],
			Name:            row[2],
			Type:            row[6],
			Management:      row[5],
			TheoryCredits:   uint8(theoryCredits),
			PracticeCredits: uint8(practiceCredits),
			URL:             "", // Assuming URL and Note are not provided in JSON
			Note:            "",
			Documents:       []models.Document{},
		}
		println((subject.Name))
		subjects = append(subjects, subject)
	}

}

func main() {
	var data []byte
	var err error
	urlString := flag.String("url", "", "URL to fetch the subjects data into a JSON file")
	jsonPath := flag.String("json", "", "Path to the JSON file containing subjects data")
	flag.Parse()

	if *urlString != "" {
		getSubjectsData(*urlString)
	}

	if *jsonPath != "" {
		data, err = os.ReadFile(*jsonPath)
		if err != nil {
			log.Fatalf("Failed to read JSON file: %v", err)
		}

		tableData := TableData{}
		err = json.Unmarshal(data, &tableData)
		if err != nil {
			log.Fatalf("Failed to unmarshal JSON data: %v", err)
		}

		seedSubjectsData(tableData)
	}

}
