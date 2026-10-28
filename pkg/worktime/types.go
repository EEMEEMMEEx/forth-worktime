package worktime

// Status represents the work day status category.
type Status = string

const (
	StatusWeekend        Status = "Weekend"
	StatusHoliday        Status = "Holiday"
	StatusNormal         Status = "–"     // Unicode EN DASH (U+2013)
	StatusMojibakeNormal Status = "â€“" // Mojibake variant of EN DASH
)

// WorkDay represents a daily attendance record extracted from the attendance report.
type WorkDay struct {
	Day       int     `json:"day"`
	Date      string  `json:"date"`
	InOut     string  `json:"inOut"`
	NetHours  float64 `json:"netHours"`
	Status    Status  `json:"status"`
	DayOfWeek int     `json:"dayOfWeek"` // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

// OTData represents overtime hours by multiplier bracket.
type OTData struct {
	O10 float64 `json:"o10"` // 1.0x (Holiday core hours)
	O15 float64 `json:"o15"` // 1.5x (Weekday overtime)
	O20 float64 `json:"o20"` // 2.0x (Holiday overtime or custom)
	O30 float64 `json:"o30"` // 3.0x (Holiday night/extended overtime)
}

// OTInputMap maps Day of month (1..31) to OTData.
type OTInputMap = map[int]OTData

// PaySettings stores user configuration for payroll calculations.
type PaySettings struct {
	MonthlySalary float64 `json:"monthlySalary"`
	BaseHours     float64 `json:"baseHours"` // Default 240 (or 208)
}

// ShiftWindow defines expected shift start and end times in minutes from midnight (00:00).
type ShiftWindow struct {
	Start int `json:"start"`
	End   int `json:"end"`
}

// ParseResult holds the parsed attendance data and auto-calculated OT inputs.
type ParseResult struct {
	Results  []WorkDay  `json:"results"`
	MonthIdx int        `json:"monthIdx"` // 0-indexed: 0 = January, 11 = December
	Year     int        `json:"year"`
	OTInputs OTInputMap `json:"otInputs"`
}

// PayResult represents computed overtime wages and breakdown.
type PayResult struct {
	EffectiveRate float64 `json:"effectiveRate"`
	P10           float64 `json:"p10"`
	P15           float64 `json:"p15"`
	P20           float64 `json:"p20"`
	P30           float64 `json:"p30"`
	TotalPay      float64 `json:"totalPay"`
}
