package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/shawnkost/mlb-trips/api/internal/store"
)

type Handler struct {
	store *store.Store
}

func New(s *store.Store) *Handler {
	return &Handler{store: s}
}

func (h *Handler) GetParks(w http.ResponseWriter, r *http.Request) {
	parks, err := h.store.GetParks(r.Context())
	if err != nil {
		log.Printf("GetParks error: %v", err)
		http.Error(w, "failed to fetch parks", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(parks)
}
