package models

type CheckInRequest struct {
	UserID     string `json:"user_id" binding:"required"`
	TargetID   string `json:"target_id" binding:"required"`
	IsComplete bool   `json:"is_complete"`
}