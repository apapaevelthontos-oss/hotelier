import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

const T = {
  navy: "#14305F", deep: "#0B1F42", mid: "#3D5B94",
  gold: "#B08A3E", champagne: "#E9D8AC", goldSoft: "#F5EEDD",
  sea: "#DCEFF8", seaDeep: "#8FC4DC",
  porcelain: "#F6F8FB", white: "#FFFFFF",
  ink: "#1F2B42", mute: "#68778F", faint: "#93A1B5", line: "#E5EAF1",
  green: "#2F7D5B",
};

const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const P = {
    arrow: <path d="M3 8h10M9.5 4.5L13 8l-3.5 3.5" />,
    check: <path d="M2.5 8.5L6.2 12 13.5 4.5" />,
    heart: <path d="M8 13.5S2 9.8 2 5.9C2 4 3.5 2.6 5.2 2.6c1.2 0 2.2.7 2.8 1.6.6-.9 1.6-1.6 2.8-1.6C12.5 2.6 14 4 14 5.9c0 3.9-6 7.6-6 7.6z" />,
    wallet: <><rect x="2" y="4" width="12" height="9.5" rx="1.8" /><path d="M2 6.8h12M10.8 10h1.6" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">{P[name]}</svg>;
};

export default function Hotelier() {
  const [page, setPage] = useState("home");
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [shifts, setShifts] = useState([]);
  const [myShifts, setMyShifts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      setUser(data.session.user);
      setPage("dashboard");
      fetchShifts();
    }
  };

  const fetchShifts = async () => {
    const { data } = await supabase.from("shifts").select("*").eq("status", "open");
    setShifts(data || []);
  };

  const handleRegister = async () => {
    if (!email || !password || !name) {
      alert("Fill all fields");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error) {
      await supabase.from("users").insert({
        id: data.user.id,
        email,
        name,
        role,
      });
      setUser(data.user);
      setPage("dashboard");
      setEmail("");
      setPassword("");
      setName("");
    } else {
      alert(error.message);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Email & password required");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      setUser(data.user);
      setPage("dashboard");
      fetchShifts();
    } else {
      alert(error.message);
    }
    setLoading(false);
  };

  const handleAcceptShift = async (shiftId) => {
    const { data: shift } = await supabase.from("shifts").select("*").eq("id", shiftId).single();
    
    await supabase.from("shifts").update({ talent_id: user.id, status: "accepted" }).eq("id", shiftId);
    
    await supabase.from("payments").insert({
      shift_id: shiftId,
      talent_id: user.id,
      partner_id: shift.partner_id,
      amount: shift.pay,
      commission: shift.pay * 0.12,
      status: "pending",
    });

    alert("Shift booked! Payment will be released in 24h.");
    fetchShifts();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPage("home");
    setEmail("");
    setPassword("");
  };

  // HOME PAGE
  if (page === "home") {
    return (
      <div style={{ background: T.porcelain, minHeight: "100vh", padding: 20, fontFamily: "'Manrope', sans-serif" }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <h1 style={{ color: T.navy, marginTop: 40, marginBottom: 30, textAlign: "center", fontSize: 28 }}>Hotelier</h1>
          <p style={{ color: T.mute, textAlign: "center", marginBottom: 40 }}>Hospitality starts with people</p>

          <div style={{ marginBottom: 20 }}>
            <button
              onClick={() => { setRole("talent"); setPage("auth"); }}
              style={{
                width: "100%",
                padding: 16,
                background: T.navy,
                color: T.white,
                border: "none",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 10,
                cursor: "pointer",
              }}
            >
              I'm a Talent (Looking for shifts)
            </button>
            <button
              onClick={() => { setRole("partner"); setPage("auth"); }}
              style={{
                width: "100%",
                padding: 16,
                background: T.gold,
                color: T.white,
                border: "none",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              I'm a Hotel Partner (Posting shifts)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AUTH PAGE
  if (page === "auth") {
    return (
      <div style={{ background: T.porcelain, minHeight: "100vh", padding: 20, fontFamily: "'Manrope', sans-serif" }}>
        <div style={{ maxWidth: 500, margin: "0 auto", marginTop: 40 }}>
          <h2 style={{ color: T.navy, marginBottom: 30 }}>{role === "talent" ? "Join as Talent" : "Create Partner Account"}</h2>

          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 12,
              border: `1px solid ${T.line}`,
              borderRadius: 6,
              fontFamily: "inherit",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 12,
              border: `1px solid ${T.line}`,
              borderRadius: 6,
              fontFamily: "inherit",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 20,
              border: `1px solid ${T.line}`,
              borderRadius: 6,
              fontFamily: "inherit",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
