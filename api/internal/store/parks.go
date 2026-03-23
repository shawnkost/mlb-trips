package store

import "context"

func (s *Store) GetParks(ctx context.Context) ([]Park, error) {
	rows, err := s.db.Query(ctx, "SELECT id, name, team, city, state, latitude, longitude FROM parks")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	parks := []Park{}
	for rows.Next() {
		var p Park
		err := rows.Scan(&p.ID, &p.Name, &p.Team, &p.City, &p.State, &p.Latitude, &p.Longitude)
		if err != nil {
			return nil, err
		}
		parks = append(parks, p)
	}
	return parks, rows.Err()
}
