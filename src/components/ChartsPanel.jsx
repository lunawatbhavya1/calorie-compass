import React, { useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine
} from "recharts";
import { ChartNoAxesCombined, ChartColumn, TrendingUp } from "lucide-react";

export default function ChartsPanel({ data }) {
  const [view, setView] = useState("bars");
  const [range, setRange] = useState("7");
  const visible = data.slice(-Number(range));
  return (
    <section className="panel charts-panel">
      <div className="panel-heading chart-heading">
        <div>
          <div className="eyebrow">YOUR TRENDS</div>
          <h2>Calorie analytics</h2>
          <p>Compare daily intake with resting needs and estimated expenditure.</p>
        </div>
        <div className="chart-controls">
          <select aria-label="Chart range" value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option>
          </select>
          <div className="segmented">
            <button className={view === "bars" ? "active" : ""} onClick={() => setView("bars")} title="Grouped bars"><ChartColumn size={16}/></button>
            <button className={view === "lines" ? "active" : ""} onClick={() => setView("lines")} title="Line trends"><ChartNoAxesCombined size={16}/></button>
          </div>
        </div>
      </div>
      <div className="chart-legend-note">Four series per day: BMR · intake · deficit/surplus · TDEE</div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          {view === "bars" ? (
            <BarChart data={visible} margin={{ top: 10, right: 8, left: -16, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#263147"/>
              <XAxis dataKey="dayLabel" tick={{ fill: "#8d9bb2", fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis domain={[-1000, "auto"]} tick={{ fill: "#8d9bb2", fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #2b3549", borderRadius: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9aa7bc" }}/>
              <Bar dataKey="bmr" name="BMR" fill="#8b9cff" radius={[4,4,0,0]} maxBarSize={16}/>
              <Bar dataKey="intake" name="Intake" fill="#63dfbd" radius={[4,4,0,0]} maxBarSize={16}/>
              <Bar dataKey="deficit" name="Deficit / surplus" fill="#f6bd60" radius={[4,4,0,0]} maxBarSize={16}/>
              <Bar dataKey="tdee" name="TDEE" fill="#b68cff" radius={[4,4,0,0]} maxBarSize={16}/>
            </BarChart>
          ) : (
            <LineChart data={visible} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#263147"/>
              <XAxis dataKey="dayLabel" tick={{ fill: "#8d9bb2", fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: "#8d9bb2", fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #2b3549", borderRadius: 12 }}/>
              <Legend wrapperStyle={{ fontSize: 11, color: "#9aa7bc" }}/>
              <ReferenceLine y={0} stroke="#526078"/>
              <Line type="monotone" dataKey="intake" name="Intake" stroke="#63dfbd" strokeWidth={2.5} dot={false}/>
              <Line type="monotone" dataKey="tdee" name="TDEE" stroke="#b68cff" strokeWidth={2.5} dot={false}/>
              <Line type="monotone" dataKey="deficit" name="Balance (TDEE − intake)" stroke="#f6bd60" strokeWidth={2.5} dot={false}/>
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="chart-foot"><TrendingUp size={15}/> Deficit = TDEE minus intake. A negative value means estimated surplus.</div>
    </section>
  );
}
