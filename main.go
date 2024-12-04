package main

import (
	aw "github.com/appwrite/sdk-for-go/appwrite"
	awclient "github.com/appwrite/sdk-for-go/client"
	"github.com/appwrite/sdk-for-go/databases"
	awmodels "github.com/appwrite/sdk-for-go/models"
)

var (
	awClient             awclient.Client
	studyVaultDB         *awmodels.Database
	studyVaultCollection *awmodels.Collection
	awDatabases          *databases.Databases
)

func main() {
	awClient = aw.NewClient(
		aw.WithProject("<PROJECT_KEY>"),
		aw.WithKey("<API_KEY>"),
	)
}
