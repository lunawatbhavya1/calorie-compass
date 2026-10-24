import { supabase } from "./supabase.js";

const KEYS = {
  entries: "calorie-compass:entries:v1",
  profile: "calorie-compass:profile:v1"
};

export const defaultProfile = {
  sex: "male",
  age: 20,
  heightCm: 163,
  weightKg: 66.5,
  activityLevel: "moderate",
  calorieTarget: 1800,
  proteinTarget: 100
};

export function loadEntries() {
  try { return JSON.parse(localStorage.getItem(KEYS.entries) || "[]"); }
  catch { return []; }
}
export function saveEntries(entries) {
  localStorage.setItem(KEYS.entries, JSON.stringify(entries));
}
export function loadProfile() {
  try { return { ...defaultProfile, ...JSON.parse(localStorage.getItem(KEYS.profile) || "{}") }; }
  catch { return { ...defaultProfile }; }
}
export function saveProfile(profile) {
  localStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

function throwIfError(result) {
  if (result.error) throw result.error;
  return result.data;
}

function entryFromFoodRow(row) {
  const data = row.data && typeof row.data === "object" ? row.data : {};
  return {
    ...data,
    id: String(row.id),
    description: data.description || row.food_name || "Food entry",
    calories: Number(data.calories ?? row.calories ?? 0),
    type: data.type || "food",
    meal: data.meal || "Meal",
    date: data.date || row.entry_date || new Date().toISOString().slice(0, 10),
    createdAt: Number(data.createdAt ?? row.created_at_ms ?? Date.now()),
    protein: Number(data.protein ?? row.protein ?? 0),
    carbs: Number(data.carbs ?? row.carbs ?? 0),
    fat: Number(data.fat ?? row.fat ?? 0)
  };
}

function entryFromActivityRow(row) {
  return {
    id: String(row.id),
    description: row.activity_name,
    calories: Number(row.calories_burned || 0),
    type: "activity",
    meal: "Activity",
    date: row.entry_date,
    createdAt: Number(row.created_at_ms || Date.now())
  };
}

export async function loadCloudData(user) {
  const [profileResult, foodResult, activityResult, savedFoodsResult, weightResult] = await Promise.all([
    supabase.from("profiles").select("settings,email,age,height_cm,weight_kg,activity_level,calorie_target,protein_target").eq("id", user.id).maybeSingle(),
    supabase.from("food_entries").select("id,user_id,food_name,calories,entry_date,created_at_ms,data,quantity_g,protein,carbs,fat").eq("user_id", user.id),
    supabase.from("activity_entries").select("id,user_id,activity_name,calories_burned,entry_date").eq("user_id", user.id),
    supabase.from("foods").select("id,name,calories_per_100,protein_per_100,carbs_per_100,fat_per_100").eq("user_id", user.id),
    supabase.from("weight_logs").select("id,weight_kg,log_date").eq("user_id", user.id).order("log_date", { ascending: false }).limit(1)
  ]);

  const profileRow = throwIfError(profileResult);
  const foodRows = throwIfError(foodResult) || [];
  const activityRows = throwIfError(activityResult) || [];
  // These reads also verify that the supporting tables and their RLS policies work.
  throwIfError(savedFoodsResult);
  const latestWeight = (throwIfError(weightResult) || [])[0];

  const entries = [...foodRows.map(entryFromFoodRow), ...activityRows.map(entryFromActivityRow)]
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  let profile = { ...defaultProfile, ...(profileRow?.settings || {}) };
  if (profileRow && profileRow.weight_kg != null && !profileRow.settings?.weightKg) profile.weightKg = Number(profileRow.weight_kg);
  if (latestWeight && !profileRow?.settings?.weightKg) profile.weightKg = Number(latestWeight.weight_kg);

  // New user: no saved settings yet, so show the onboarding form with clean defaults.
  const needsOnboarding = !profileRow?.settings || Object.keys(profileRow.settings).length === 0;
  if (needsOnboarding) profile = { ...defaultProfile };

  saveEntries(entries);
  saveProfile(profile);
  return { entries, profile, needsOnboarding };
}

export async function saveCloudEntries(userId, entries) {
  const foodEntries = entries.filter((entry) => entry.type !== "activity");
  const activities = entries.filter((entry) => entry.type === "activity");

  if (foodEntries.length) {
    const rows = foodEntries.map((entry) => ({
      id: String(entry.id),
      user_id: userId,
      food_name: entry.description || "Food entry",
      calories: Number(entry.calories || 0),
      entry_date: entry.date,
      created_at_ms: Number(entry.createdAt || Date.now()),
      quantity_g: Number(entry.quantityG || 100),
      protein: Number(entry.protein || 0),
      carbs: Number(entry.carbs || 0),
      fat: Number(entry.fat || 0),
      data: entry
    }));
    throwIfError(await supabase.from("food_entries").upsert(rows, { onConflict: "id" }));

    // Keep a personal reusable food catalog for food entries.
    const uniqueNames = [...new Map(foodEntries.map((e) => [(e.description || "").trim().toLowerCase(), e])).values()]
      .filter((e) => (e.description || "").trim());
    for (const entry of uniqueNames) {
      const name = entry.description.trim();
      const found = throwIfError(await supabase.from("foods").select("id").eq("user_id", userId).ilike("name", name).limit(1));
      if (!found?.length) {
        throwIfError(await supabase.from("foods").insert({
          user_id: userId,
          name,
          calories_per_100: Number(entry.calories || 0),
          protein_per_100: Number(entry.protein || 0),
          carbs_per_100: Number(entry.carbs || 0),
          fat_per_100: Number(entry.fat || 0)
        }));
      }
    }
  }

  if (activities.length) {
    const rows = activities.map((entry) => ({
      id: String(entry.id),
      user_id: userId,
      activity_name: entry.description || "Activity",
      calories_burned: Number(entry.calories || 0),
      entry_date: entry.date
    }));
    throwIfError(await supabase.from("activity_entries").upsert(rows, { onConflict: "id" }));
  }

  // Remove deleted records from both cloud tables so local and cloud state match.
  const keepFoodIds = foodEntries.map((e) => String(e.id));
  const keepActivityIds = activities.map((e) => String(e.id));
  let foodDelete = supabase.from("food_entries").delete().eq("user_id", userId);
  if (keepFoodIds.length) foodDelete = foodDelete.not("id", "in", `(${keepFoodIds.join(",")})`);
  throwIfError(await foodDelete);
  let activityDelete = supabase.from("activity_entries").delete().eq("user_id", userId);
  if (keepActivityIds.length) activityDelete = activityDelete.not("id", "in", `(${keepActivityIds.join(",")})`);
  throwIfError(await activityDelete);
}

export async function deleteCloudEntry(userId, entryId) {
  const [foodResult, activityResult] = await Promise.all([
    supabase.from("food_entries").delete().eq("user_id", userId).eq("id", String(entryId)),
    supabase.from("activity_entries").delete().eq("user_id", userId).eq("id", String(entryId))
  ]);
  throwIfError(foodResult);
  throwIfError(activityResult);
}

export async function saveCloudProfile(user, profile) {
  const { data: oldRow, error: readError } = await supabase.from("profiles").select("weight_kg,settings").eq("id", user.id).maybeSingle();
  if (readError) throw readError;
  throwIfError(await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email || null,
    age: Number(profile.age),
    height_cm: Number(profile.heightCm),
    weight_kg: Number(profile.weightKg),
    activity_level: profile.activityLevel,
    calorie_target: Number(profile.calorieTarget),
    protein_target: Number(profile.proteinTarget),
    settings: profile
  }, { onConflict: "id" }));

  if (Number(oldRow?.weight_kg) !== Number(profile.weightKg)) {
    throwIfError(await supabase.from("weight_logs").insert({
      user_id: user.id,
      weight_kg: Number(profile.weightKg),
      log_date: new Date().toISOString().slice(0, 10)
    }));
  }
}
