package store

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
	db *pgxpool.Pool
}

func New(connStr string) (*Store, error) {
	pool, err := pgxpool.New(context.Background(), connStr)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to database: %w", err)
	}
	return &Store{db: pool}, nil
}

func (s *Store) Close() {
	s.db.Close()
}
