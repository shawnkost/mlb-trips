package store

import "time"

type Park struct {
	ID        int     `json:"id"`
	Name      string  `json:"name"`
	Team      string  `json:"team"`
	City      string  `json:"city"`
	State     string  `json:"state"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type Visit struct {
	ID        int       `json"id"`
	ParkID    int       `json"park_id"`
	VisitDate time.Time `json:"visit_date"`
	Rating    *int      `json"rating,omitempty"`
	Notes     *string   `json:"notes,omitempty"`
	CreatedAt time.Time `json:"created_at:"`
}
