import React, { useEffect, useState } from "react";
import { Save, UserRound, Activity, Target } from "lucide-react";

export default function ProfileSettings({ profile, onSave, bmr, tdee }) {
  const [form, setForm] = useState(profile);
  useEffect(() => setForm(profile), [profile]);
  function change(key, value) { setForm((old) => ({ ...old, [key]: value })); }
  function submit(e) {
    e.preventDefault();
    onSave({
      ...form,
      age: Number(form.age), heightCm: Number(form.heightCm), weightKg: Number(form.weightKg),
      calorieTarget: Number(form.calorieTarget), proteinTarget: Number(form.proteinTarget)
    });
  }
  return (
    <section className="panel settings-panel">
      <div className="panel-heading"><div><div className="eyebrow">PERSONALIZATION</div><h2>Your profile</h2><p>These inputs drive BMR and TDEE estimates.</p></div></div>
      <form onSubmit={submit} className="settings-form">
        <div className="settings-grid">
          <label className="field-label">Sex used for BMR
            <select value={form.sex} onChange={(e) => change("sex", e.target.value)}><option value="male">Male</option><option value="female">Female</option></select>
          </label>
          <label className="field-label">Age (years)<input type="number" min="13" max="110" value={form.age} onChange={(e) => change("age", e.target.value)} required/></label>
          <label className="field-label">Height (cm)<input type="number" min="100" max="240" value={form.heightCm} onChange={(e) => change("heightCm", e.target.value)} required/></label>
          <label className="field-label">Weight (kg)<input type="number" min="25" max="350" step="0.1" value={form.weightKg} onChange={(e) => change("weightKg", e.target.value)} required/></label>
          <label className="field-label">Activity baseline
            <select value={form.activityLevel} onChange={(e) => change("activityLevel", e.target.value)}>
              <option value="sedentary">Sedentary</option><option value="light">Lightly active</option><option value="moderate">Moderately active</option><option value="active">Very active</option><option value="veryActive">Extremely active</option>
            </select>
          </label>
          <label className="field-label">Daily calorie target<input type="number" min="800" max="6000" value={form.calorieTarget} onChange={(e) => change("calorieTarget", e.target.value)} required/></label>
          <label className="field-label">Protein target (g)<input type="number" min="0" max="400" value={form.proteinTarget} onChange={(e) => change("proteinTarget", e.target.value)} required/></label>
        </div>
        <div className="profile-estimates">
          <div><UserRound size={17}/><span>Estimated BMR</span><strong>{bmr.toLocaleString("en-IN")} kcal</strong></div>
          <div><Activity size={17}/><span>Estimated TDEE</span><strong>{tdee.toLocaleString("en-IN")} kcal</strong></div>
          <div><Target size={17}/><span>Intake target</span><strong>{Number(form.calorieTarget).toLocaleString("en-IN")} kcal</strong></div>
        </div>
        <button className="primary-button" type="submit"><Save size={16}/> Save profile</button>
      </form>
      <p className="disclaimer">BMR/TDEE are estimates, not measurements. TDEE activity settings represent a baseline; avoid logging the same exercise twice.</p>
    </section>
  );
}
