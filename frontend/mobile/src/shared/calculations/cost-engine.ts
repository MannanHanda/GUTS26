import {
  AccommodationListing,
  BankAccount,
  DecisionCombination,
  StudentProfile,
  TradeOffAnalysis,
  TransportOption,
  TrueCostSummary,
} from '../types';

export function calculateTrueLivingCost(
  accommodation: AccommodationListing,
  transport: TransportOption,
  profile: StudentProfile
): TrueCostSummary {
  const weeklyBudget =
    profile.budgetPeriod === 'monthly'
      ? Math.round(profile.totalBudget / 4.333)
      : profile.totalBudget;

  const weeklyAccommodationRent = accommodation.weeklyRent;
  const weeklyEstimatedBills = accommodation.billsIncluded
    ? 0
    : accommodation.estimatedBillsWeekly;

  // Determine transit cost: check if profile journeys are cheaper via pay-as-you-go or weekly pass
  const payAsYouGoWeekly = profile.weeklyJourneys * transport.singleFareCost;
  const weeklyCommuteCost =
    transport.costWeekly > 0
      ? Math.min(transport.costWeekly, payAsYouGoWeekly)
      : 0;

  const weeklyNetLivingCost =
    weeklyAccommodationRent + weeklyEstimatedBills + weeklyCommuteCost;
  const monthlyNetLivingCost = Math.round(weeklyNetLivingCost * 4.333);
  const semesterTotalCost = Math.round(weeklyNetLivingCost * 39);

  // Upfront cash required before moving in:
  // Deposit + first 4 weeks rent advance + upfront pass
  const advanceRent = weeklyAccommodationRent * 4;
  const totalUpfrontCost =
    accommodation.deposit +
    accommodation.adminOrHoldingFee +
    advanceRent +
    (transport.costMonthly > 0 ? transport.costMonthly : weeklyCommuteCost * 4);

  const budgetDifferenceWeekly = weeklyBudget - weeklyNetLivingCost;
  const isUnderBudget = budgetDifferenceWeekly >= 0;

  const weeklyCommutingHours = Number(
    ((profile.weeklyJourneys * transport.averageTripMinutes) / 60).toFixed(1)
  );
  const annualCommuteHours = Math.round(weeklyCommutingHours * 30); // ~30 teaching weeks

  // Healthcare calculations (NHS Scotland vs IHS & England)
  const isIntl = profile.isInternational || profile.studentStatus === 'international';
  const age = profile.studentAge ?? 20;
  const courseYears = profile.courseYears ?? (isIntl ? 3 : 0);

  const ihsWeekly = isIntl ? Number((776 / 52).toFixed(2)) : 0;
  const ihsUpfrontCost = isIntl ? 776 * (courseYears > 0 ? courseYears : 1) : 0;
  const weeklyHealthcareEstimate = Number((2.5 + ihsWeekly).toFixed(2));
  const monthlyHealthcareEstimate = Math.round(weeklyHealthcareEstimate * 4.333);

  const dentalSaving = age < 26 ? 140 : 0;
  const prescriptionSaving = profile.hasPrescriptions ? 118.8 : 29.7;
  const eyeExamSaving = 35;
  const annualHealthcareSavings = Math.round(dentalSaving + prescriptionSaving + eyeExamSaving);

  return {
    weeklyAccommodationRent,
    weeklyEstimatedBills,
    weeklyCommuteCost,
    weeklyNetLivingCost,
    monthlyNetLivingCost,
    semesterTotalCost,
    totalUpfrontCost,
    weeklyBudget,
    budgetDifferenceWeekly,
    isUnderBudget,
    weeklyCommutingHours,
    annualCommuteHours,
    weeklyHealthcareEstimate,
    monthlyHealthcareEstimate,
    annualHealthcareSavings,
    ihsUpfrontCost,
  };
}

export function generateTradeOffs(
  accommodation: AccommodationListing,
  transport: TransportOption,
  bank: BankAccount,
  summary: TrueCostSummary,
  profile: StudentProfile
): TradeOffAnalysis[] {
  const tradeoffs: TradeOffAnalysis[] = [];

  // Trade-off 1: Location & Commute
  if (transport.averageTripMinutes > 25) {
    tradeoffs.push({
      title: 'Commute vs. Rent Trade-off',
      advantage: `Lower headline rent (£${accommodation.weeklyRent}/wk) outside prime campus area.`,
      disadvantage: `Requires ${summary.weeklyCommutingHours} hrs/week travel time (${transport.averageTripMinutes} min each way).`,
      hiddenCostFlag: `Transit pass adds +£${summary.weeklyCommuteCost}/wk (£${Math.round(summary.weeklyCommuteCost * 4.333)}/mo) to real cost.`,
      financialImpactWeekly: -summary.weeklyCommuteCost,
    });
  } else {
    tradeoffs.push({
      title: 'Proximity Premium',
      advantage: `Quick walk or short ride (${transport.averageTripMinutes} mins). Zero or minimal transit friction.`,
      disadvantage: `Slightly higher rental cost per square foot in popular student district.`,
      financialImpactWeekly: summary.weeklyCommuteCost === 0 ? 0 : -summary.weeklyCommuteCost,
    });
  }

  // Trade-off 2: Bills package
  if (accommodation.billsIncluded) {
    tradeoffs.push({
      title: 'All-inclusive Certainty',
      advantage: 'Heating, electricity, water & gigabit Wi-Fi included. Zero winter billing spikes.',
      disadvantage: 'Cannot lower utility costs by conserving energy individually.',
      financialImpactWeekly: 0,
    });
  } else {
    tradeoffs.push({
      title: 'Variable Energy & Utility Bills',
      advantage: 'Base rent appears cheaper on portal listings.',
      disadvantage: 'Must set up joint utility accounts with flatmates and manage energy price caps.',
      hiddenCostFlag: `Estimated +£${accommodation.estimatedBillsWeekly}/wk hidden utility liability.`,
      financialImpactWeekly: -accommodation.estimatedBillsWeekly,
    });
  }

  // Trade-off 3: Upfront Liquidity
  if (accommodation.deposit > 600) {
    tradeoffs.push({
      title: 'High Upfront Deposit Lockup',
      advantage: 'High-spec private PBSA or managed property with concierge security.',
      disadvantage: `Requires £${accommodation.deposit} security deposit + advance rent before key handover.`,
      hiddenCostFlag: `Total move-in cash needed: £${summary.totalUpfrontCost}.`,
      financialImpactWeekly: 0,
    });
  }

  // Trade-off 4: Banking value matching
  if (profile.isInternational && bank.internationalTransferFee === 0) {
    tradeoffs.push({
      title: 'International Fee Protection',
      advantage: `${bank.bankName} charges £0 on incoming international tuition/living wire transfers.`,
      disadvantage: 'Lower introductory overdraft limit for non-UK permanent residents.',
      financialImpactWeekly: 5,
    });
  } else if (bank.perks.some((p) => p.toLowerCase().includes('railcard'))) {
    tradeoffs.push({
      title: 'Rail & Travel Perk Bonus',
      advantage: 'Free 4-Year 16-25 Railcard cuts UK train fares by 1/3 (~£199 total value).',
      disadvantage: 'Requires minimum £500 deposit each semester to maintain active perk status.',
      financialImpactWeekly: 4,
    });
  }

  // Trade-off 5: Healthcare Perks & Visa Surcharge
  if (summary.ihsUpfrontCost > 0) {
    tradeoffs.push({
      title: 'NHS Visa Health Surcharge',
      advantage: 'Full access to NHS Scotland hospital care, emergency triage, and GP consultations without per-visit bills.',
      disadvantage: `Mandatory £776/year IHS payment (£${summary.ihsUpfrontCost} total upfront for course).`,
      hiddenCostFlag: `Adds equivalent of +£${summary.weeklyHealthcareEstimate}/wk in visa healthcare commitments.`,
      financialImpactWeekly: -Number((776 / 52).toFixed(1)),
    });
  } else if (summary.annualHealthcareSavings > 0) {
    tradeoffs.push({
      title: 'Scotland Healthcare Advantage',
      advantage: `Free NHS prescriptions & free dental checkups under 26 save ~£${summary.annualHealthcareSavings}/year vs England.`,
      disadvantage: 'Must register with campus GP (Fraser Building) early in September to avoid registration backlogs.',
      hiddenCostFlag: `Saves ~£${Math.round(summary.annualHealthcareSavings / 52)}/wk compared to studying elsewhere in the UK.`,
      financialImpactWeekly: Math.round(summary.annualHealthcareSavings / 52),
    });
  }

  return tradeoffs;
}

export function synthesizeDecisionCombinations(
  accommodations: AccommodationListing[],
  transports: TransportOption[],
  banks: BankAccount[],
  profile: StudentProfile
): DecisionCombination[] {
  const combinations: DecisionCombination[] = [];

  accommodations.forEach((acc, accIdx) => {
    // Pick the most logical transport for this accommodation area
    const matchingTransports = transports.filter((t) => {
      if (acc.walkingTimeMins <= 15) return t.mode === 'walk';
      if (acc.area.toLowerCase().includes('west end') || acc.area.toLowerCase().includes('partick')) {
        return t.mode === 'subway' || t.mode === 'walk';
      }
      if (acc.area.toLowerCase().includes('southside') || acc.area.toLowerCase().includes('dennistoun')) {
        return t.mode === 'bus' || t.mode === 'train';
      }
      return true;
    });

    const chosenTransport = matchingTransports[0] || transports[0];

    // Pick best bank based on profile
    const chosenBank = profile.isInternational
      ? banks.find((b) => b.internationalTransferFee === 0) || banks[0]
      : banks.find((b) => b.perks.some((p) => p.includes('Railcard'))) || banks[0];

    const costSummary = calculateTrueLivingCost(acc, chosenTransport, profile);
    const tradeoffs = generateTradeOffs(acc, chosenTransport, chosenBank, costSummary, profile);

    // Scoring algorithm (0-100)
    let score = 70;
    // Budget alignment (up to +20 or -30)
    if (costSummary.budgetDifferenceWeekly >= 0) {
      score += Math.min(20, Math.floor(costSummary.budgetDifferenceWeekly / 5));
    } else {
      score -= Math.min(35, Math.abs(Math.floor(costSummary.budgetDifferenceWeekly / 3)));
    }

    // Commute preference matching
    if (profile.tradeoffPreference === 'shortest_commute') {
      if (chosenTransport.averageTripMinutes <= 15) score += 15;
      else score -= Math.min(20, (chosenTransport.averageTripMinutes - 15) * 1.2);
    } else if (profile.tradeoffPreference === 'lowest_cost') {
      if (costSummary.weeklyNetLivingCost < profile.totalBudget * 0.8) score += 15;
    }

    // Bills certainty bonus
    if (acc.billsIncluded) score += 5;

    // Upfront affordability
    if (costSummary.totalUpfrontCost < 1000) score += 5;

    score = Math.max(25, Math.min(98, Math.round(score)));

    combinations.push({
      id: `combo-${acc.id}-${chosenTransport.id}`,
      rank: 0,
      isAiRecommended: false,
      score,
      recommendationReason: '',
      accommodation: acc,
      transport: chosenTransport,
      banking: chosenBank,
      costSummary,
      tradeoffs,
    });
  });

  // Sort by score descending
  combinations.sort((a, b) => b.score - a.score);

  // Mark top 1 as AI Recommended
  if (combinations.length > 0) {
    combinations[0].isAiRecommended = true;
    combinations[0].aiRecommendationBadge = 'Optimal Budget & Commute Balance';
    combinations[0].recommendationReason = `Provides the highest net value: keeps you £${Math.abs(
      combinations[0].costSummary.budgetDifferenceWeekly
    )}/wk ${
      combinations[0].costSummary.budgetDifferenceWeekly >= 0 ? 'under budget' : 'close to budget'
    } with a comfortable ${combinations[0].transport.averageTripMinutes}-minute commute and transparent all-in costs.`;
  }

  combinations.forEach((c, idx) => {
    c.rank = idx + 1;
  });

  return combinations;
}
