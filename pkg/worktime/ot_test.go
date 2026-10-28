package worktime_test

import (
	"testing"

	"forth-worktime/pkg/worktime"
)

func TestParseTimeToMinutesAndNormalizeEndTime(t *testing.T) {
	start, err := worktime.ParseTimeToMinutes("22:00")
	if err != nil {
		t.Fatalf("unexpected error parsing start time: %v", err)
	}
	rawEnd, err := worktime.ParseTimeToMinutes("02:00")
	if err != nil {
		t.Fatalf("unexpected error parsing end time: %v", err)
	}
	end := worktime.NormalizeEndTime(start, rawEnd)

	if start != 1320 {
		t.Errorf("expected start=1320, got %d", start)
	}
	if end != 1560 {
		t.Errorf("expected end=1560, got %d", end)
	}
}

func TestRoundHours(t *testing.T) {
	if got := worktime.RoundHours(75); got != 1.25 {
		t.Errorf("expected RoundHours(75)=1.25, got %f", got)
	}
	if got := worktime.RoundHours(0); got != 0 {
		t.Errorf("expected RoundHours(0)=0, got %f", got)
	}
}

func TestOverlapMinutes(t *testing.T) {
	if got := worktime.OverlapMinutes(18*60, 21*60, 20*60, 20*60+30); got != 30 {
		t.Errorf("expected overlap=30, got %d", got)
	}
	if got := worktime.OverlapMinutes(8*60, 9*60, 20*60, 20*60+30); got != 0 {
		t.Errorf("expected overlap=0, got %d", got)
	}
}

func TestCalculateOTWithShift_Weekday(t *testing.T) {
	shift := worktime.ShiftWindow{Start: 8 * 60, End: 17 * 60}
	ot := worktime.CalculateOTWithShift(worktime.StatusNormal, 8*60, 21*60, shift)

	expected := worktime.OTData{O10: 0, O15: 3.5, O20: 0, O30: 0}
	if ot != expected {
		t.Errorf("expected %+v, got %+v", expected, ot)
	}
}

func TestCalculateOTWithShift_Holiday(t *testing.T) {
	shift := worktime.ShiftWindow{Start: 8 * 60, End: 17 * 60}
	ot := worktime.CalculateOTWithShift(worktime.StatusHoliday, 8*60, 21*60, shift)

	expected := worktime.OTData{O10: 8, O15: 0, O20: 0, O30: 3.5}
	if ot != expected {
		t.Errorf("expected %+v, got %+v", expected, ot)
	}
}

func TestCalculateOTWithoutShift_Weekday(t *testing.T) {
	ot := worktime.CalculateOTWithoutShift(worktime.StatusNormal, 9*60, 21*60)

	expected := worktime.OTData{O10: 0, O15: 2.5, O20: 0, O30: 0}
	if ot != expected {
		t.Errorf("expected %+v, got %+v", expected, ot)
	}
}

func TestCalculatePayroll(t *testing.T) {
	inputs := worktime.OTInputMap{
		1: {O10: 8, O15: 2, O20: 0, O30: 1},
	}
	settings := worktime.PaySettings{
		MonthlySalary: 24000,
		BaseHours:     240, // 100 THB/hr
	}
	res := worktime.CalculatePayroll(inputs, settings)

	if res.EffectiveRate != 100 {
		t.Errorf("expected effectiveRate=100, got %f", res.EffectiveRate)
	}
	if res.P10 != 800 {
		t.Errorf("expected P10=800, got %f", res.P10)
	}
	if res.P15 != 300 {
		t.Errorf("expected P15=300, got %f", res.P15)
	}
	if res.P30 != 300 {
		t.Errorf("expected P30=300, got %f", res.P30)
	}
	if res.TotalPay != 1400 {
		t.Errorf("expected TotalPay=1400, got %f", res.TotalPay)
	}
}
