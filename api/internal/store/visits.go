package store

import (
	"context"
	"time"
)

type CreateVisitParams struct {
	ParkID    int
	VisitDate time.Time
	Rating    *int
	Notes     *string
}

func (s *Store) GetVisits(ctx context.Context) ([]Visit, error) {
	rows, err := s.db.Query(ctx, "SELECT id, park_id, visit_date, rating, notes, created_at FROM visits")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	visits := []Visit{}
	for rows.Next() {
		var v Visit
		err := rows.Scan(&v.ID, &v.ParkID, &v.VisitDate, &v.Rating, &v.Notes, &v.CreatedAt)
		if err != nil {
			return nil, err
		}
		visits = append(visits, v)
	}
	return visits, rows.Err()
}

func (s *Store) CreateVisit(ctx context.Context, params CreateVisitParams) (Visit, error) {
	var v Visit
	err := s.db.QueryRow(ctx,
		"INSERT INTO visits (park_id, visit_date, rating, notes) VALUES ($1, $2, $3, $4) RETURNING id, park_id, visit_date, rating, notes, created_at",
		params.ParkID, params.VisitDate, params.Rating, params.Notes,
	).Scan(&v.ID, &v.ParkID, &v.VisitDate, &v.Rating, &v.Notes, &v.CreatedAt)
	return v, err
}
