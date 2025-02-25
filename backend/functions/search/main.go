package handler

import (
	"os"

	"github.com/appwrite/sdk-for-go/appwrite"
	"github.com/appwrite/sdk-for-go/query"
	"github.com/open-runtimes/types-for-go/v4/openruntimes"
)

type Response struct {
	StatusCode int         `json:"statuscode"`
	Body       interface{} `json:"body"`
}

func Main(Context openruntimes.Context) openruntimes.Response {

	client := appwrite.NewClient(
		appwrite.WithEndpoint(os.Getenv("APPWRITE_FUNCTION_API_ENDPOINT")),
		appwrite.WithProject(os.Getenv("APPWRITE_FUNCTION_PROJECT_ID")),
		appwrite.WithKey(Context.Req.Headers["x-appwrite-key"]),
	)

	databases := appwrite.NewDatabases(client)
	databaseID := os.Getenv("APPWRITE_DATABASE_ID")
	collectionID := os.Getenv("APPWRITE_COLLECTION_ID")
	if databaseID == "" || collectionID == "" {
		return Context.Res.Json(Response{
			StatusCode: 500,
			Body:       "Error: Missing required environment variables (APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_ID)",
		})
	}
	payload := Context.Req.BodyText()

	result, err := databases.ListDocuments(databaseID, collectionID, databases.WithListDocumentsQueries([]string{query.Equal("Code", payload)}))

	if err != nil {
		return Context.Res.Json(Response{
			StatusCode: 200,
			Body:       result,
		})
	}

	return Context.Res.Json(Response{
		StatusCode: 404,
		Body:       "Subject not found",
	})

}
