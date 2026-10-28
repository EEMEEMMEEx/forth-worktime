package worktime

// CalculatePayroll computes the wage payout based on monthly salary and base hours.
func CalculatePayroll(otInputs OTInputMap, settings PaySettings) PayResult {
	result := PayResult{}
	if settings.BaseHours > 0 {
		result.EffectiveRate = settings.MonthlySalary / settings.BaseHours
	}

	var totalO10, totalO15, totalO20, totalO30 float64
	for _, ot := range otInputs {
		totalO10 += ot.O10
		totalO15 += ot.O15
		totalO20 += ot.O20
		totalO30 += ot.O30
	}

	result.P10 = totalO10 * 1.0 * result.EffectiveRate
	result.P15 = totalO15 * 1.5 * result.EffectiveRate
	result.P20 = totalO20 * 2.0 * result.EffectiveRate
	result.P30 = totalO30 * 3.0 * result.EffectiveRate
	result.TotalPay = result.P10 + result.P15 + result.P20 + result.P30

	return result
}
