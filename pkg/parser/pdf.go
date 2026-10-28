package parser

import (
	"bytes"
	"fmt"
	"io"
	"regexp"
	"strconv"
	"strings"
	"time"

	"forth-worktime/pkg/worktime"

	"github.com/ledongthuc/pdf"
)

var (
	summaryKeywords = []string{"รวม", "สรุป", "à¸£à¸§à¸¡", "à¸ªà¸£à¸¸à¸›"}
	holidayKeywords = []string{"PH", "Holiday", "วันหยุด", "à¸§à¸±à¸™à¸«à¸¢à¸¸à¸”"}

	reWhitespace  = regexp.MustCompile(`\s+`)
	reDatePattern = regexp.MustCompile(`(\d{2})\.(\d{2})\.(\d{4})`)
	reShiftRange  = regexp.MustCompile(`\b([01]?\d|2[0-3]):([0-5]\d)\s*-\s*([01]?\d|2[0-3]):([0-5]\d)\b`)
	reTime        = regexp.MustCompile(`\b([01]?\d|2[0-3]):[0-5]\d\b`)
	reEarnPattern = regexp.MustCompile(`(?:เงินได้|à¹€à¸‡à¸´à¸™à¹„à¸”à¹‰)\s*\(\s*([01]?\d|2[0-3]):([0-5]\d)\s*-\s*([01]?\d|2[0-3]):([0-5]\d)\s*\)`)
)

func findLastKeywordIndex(text string, keywords []string) int {
	maxIdx := -1
	for _, kw := range keywords {
		idx := strings.LastIndex(text, kw)
		if idx > maxIdx {
			maxIdx = idx
		}
	}
	return maxIdx
}

// AnalyzePDFBytes extracts attendance records and calculated overtime from PDF file bytes.
func AnalyzePDFBytes(pdfBytes []byte) (*worktime.ParseResult, error) {
	readerAt := bytes.NewReader(pdfBytes)
	return AnalyzePDF(readerAt, int64(len(pdfBytes)))
}

// AnalyzePDF extracts attendance records and overtime from an io.ReaderAt source.
func AnalyzePDF(r io.ReaderAt, size int64) (*worktime.ParseResult, error) {
	pdfReader, err := pdf.NewReader(r, size)
	if err != nil {
		return nil, fmt.Errorf("failed to open PDF: %w", err)
	}

	plainTextReader, err := pdfReader.GetPlainText()
	if err != nil {
		return nil, fmt.Errorf("failed to read plain text from PDF: %w", err)
	}

	var buf bytes.Buffer
	if _, err := buf.ReadFrom(plainTextReader); err != nil {
		return nil, fmt.Errorf("failed to read text buffer: %w", err)
	}

	fullText := buf.String()
	return ParseText(fullText)
}

// ParseText analyzes the normalized text stream extracted from an attendance report.
func ParseText(fullText string) (*worktime.ParseResult, error) {
	summaryIndex := findLastKeywordIndex(fullText, summaryKeywords)
	relevantText := fullText
	if summaryIndex > -1 {
		relevantText = fullText[:summaryIndex]
	}

	normalizedText := reWhitespace.ReplaceAllString(relevantText, " ")

	dateMatch := reDatePattern.FindStringSubmatch(normalizedText)
	if len(dateMatch) < 4 {
		return nil, fmt.Errorf("could not find a valid date format (dd.mm.yyyy) in the document")
	}

	month, err := strconv.Atoi(dateMatch[2])
	if err != nil {
		return nil, fmt.Errorf("invalid month: %w", err)
	}
	year, err := strconv.Atoi(dateMatch[3])
	if err != nil {
		return nil, fmt.Errorf("invalid year: %w", err)
	}

	// Number of days in this month
	daysInMonth := time.Date(year, time.Month(month+1), 0, 0, 0, 0, 0, time.UTC).Day()
	recordsMap := make(map[string]*worktime.WorkDay, daysInMonth)
	otInputs := make(worktime.OTInputMap)

	for d := 1; d <= daysInMonth; d++ {
		dateKey := fmt.Sprintf("%02d.%02d.%04d", d, month, year)
		dayOfWeek := int(time.Date(year, time.Month(month), d, 0, 0, 0, 0, time.UTC).Weekday())

		status := worktime.StatusNormal
		if dayOfWeek == 0 || dayOfWeek == 6 {
			status = worktime.StatusWeekend
		}

		recordsMap[dateKey] = &worktime.WorkDay{
			Day:       d,
			Date:      dateKey,
			InOut:     worktime.StatusNormal,
			NetHours:  0,
			Status:    status,
			DayOfWeek: dayOfWeek,
		}
	}

	// Locate all date tokens to segment per day
	allDateIndices := reDatePattern.FindAllStringIndex(normalizedText, -1)
	for i, loc := range allDateIndices {
		start := loc[0]
		end := len(normalizedText)
		if i+1 < len(allDateIndices) {
			end = allDateIndices[i+1][0]
		}
		segment := normalizedText[start:end]

		segmentDateMatch := reDatePattern.FindStringSubmatch(segment)
		if len(segmentDateMatch) == 0 {
			continue
		}
		dateKey := segmentDateMatch[0]
		entry, exists := recordsMap[dateKey]
		if !exists {
			continue
		}

		for _, kw := range holidayKeywords {
			if strings.Contains(segment, kw) {
				entry.Status = worktime.StatusHoliday
				break
			}
		}

		strippedSegment := reShiftRange.ReplaceAllString(segment, "")
		timestamps := reTime.FindAllString(strippedSegment, -1)
		if len(timestamps) >= 2 {
			totalMinutes := 0
			var inOutSegments []string

			for j := 0; j < len(timestamps)-1; j += 2 {
				timeIn := timestamps[j]
				timeOut := timestamps[j+1]
				startMin, err1 := worktime.ParseTimeToMinutes(timeIn)
				endMin, err2 := worktime.ParseTimeToMinutes(timeOut)
				if err1 == nil && err2 == nil {
					normEnd := worktime.NormalizeEndTime(startMin, endMin)
					totalMinutes += normEnd - startMin
					inOutSegments = append(inOutSegments, fmt.Sprintf("%s-%s", timeIn, timeOut))
				}
			}

			if len(timestamps) == 2 && totalMinutes > 60 {
				totalMinutes -= 60 // 1 hour lunch break deduction
			}

			entry.InOut = strings.Join(inOutSegments, ", ")
			entry.NetHours = worktime.RoundHours(totalMinutes)
		}

		// Overtime (OT) extraction
		earnMatch := reEarnPattern.FindStringSubmatch(segment)
		if len(earnMatch) >= 5 {
			h1, _ := strconv.Atoi(earnMatch[1])
			m1, _ := strconv.Atoi(earnMatch[2])
			h2, _ := strconv.Atoi(earnMatch[3])
			m2, _ := strconv.Atoi(earnMatch[4])

			remarkIn := h1*60 + m1
			remarkOut := worktime.NormalizeEndTime(remarkIn, h2*60+m2)

			textWithoutEarn := reEarnPattern.ReplaceAllString(segment, "")
			shiftMatch := reShiftRange.FindStringSubmatch(textWithoutEarn)

			hasShift := false
			shiftStart := 0
			shiftEnd := 0
			textForActual := textWithoutEarn

			if len(shiftMatch) >= 5 {
				hasShift = true
				sH1, _ := strconv.Atoi(shiftMatch[1])
				sM1, _ := strconv.Atoi(shiftMatch[2])
				sH2, _ := strconv.Atoi(shiftMatch[3])
				sM2, _ := strconv.Atoi(shiftMatch[4])
				shiftStart = sH1*60 + sM1
				shiftEnd = worktime.NormalizeEndTime(shiftStart, sH2*60+sM2)
				textForActual = strings.Replace(textForActual, shiftMatch[0], "", 1)
			}

			actualTimes := reTime.FindAllString(textForActual, -1)
			actualIn := remarkIn
			actualOut := remarkOut

			if len(actualTimes) >= 2 {
				if tIn, err := worktime.ParseTimeToMinutes(actualTimes[0]); err == nil {
					actualIn = tIn
				}
				if tOut, err := worktime.ParseTimeToMinutes(actualTimes[len(actualTimes)-1]); err == nil {
					actualOut = worktime.NormalizeEndTime(actualIn, tOut)
				}
			}

			workStart := max(actualIn, remarkIn)
			workEnd := min(actualOut, remarkOut)

			var ot worktime.OTData
			if hasShift {
				ot = worktime.CalculateOTWithShift(entry.Status, workStart, workEnd, worktime.ShiftWindow{
					Start: shiftStart,
					End:   shiftEnd,
				})
			} else {
				ot = worktime.CalculateOTWithoutShift(entry.Status, workStart, workEnd)
			}

			if ot.O10 > 0 || ot.O15 > 0 || ot.O20 > 0 || ot.O30 > 0 {
				otInputs[entry.Day] = ot
			}
		}
	}

	results := make([]worktime.WorkDay, 0, daysInMonth)
	for d := 1; d <= daysInMonth; d++ {
		dateKey := fmt.Sprintf("%02d.%02d.%04d", d, month, year)
		if entry, exists := recordsMap[dateKey]; exists {
			results = append(results, *entry)
		}
	}

	return &worktime.ParseResult{
		Results:  results,
		MonthIdx: month - 1, // 0-indexed to match JS Date.getMonth()
		Year:     year,
		OTInputs: otInputs,
	}, nil
}
