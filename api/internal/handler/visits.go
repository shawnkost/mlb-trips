package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/shawnkost/mlb-trips/api/internal/store"
)

type createVisitRequest struct {
	ParkID    int     `json:"park_id"`
	VisitDate string  `json:"visit_date"`
	Rating    *int    `json:"rating"`
	Notes     *string `json:"notes"`
}

func (h *Handler) GetVisits(w http.ResponseWriter, r *http.Request) {
	visits, err := h.store.GetVisits(r.Context())
	if err != nil {
		log.Printf("GetVisits error: %v", err)
		http.Error(w, "failed to fetch visits", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(visits)
}

func (h *Handler) CreateVisit(w http.ResponseWriter, r *http.Request) {
	var req createVisitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	visitDate, err := time.Parse("2006-01-02", req.VisitDate)
	if err != nil {
		http.Error(w, "invalid visit_date, expected YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	visit, err := h.store.CreateVisit(r.Context(), store.CreateVisitParams{
		ParkID:    req.ParkID,
		VisitDate: visitDate,
		Rating:    req.Rating,
		Notes:     req.Notes,
	})
	if err != nil {
		log.Printf("CreateVisit error: %v", err)
		http.Error(w, "failed to create visit", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(visit)
}
