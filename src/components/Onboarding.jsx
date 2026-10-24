import React, { useState } from "react";
import { Leaf } from "lucide-react";
import { calculateBMR, calculateTDEE } from "../lib/calculations.js";

const GOALS = { lose: -400, maintain: 0, gain: 300 };

export default function Onboarding({ onSave }) {
  const [form, setForm] = useState({
    sex: "", age: "", heightCm: "", weightKg: "",
    activityLevel: "", goal: "", calorieTarget: "", proteinTarget: ""
  });
  const change = (k, v) => setForm((o) => ({ ...o, [k]: v }));

  let suggestion = null;
  if (form.sex && form.age && form.heightCm && form.weightKg && form.activityLevel && form.goal) {
    const p = {
      sex: form.sex, age: Number(form.age), heightCm: Number(form.heightCm),
      weightKg: Number(form.weightKg), activityLevel: form.activityLevel
    };
    const tdee = calculateTDEE(calculateBMR(p), p.activityLevel);
    suggestion = {
      calories: Math.max(1200, Math.round((tdee + GOALS[form.goal]) / 10) * 10),
      protein: Math.round(p.weightKg * 1.6)
    };
  }

  function submit(e) {
    e.preventDefault();
    if (!suggestion) return;
    onSave({
      sex: form.sex,
      age: Number(form.age),
      heightCm: Number(form.heightCm),
      weightKg: Number(form.weightKg),
      activityLevel: form.activityLevel,
      goal: form.goal,
      calorieTarget: Number(form.calorieTarget || suggestion.calories),
      proteinTarget: Number(form.proteinTarget || suggestion.protein)
    });
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 20 }}>
      <section className="panel settings-panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow"><Leaf size={13} /> WELCOME</div>
            <h2>Let's set up your profile</h2>
            <p>We need a few details to calculate your BMR, TDEE and daily targets.</p>
          </div>
        </div>
        <form onSubmit={submit} className="settings-form">
          <div className="settings-grid">
            <label className="field-label">Sex used for BMR
              <select value={form.sex} onChange={(e) => change("sex", e.target.value)} required>
                <option value="" disabled>Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label className="field-label">Age (years)
              <input type="number" min="13" max="110" value={form.age} onChange={(e) => change("age", e.target.value)} required />
            </label>
            <label className="field-label">Height (cm)
              <input type="number" min="100" max="240" value={form.heightCm} onChange={(e) => change("heightCm", e.target.value)} required />
            </label>
            <label className="field-label">Weight (kg)
              <input type="number" min="25" max="350" step="0.1" value={form.weightKg} onChange={(e) => change("weightKg", e.target.value)} required />
            </label>
            <label className="field-label">Activity level
              <select value={form.activityLevel} onChange={(e) => change("activityLevel", e.target.value)} required>
                <option value="" disabled>Select…</option>
                <option value="sedentary">Sedentary</option>
                <option value="light">Lightly active</option>
                <option value="moderate">Moderately active</option>
                <option value="active">Very active</option>
                <option value="veryActive">Extremely active</option>
              </select>
            </label>
            <label className="field-label">Your goal
              <select value={form.goal} onChange={(e) => change("goal", e.target.value)} required>
                <option value="" disabled>Select…</option>
                <option value="lose">Lose weight</option>
                <option value="maintain">Maintain weight</option>
                <option value="gain">Gain weight</option>
              </select>
            </label>
            <label className="field-label">Daily calorie target (optional)
              <input type="number" min="800" max="6000" placeholder={suggestion ? `Suggested: ${suggestion.calories}` : "Fill the fields above"} value={form.calorieTarget} onChange={(e) => change("calorieTarget", e.target.value)} />
            </label>
            <label className="field-label">Protein target in g (optional)
              <input type="number" min="0" max="400" placeholder={suggestion ? `Suggested: ${suggestion.protein}` : "Fill the fields above"} value={form.proteinTarget} onChange={(e) => change("proteinTarget", e.target.value)} />
            </label>
          </div>
          <button className="primary-button" type="submit">Save and continue</button>
        </form>
        <p className="disclaimer">Leave the targets empty to use the suggested values. You can change everything later in Profile.</p>
      </section>
    </div>
  );
}