// Transparent starter estimates only. Replace/extend this module or connect a secure AI endpoint later.
const foods = [
  { terms: ["milk"], caloriesPerUnit: 60, unit: "100 ml", hint: "Regular milk varies with fat content." },
  { terms: ["roti", "chapati"], caloriesPerUnit: 110, unit: "piece", hint: "Assumes a medium roti without ghee." },
  { terms: ["khakhra"], caloriesPerUnit: 80, unit: "piece", hint: "Brand and size can change the value." },
  { terms: ["paneer paratha"], caloriesPerUnit: 400, unit: "piece", hint: "Oil/ghee and size can change the value." },
  { terms: ["rabri"], caloriesPerUnit: 250, unit: "100 g", hint: "Richness and sugar content vary." },
  { terms: ["kulche", "chole kulche", "bheeg kulche", "bhege kulche"], caloriesPerUnit: 600, unit: "plate", hint: "Street-food estimate; portion and oil vary." },
  { terms: ["paneer"], caloriesPerUnit: 265, unit: "100 g", hint: "Paneer calories depend on fat content." },
  { terms: ["banana"], caloriesPerUnit: 105, unit: "piece", hint: "Medium banana." },
  { terms: ["apple"], caloriesPerUnit: 95, unit: "piece", hint: "Medium apple." }
];

export function estimateFoodCalories(description) {
  const text = String(description || "").toLowerCase();
  const match = foods.find((food) => food.terms.some((term) => text.includes(term)));
  if (!match) return null;
  const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*(ml|g|grams?|pieces?|pcs|roti|paratha|plates?)/i);
  let quantity = 1;
  if (amountMatch) {
    const amount = Number(amountMatch[1]);
    const unit = amountMatch[2].toLowerCase();
    if (match.unit === "100 ml" && unit === "ml") quantity = amount / 100;
    else if (match.unit === "100 g" && (unit === "g" || unit.startsWith("gram"))) quantity = amount / 100;
    else quantity = amount;
  } else if (match.unit === "100 ml" || match.unit === "100 g") {
    quantity = 1;
  }
  return {
    calories: Math.round(match.caloriesPerUnit * quantity),
    note: `Quick estimate, not AI-verified. ${match.hint}`
  };
}
