package models

import "time"

type Document struct {
	Name       string
	Type       string
	UploadDate time.Time
	Semester   string // e.g. HK1 or HK2
	AcadYear   string // e.g. 2024-2025
	Note       string
}

type Subject struct {
	Name      string
	Code      string
	Division  string
	Type      string
	URL       string
	Note      string
	Documents []Document
}
