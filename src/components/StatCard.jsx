import React from "react";

export default function StatCard({ icon: Icon, label, value, unit = "kcal", note, tone = "mint" }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon"><Icon size={18} /></span>
      </div>
      <div className="stat-value">{Number(value || 0).toLocaleString("en-IN")} <small>{unit}</small></div>
      {note && <div className="stat-note">{note}</div>}
    </article>
  );
}
