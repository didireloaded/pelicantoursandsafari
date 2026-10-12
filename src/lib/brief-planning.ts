type BriefPlanning = {
  start: string;
  end: string;
  adults: string;
  ages: string[];
  days: string;
  budget: string;
};

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function wholeNumber(value: string, min: number, max: number) {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
}

// Dates, duration, budget and child ages may be left open for a conversation.
// Validate through the destination step so progress navigation cannot skip checks.
export function validateBriefPlanning(input: BriefPlanning, throughStep = 2): { step: number; message: string } | null {
  if (throughStep >= 1) {
    if ((input.start && !validDate(input.start)) || (input.end && !validDate(input.end))) return { step: 1, message: "Choose valid arrival and departure dates, or leave them blank to discuss." };
    if (input.start && input.end && input.end < input.start) return { step: 1, message: "Departure must be on or after arrival." };
    if (!wholeNumber(input.adults, 1, 100)) return { step: 1, message: "Enter a whole number of adults between 1 and 100." };
    if (input.ages.length > 10 || input.ages.some((age) => age !== "" && !wholeNumber(age, 0, 17))) return { step: 1, message: "Child ages must be whole numbers from 0 to 17, or left blank to confirm later. Up to 10 children can be included." };
    if (input.days !== "" && !wholeNumber(input.days, 1, 365)) return { step: 1, message: "Enter a trip length from 1 to 365 whole days, or leave it blank to discuss." };
  }
  if (throughStep >= 2 && input.budget !== "" && !wholeNumber(input.budget, 1, 10000000)) return { step: 2, message: "Enter a whole-number NAD budget per person from 1 to 10,000,000, or leave it blank to discuss." };
  return null;
}
