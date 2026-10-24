// Pure calculations live here so nutrition logic can be updated independently of UI.
export function calculateBMR({ sex = "male", age = 20, heightCm = 163, weightKg = 66.5 }) {
  const base = 10 * Number(weightKg) + 6.25 * Number(heightCm) - 5 * Number(age);
  return Math.round(base + (sex === "male" ? 5 : -161));
}

export const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9
};

export function calculateTDEE(bmr, activityLevel = "light") {
  return Math.round(Number(bmr) * (activityMultipliers[activityLevel] ?? 1.2));
}

export function getDailySummary(entries, date, bmr, tdee) {
  const todays = entries.filter((entry) => entry.date === date);
  const intake = todays.filter((e) => e.type === "food").reduce((sum, e) => sum + Number(e.calories || 0), 0);
  const activity = todays.filter((e) => e.type === "activity").reduce((sum, e) => sum + Number(e.calories || 0), 0);
  // TDEE already reflects the selected activity-level multiplier. Keep manually logged
  // activity visible as its own metric rather than adding it again and double-counting.
  const estimatedTDEE = Number(tdee || 0);
  return { intake, activity, bmr: Number(bmr || 0), tdee: estimatedTDEE, balance: estimatedTDEE - intake };
}

export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function lastNDays(n = 7, entries = [], profile = {}) {
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  return Array.from({ length: n }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (n - 1 - index));
    const key = dateKey(date);
    const summary = getDailySummary(entries, key, bmr, tdee);
    return {
      date: key,
      day: date.toLocaleDateString("en-IN", { weekday: "short" }),
      ...summary,
      deficit: summary.balance
    };
  });
}
