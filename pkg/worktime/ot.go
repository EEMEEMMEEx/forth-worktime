package worktime

import (
	"fmt"
	"math"
	"strconv"
	"strings"
)

const (
	DinnerBreakStart = 20 * 60      // 20:00 = 1200 mins
	DinnerBreakEnd   = 20*60 + 30   // 20:30 = 1230 mins
)

// ParseTimeToMinutes converts "HH:MM" into minutes from midnight.
func ParseTimeToMinutes(timeStr string) (int, error) {
	parts := strings.Split(strings.TrimSpace(timeStr), ":")
	if len(parts) != 2 {
		return 0, fmt.Errorf("invalid time format: %q", timeStr)
	}
	h, err := strconv.Atoi(parts[0])
	if err != nil {
		return 0, fmt.Errorf("invalid hour in %q: %w", timeStr, err)
	}
	m, err := strconv.Atoi(parts[1])
	if err != nil {
		return 0, fmt.Errorf("invalid minute in %q: %w", timeStr, err)
	}
	return h*60 + m, nil
}

// NormalizeEndTime handles overnight shift wrap (e.g. 22:00 to 02:00 -> 02:00 + 1440).
func NormalizeEndTime(start, end int) int {
	if end < start {
		return end + 1440
	}
	return end
}

// RoundHours converts minutes to hours rounded to 4 decimal places.
func RoundHours(minutes int) float64 {
	if minutes <= 0 {
		return 0
	}
	return math.Round((float64(minutes)/60.0)*10000) / 10000
}

// OverlapMinutes calculates the overlapping duration between two time intervals [startA, endA] and [startB, endB].
func OverlapMinutes(startA, endA, startB, endB int) int {
	start := max(startA, startB)
	end := min(endA, endB)
	if end > start {
		return end - start
	}
	return 0
}

// CalculateOTWithShift calculates overtime hours when a designated shift window is present.
func CalculateOTWithShift(status Status, workStart, workEnd int, shift ShiftWindow) OTData {
	ot := OTData{}

	coreStart := max(workStart, shift.Start)
	coreEnd := min(workEnd, shift.End)
	coreMins := max(0, coreEnd-coreStart)
	if coreMins >= 300 {
		coreMins -= 60 // 1 hour lunch break
	}

	otBefore := max(0, min(workEnd, shift.Start)-workStart)
	otAfter := max(0, workEnd-max(workStart, shift.End))
	dinnerBreak := OverlapMinutes(workStart, workEnd, DinnerBreakStart, DinnerBreakEnd)
	adjustedOtAfter := max(0, otAfter-dinnerBreak)
	otMins := otBefore + adjustedOtAfter

	if status == StatusHoliday || status == StatusWeekend {
		ot.O10 = RoundHours(coreMins)
		ot.O30 = RoundHours(otMins)
	} else {
		ot.O15 = RoundHours(otMins)
	}

	return ot
}

// CalculateOTWithoutShift calculates overtime hours when no shift window is defined.
func CalculateOTWithoutShift(status Status, workStart, workEnd int) OTData {
	ot := OTData{}
	coreMins := max(0, workEnd-workStart)

	if coreMins >= 300 {
		coreMins -= 60 // 1 hour lunch break
	}
	dinnerBreak := OverlapMinutes(workStart, workEnd, DinnerBreakStart, DinnerBreakEnd)
	if dinnerBreak > 0 {
		coreMins -= dinnerBreak
	}

	otMins := 0
	if coreMins > 480 {
		otMins = coreMins - 480
		coreMins = 480
	}

	if status == StatusHoliday || status == StatusWeekend {
		ot.O10 = RoundHours(coreMins)
		ot.O30 = RoundHours(otMins)
	} else {
		ot.O15 = RoundHours(otMins)
	}

	return ot
}
