import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase.js";
import {
  Activity, CalendarDays, ChartNoAxesCombined, ChevronDown, CircleHelp,
  Flame, Footprints, LayoutDashboard, Settings2, Sparkles, Target, Utensils,
  Weight, Download, Menu, X, Leaf, LogOut, ShieldCheck
} from "lucide-react";
import StatCard from "./components/StatCard.jsx";
import ChartsPanel from "./components/ChartsPanel.jsx";
import FoodLog from "./components/FoodLog.jsx";
import ProfileSettings from "./components/ProfileSettings.jsx";
import { calculateBMR, calculateTDEE, dateKey, getDailySummary, lastNDays } from "./lib/calculations.js";
import { loadEntries, loadProfile, saveEntries, saveProfile, loadCloudData, saveCloudEntries, deleteCloudEntry, saveCloudProfile } from "./lib/storage.js";

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [signInError, setSignInError] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Connecting cloud data…");
  const [syncError, setSyncError] = useState("");

  // Read the current login and keep the UI updated when Google sign-in completes.
  useEffect(() => {
    let alive = true;

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) setSignInError(error.message);
        setSession(data?.session ?? null);
        setAuthLoading(false);
      })
      .catch((error) => {
        if (!alive) return;
        setSignInError(error.message || "Could not check your login status.");
        setAuthLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
      setSignInError("");
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setSignInError("");
    setSigningIn(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    if (error) {
      setSignInError(error.message || "Google sign-in failed. Please try again.");
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setSignInError(error.message);
  };

  const [entries, setEntries] = useState(loadEntries);
  const [profile, setProfile] = useState(loadProfile);
  const [selectedDate, setSelectedDate] = useState(dateKey());
  const [page, setPage] = useState("dashboard");
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    setSyncStatus("Syncing your data…");
    setSyncError("");
    loadCloudData(session.user)
      .then(({ entries: cloudEntries, profile: cloudProfile }) => {
        if (cancelled) return;
        setEntries(cloudEntries);
        setProfile(cloudProfile);
        setSyncStatus("Cloud synced");
      })
      .catch((error) => {
        if (cancelled) return;
        setSyncError(error.message || "Cloud sync failed. Check your Supabase tables and policies.");
        setSyncStatus("Sync unavailable");
      });
    return () => { cancelled = true; };
  }, [session?.user?.id]);
  const bmr = useMemo(() => calculateBMR(profile), [profile]);
  const baseTdee = useMemo(() => calculateTDEE(bmr, profile.activityLevel), [bmr, profile.activityLevel]);
  const summary = useMemo(() => getDailySummary(entries, selectedDate, bmr, baseTdee), [entries, selectedDate, bmr, baseTdee]);
  const allChartData = useMemo(() => {
    const days = lastNDays(30, entries, profile);
    return days.map((d) => ({
      ...d,
      dayLabel: new Date(`${d.date}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      deficit: d.balance
    }));
  }, [entries, profile]);
  const todayActivity = entries.filter(e => e.date === dateKey() && e.type === "activity").reduce((s, e) => s + Number(e.calories || 0), 0);

  function updateEntries(next) {
    setEntries(next);
    saveEntries(next);
    if (session?.user?.id) {
      saveCloudEntries(session.user.id, next)
        .then(() => { setSyncStatus("Cloud synced"); setSyncError(""); })
        .catch((error) => { setSyncStatus("Sync unavailable"); setSyncError(error.message || "Could not save entries to the cloud."); });
    }
  }
  function addEntry(entry) { updateEntries([entry, ...entries]); }
  function deleteEntry(id) {
    updateEntries(entries.filter(e => e.id !== id));
    if (session?.user?.id) {
      deleteCloudEntry(session.user.id, id)
        .then(() => { setSyncStatus("Cloud synced"); setSyncError(""); })
        .catch((error) => { setSyncStatus("Sync unavailable"); setSyncError(error.message || "Could not delete cloud entry."); });
    }
  }
  function updateCalories(id, calories) { updateEntries(entries.map(e => e.id === id ? { ...e, calories } : e)); }
  function saveUserProfile(next) {
    setProfile(next);
    saveProfile(next);
    if (session?.user) {
      saveCloudProfile(session.user, next)
        .then(() => { setSyncStatus("Cloud synced"); setSyncError(""); })
        .catch((error) => { setSyncStatus("Sync unavailable"); setSyncError(error.message || "Could not save profile to the cloud."); });
    }
  }
  function exportData() {
    const blob = new Blob([JSON.stringify({ profile, entries }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `calorie-compass-${dateKey()}.json`; a.click(); URL.revokeObjectURL(url);
  }

  const navItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "journal", label: "Food journal", icon: Utensils },
    { id: "analytics", label: "Analytics", icon: ChartNoAxesCombined },
    { id: "profile", label: "Profile & targets", icon: Settings2 }
  ];

  // Keep the dashboard hidden until the user has signed in.
  if (authLoading) {
    return <div className="auth-screen"><div className="auth-card"><div className="auth-brand-mark"><Leaf size={27} /></div><h1>Calorie Compass</h1><p>Checking your secure sign-in…</p><div className="auth-loader" /></div></div>;
  }

  if (!session) {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <div className="auth-brand-mark"><Leaf size={28} /></div>
          <div className="auth-eyebrow"><ShieldCheck size={14} /> YOUR PERSONAL WELLNESS SPACE</div>
          <h1>Welcome to<br /><span>Calorie Compass</span></h1>
          <p className="auth-description">Track calories, understand your nutrition, and keep your progress with you across devices.</p>
          <button className="google-signin-button" onClick={handleGoogleSignIn} disabled={signingIn}>
            {signingIn ? <span className="button-spinner" /> : <GoogleMark />}
            <span>{signingIn ? "Connecting to Google…" : "Continue with Google"}</span>
          </button>
          {signInError && <div className="auth-error" role="alert">{signInError}</div>}
          <div className="auth-privacy"><ShieldCheck size={15} /><span>Your account is used to keep your data private. Cloud saving must also be connected to sync records across devices.</span></div>
          <div className="auth-footer">A healthier picture, one day at a time.</div>
        </section>
      </main>
    );
  }


  return (
    <div className="app-shell">
      {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close menu" />}
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><Leaf size={21} /></div><div><strong>Calorie Compass</strong><span>YOUR DAILY WELLNESS</span></div><button className="mobile-close" onClick={() => setMobileNav(false)}><X size={18} /></button></div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${page === id ? "selected" : ""}`} onClick={() => { setPage(id); setMobileNav(false); }}><Icon size={18} /><span>{label}</span>{page === id && <span className="nav-dot" />}</button>)}</nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-tip"><div className="tip-icon"><Sparkles size={17} /></div><strong>Small steps add up.</strong><p>Consistent logging beats perfect estimates.</p></div>
        <button className="nav-item export-button" onClick={exportData}><Download size={17} /><span>Export my data</span></button>
        <div className="sidebar-footer"><span className="status-dot" /> {syncStatus} <span className="local-badge">GOOGLE</span></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{navItems.find(n => n.id === page)?.label || "Overview"}</strong></div>
          <div className="topbar-right">
            <div className="today-chip"><CalendarDays size={15} /><span>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span></div>
            <span className="signed-in-email" title={session.user?.email}>{session.user?.email}</span>
            <button className="signout-button" onClick={handleSignOut} title="Sign out"><LogOut size={16} /><span>Sign out</span></button>
            <button className="avatar" onClick={() => setPage("profile")} title="Profile settings">{(session.user?.email || "B").charAt(0).toUpperCase()}</button>
          </div>
        </header>

        <div className="page-content">
          {page === "profile" ? (
            <ProfileSettings profile={profile} onSave={saveUserProfile} bmr={bmr} tdee={baseTdee} />
          ) : (
            <>
              <section className="welcome-row">
                <div><div className="eyebrow">YOUR PERSONAL WELLNESS SPACE</div><h1>{page === "journal" ? "Your food journal" : page === "analytics" ? "Your progress, in perspective." : "Make every calorie count."}</h1><p>{page === "journal" ? "Log meals, make quick corrections, and keep your record honest." : "A clearer picture of your intake, activity and daily energy balance."}</p></div>
                <div className="date-picker-wrap"><label htmlFor="day-select">Viewing day</label><input id="day-select" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} /></div>
              </section>

              <section className="hero-card">
                <div className="hero-content">
                  <div className="hero-pill"><span className="hero-pill-dot" /> DAILY CHECK-IN</div>
                  <h2>{summary.balance >= 0 ? `${summary.balance.toLocaleString("en-IN")} kcal estimated deficit` : `${Math.abs(summary.balance).toLocaleString("en-IN")} kcal estimated surplus`}</h2>
                  <p>Estimated balance for {selectedDate === dateKey() ? "today" : new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, based on your current TDEE estimate and logged entries.</p>
                  <div className="progress-label"><span>Daily intake target</span><strong>{Math.round((summary.intake / Math.max(1, profile.calorieTarget)) * 100)}%</strong></div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, summary.intake / Math.max(1, profile.calorieTarget) * 100)}%` }} /></div>
                  <div className="hero-foot"><span>{summary.intake.toLocaleString("en-IN")} kcal consumed</span><span>{Math.max(0, profile.calorieTarget - summary.intake).toLocaleString("en-IN")} kcal to target</span></div>
                </div>
                <div className="hero-visual" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" /><div className="hero-core"><Flame size={31} /><strong>{summary.intake.toLocaleString("en-IN")}</strong><span>KCAL IN</span></div><div className="float-chip chip-top"><Activity size={14} /> BMR <b>{bmr}</b></div><div className="float-chip chip-bottom"><Target size={14} /> TARGET <b>{profile.calorieTarget}</b></div></div>
              </section>

              <section className="stats-grid">
                <StatCard icon={Utensils} label="Calories eaten" value={summary.intake} note={`Target ${Number(profile.calorieTarget).toLocaleString("en-IN")} kcal`} tone="mint" />
                <StatCard icon={Flame} label="Estimated BMR" value={bmr} note="Resting energy estimate" tone="blue" />
                <StatCard icon={Activity} label="Estimated TDEE" value={summary.tdee} note="Daily expenditure estimate" tone="violet" />
                <StatCard icon={Footprints} label="Activity logged" value={todayActivity} note="Entered activity calories" tone="amber" />
              </section>

              {(page === "dashboard" || page === "analytics") && <ChartsPanel data={allChartData} />}
              <div className="lower-grid">
                <FoodLog entries={entries} selectedDate={selectedDate} onAdd={addEntry} onDelete={deleteEntry} onUpdate={updateCalories} />
                <aside className="side-column">
                  <section className="panel target-panel"><div className="panel-heading"><div><div className="eyebrow">TODAY'S TARGET</div><h2>Daily snapshot</h2></div><Target size={19} /></div><div className="target-ring" style={{ "--progress": `${Math.min(100, (summary.intake / Math.max(1, profile.calorieTarget)) * 100)}%` }}><div className="ring-inner"><strong>{Math.max(0, profile.calorieTarget - summary.intake).toLocaleString("en-IN")}</strong><span>kcal left</span></div></div><div className="target-metrics"><div><span>Intake</span><strong>{summary.intake.toLocaleString("en-IN")}</strong></div><div><span>Target</span><strong>{Number(profile.calorieTarget).toLocaleString("en-IN")}</strong></div></div><button className="subtle-button" onClick={() => setPage("profile")}>Adjust targets <ChevronDown size={15} /></button></section>
                  <section className="insight-card"><div className="insight-icon"><Sparkles size={17} /></div><div className="eyebrow">A QUICK REMINDER</div><h3>Estimates are a guide, not a verdict.</h3><p>Use the same approach consistently, check portions, and judge progress by weekly trends—not a single day.</p></section>
                  <section className="panel mini-panel"><div className="mini-panel-title"><Weight size={17} /><strong>Profile at a glance</strong></div><div className="mini-line"><span>Weight</span><strong>{profile.weightKg} kg</strong></div><div className="mini-line"><span>Height</span><strong>{profile.heightCm} cm</strong></div><div className="mini-line"><span>Protein target</span><strong>{profile.proteinTarget} g/day</strong></div><button className="text-button" onClick={() => setPage("profile")}>Edit profile →</button></section>
                </aside>
              </div>
              <footer className="app-footer"><CircleHelp size={14} /> Your data is saved locally and synced to your private cloud account.{syncError && <span role="alert"> {syncError}</span>}</footer>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function GoogleMark() {
  return <svg aria-hidden="true" width="19" height="19" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.05 46.98 31.8 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a24 24 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>;
}
