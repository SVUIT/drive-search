package models

import "time"

type Document struct {
	Name         string
	Type         string
	UploadDate   time.Time
	Semester     string // e.g. HK1 or HK2
	AcademicYear string // e.g. 2024-2025
	URL          string
	Note         string
}

type Subject struct {
	Code            string
	Name            string
	Type            string
	Management      string
	TheoryCredits   uint8
	PracticeCredits uint8
	URL             string
	Note            string
	Documents       []Document
}

type StandardSubject struct {
	CourseCode      string
	VietnameseName  string
	EnglishName     string
	Type            string
	Management      string
	TheoryCredits   uint8
	PracticeCredits uint8
	URL             string
	Note            string
	Documents       []Document
}
