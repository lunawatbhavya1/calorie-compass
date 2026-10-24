import React, { useState } from "react";
import { Plus, Sparkles, Trash2, Utensils, Footprints, Pencil, Check, X } from "lucide-react";
import { estimateFoodCalories } from "../lib/foodEstimates.js";

export default function FoodLog({ entries, selectedDate, onAdd, onDelete, onUpdate }) {
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [kind, setKind] = useState("food");
  const [meal, setMeal] = useState("Meal");
  const [estimateNote, setEstimateNote] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editCalories, setEditCalories] = useState("");

  const todays = entries.filter((entry) => entry.date === selectedDate).sort((a,b) => b.createdAt - a.createdAt);

  function tryEstimate() {
    const result = estimateFoodCalories(description);
    if (!result) {
      setEstimateNote("No local match found. Enter calories manually; AI estimates can be connected in a later step.");
      return;
    }
    setCalories(String(result.calories));
    setEstimateNote(result.note);
  }

  function submit(e) {
    e.preventDefault();
    if (!description.trim() || calories === "" || Number(calories) < 0) return;
    onAdd({
      id: crypto.randomUUID(),
      description: description.trim(),
      calories: Number(calories),
      type: kind,
      meal: kind === "food" ? meal : "Activity",
      date: selectedDate,
      createdAt: Date.now()
    });
    setDescription(""); setCalories(""); setEstimateNote("");
  }

  return (
    <section className="panel food-panel">
      <div className="panel-heading">
        <div><div className="eyebrow">DAILY JOURNAL</div><h2>Log your day</h2><p>Use a quick estimate or enter the calories you know.</p></div>
      </div>
      <form className="entry-form" onSubmit={submit}>
        <div className="type-toggle">
          <button type="button" className={kind === "food" ? "active" : ""} onClick={() => setKind("food")}><Utensils size={15}/> Food</button>
          <button type="button" className={kind === "activity" ? "active" : ""} onClick={() => setKind("activity")}><Footprints size={15}/> Activity burn</button>
        </div>
        <label className="field-label">What did you have / do?</label>
        <div className="estimate-row">
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={kind === "food" ? "e.g. 2 roti, 250 ml milk" : "e.g. 10 km walk"} required/>
          <button type="button" className="estimate-button" onClick={tryEstimate}><Sparkles size={15}/> Estimate</button>
        </div>
        {kind === "food" && <label className="field-label">Meal type
          <select value={meal} onChange={(e) => setMeal(e.target.value)}><option>Breakfast</option><option>Lunch</option><option>Snack</option><option>Dinner</option><option>Meal</option></select>
        </label>}
        <label className="field-label">Calories (kcal)
          <input type="number" min="0" step="1" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="Enter calories" required/>
        </label>
        {estimateNote && <div className="estimate-note"><Sparkles size={14}/>{estimateNote}</div>}
        <button className="primary-button full-width" type="submit"><Plus size={17}/> Add {kind === "food" ? "food entry" : "activity"}</button>
      </form>
      <div className="log-list-heading"><h3>Entries</h3><span>{todays.length} logged</span></div>
      <div className="entries-list">
        {todays.length === 0 && <div className="empty-state"><Utensils size={22}/><strong>No entries yet</strong><span>Add your first meal above to start your diary.</span></div>}
        {todays.map((entry) => (
          <div className="entry-row" key={entry.id}>
            <div className={`entry-symbol ${entry.type === "activity" ? "activity" : ""}`}>{entry.type === "activity" ? <Footprints size={17}/> : <Utensils size={17}/>}</div>
            <div className="entry-main"><strong>{entry.description}</strong><span>{entry.type === "activity" ? "Activity expenditure" : entry.meal}</span></div>
            {editingId === entry.id ? (
              <div className="inline-edit"><input type="number" min="0" value={editCalories} onChange={(e) => setEditCalories(e.target.value)}/><button onClick={() => { onUpdate(entry.id, Number(editCalories)); setEditingId(null); }} aria-label="Save"><Check size={15}/></button><button onClick={() => setEditingId(null)} aria-label="Cancel"><X size={15}/></button></div>
            ) : <div className="entry-calories"><strong>{entry.type === "activity" ? "−" : "+"}{Number(entry.calories).toLocaleString("en-IN")}</strong><span>kcal</span></div>}
            {editingId !== entry.id && <button className="icon-button" title="Edit calories" onClick={() => {setEditingId(entry.id);setEditCalories(String(entry.calories));}}><Pencil size={15}/></button>}
            <button className="icon-button danger" title="Delete entry" onClick={() => onDelete(entry.id)}><Trash2 size={15}/></button>
          </div>
        ))}
      </div>
    </section>
  );
}
