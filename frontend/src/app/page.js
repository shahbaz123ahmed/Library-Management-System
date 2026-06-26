"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const COLORS = ["#5dcaa5", "#f0ebe0", "#ef9f27", "#d85a30", "#7f77dd", "#e24b4a"];

function useCountUp(target, duration = 1400, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(ease * target));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return value;
}

function Particle({ style }) {
  return (
    <div
      style={{
        position: "absolute",
        width: 3,
        height: 3,
        background: "#5dcaa5",
        borderRadius: "50%",
        animation: `floatUp ${style.duration}s ${style.delay}s linear infinite`,
        left: style.left,
        bottom: 0,
        opacity: 0,
      }}
    />
  );
}

function BookShelf({ books, style }) {
  return (
    <div style={{ position: "absolute", display: "flex", alignItems: "flex-end", gap: 3, ...style }}>
      {books.map((b, i) => (
        <div
          key={i}
          style={{
            width: b.w,
            height: b.h,
            background: b.color,
            borderRadius: "2px 4px 4px 2px",
            animation: `bookWave ${b.dur}s ${b.delay}s ease-in-out infinite`,
            transformOrigin: "bottom center",
          }}
        />
      ))}
    </div>
  );
}

function StatCard({ label, icon: Icon, value, sub, badges, shimmer, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)",
        border: hovered ? "1px solid rgba(93,202,165,0.45)" : "1px solid rgba(255,255,255,0.1)",
        borderRadius: 14,
        padding: "18px 22px",
        backdropFilter: "blur(10px)",
        transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.35)" : "none",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
        animation: `cardRise 0.6s ${delay}s cubic-bezier(0.16,1,0.3,1) both`,
      }}
    >
      {hovered && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, rgba(93,202,165,0.8), transparent)",
          animation: "shimmerLine 0.6s ease-out forwards",
        }} />
      )}
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(93,202,165,0.75)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        {Icon && <Icon />}
        {label}
      </div>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: "#f0ebe0", marginBottom: 4, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "rgba(240,235,224,0.45)" }}>{sub}</div>
      {shimmer && (
        <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(93,202,165,0.5),transparent)", margin: "10px 0", backgroundSize: "200% 100%", animation: "shimmerMove 3s linear infinite" }} />
      )}
      {badges && (
        <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
          {badges.map((b, i) => (
            <span key={i} style={{
              fontSize: 10, padding: "3px 9px", borderRadius: 100,
              background: b.warn ? "rgba(239,159,39,0.15)" : "rgba(93,202,165,0.15)",
              color: b.warn ? "rgba(239,159,39,0.9)" : "rgba(93,202,165,0.9)",
              border: b.warn ? "1px solid rgba(239,159,39,0.25)" : "1px solid rgba(93,202,165,0.25)",
            }}>{b.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LibraryHome() {
  const router = useRouter();
  
  const books42 = useCountUp(42, 1200, 600);
  const books1284 = useCountUp(1284, 1600, 800);
  const books328 = useCountUp(328, 1400, 1000);

  const [particles, setParticles] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setIsClient(true);

      setParticles(
        Array.from({ length: 28 }, () => ({
          left: `${Math.random() * 100}%`,
          duration: 5 + Math.random() * 8,
          delay: Math.random() * 6,
        }))
      );

      const makeShelf = (count) =>
        Array.from({ length: count }, () => ({
          w: 12 + Math.random() * 18,
          h: 60 + Math.random() * 60,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          dur: 3 + Math.random() * 2,
          delay: Math.random() * 2,
        }));

      setShelves([
        { books: makeShelf(28), style: { bottom: 30, left: -20, opacity: 0.06 } },
        { books: makeShelf(22), style: { bottom: 180, left: 90, opacity: 0.05 } },
        { books: makeShelf(25), style: { bottom: 330, left: -10, opacity: 0.06 } },
        { books: makeShelf(20), style: { bottom: 480, left: 70, opacity: 0.04 } },
      ]);
    });

    return () => cancelAnimationFrame(frameId);
  }, []);

  const navLinks = ["Catalog", "Members", "Reports", "Help"];

  function ClockIcon() {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6" stroke="rgba(93,202,165,0.7)" strokeWidth="1.5"/>
        <path d="M7 4v3.5L9 9" stroke="rgba(93,202,165,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    );
  }

  function BookIcon() {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="2" y="2" width="10" height="10" rx="2" stroke="rgba(93,202,165,0.7)" strokeWidth="1.5"/>
        <path d="M4 4h6v6H4V4z" stroke="rgba(93,202,165,0.7)" strokeWidth="1.2"/>
      </svg>
    );
  }

  function PeopleIcon() {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="5" cy="5" r="2.5" stroke="rgba(93,202,165,0.7)" strokeWidth="1.5"/>
        <path d="M1 12c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="rgba(93,202,165,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="10" cy="5" r="2" stroke="rgba(93,202,165,0.5)" strokeWidth="1.2"/>
        <path d="M11.5 11c.8.4 1.5 1.2 1.5 2" stroke="rgba(93,202,165,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    );
  }

  if (!isClient) {
    return (
      <div style={{
        minHeight: 600,
        background: "linear-gradient(135deg, #0a1628 0%, #0d2240 40%, #0a3d2e 100%)",
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ color: "#f0ebe0", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        @keyframes bookWave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.05); }
        }
        @keyframes floatUp {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.2; }
          100% { transform: translateY(-500px) translateX(15px); opacity: 0; }
        }
        @keyframes cardRise {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pillPop {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.65); }
        }
        @keyframes floatBooks {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes shimmerLine {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        @keyframes shimmerMove {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        minHeight: 600,
        background: "linear-gradient(135deg, #0a1628 0%, #0d2240 40%, #0a3d2e 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
        borderRadius: 16,
      }}>

        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          {shelves.map((s, i) => (
            <BookShelf key={i} books={s.books} style={s.style} />
          ))}
        </div>

        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          {particles.map((p, i) => <Particle key={i} style={p} />)}
        </div>

        <svg style={{ position: "absolute", right: 30, top: 80, width: 60, height: 70, animation: "floatBooks 6s ease-in-out infinite", pointerEvents: "none" }} viewBox="0 0 60 70" fill="none">
          <rect x="0" y="10" width="22" height="30" rx="2" fill="rgba(93,202,165,0.25)"/>
          <rect x="24" y="5" width="18" height="35" rx="2" fill="rgba(240,235,224,0.15)"/>
          <rect x="44" y="15" width="14" height="25" rx="2" fill="rgba(239,159,39,0.2)"/>
          <rect x="0" y="40" width="58" height="3" rx="1" fill="rgba(255,255,255,0.1)"/>
        </svg>
        <svg style={{ position: "absolute", left: 20, bottom: 40, width: 50, height: 55, animation: "floatBooks 6s 3s ease-in-out infinite", pointerEvents: "none" }} viewBox="0 0 50 55" fill="none">
          <rect x="0" y="8" width="18" height="26" rx="2" fill="rgba(215,90,48,0.2)"/>
          <rect x="20" y="4" width="14" height="30" rx="2" fill="rgba(93,202,165,0.2)"/>
          <rect x="36" y="12" width="12" height="22" rx="2" fill="rgba(240,235,224,0.12)"/>
          <rect x="0" y="34" width="48" height="2.5" rx="1" fill="rgba(255,255,255,0.08)"/>
        </svg>

        <nav style={{
          position: "absolute", top: 0, left: 0, right: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 48px", zIndex: 10,
          animation: "fadeDown 0.5s 0.1s both",
        }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: "rgba(240,235,224,0.9)", letterSpacing: "0.05em" }}>
            📚 Lumen
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {navLinks.map((link) => (
              <span key={link} style={{
                fontSize: 12, color: "rgba(240,235,224,0.5)", cursor: "pointer",
                letterSpacing: "0.05em", transition: "color 0.2s",
              }}
                onMouseEnter={e => e.target.style.color = "rgba(240,235,224,0.9)"}
                onMouseLeave={e => e.target.style.color = "rgba(240,235,224,0.5)"}
              >{link}</span>
            ))}
          </div>
        </nav>

        <div style={{
          position: "relative", zIndex: 2,
          display: "grid", gridTemplateColumns: "1fr 1fr",
          minHeight: 600, paddingTop: 60,
        }}>

          <div style={{
            padding: "48px 40px 48px 48px",
            display: "flex", flexDirection: "column", justifyContent: "center",
            animation: "slideInLeft 0.8s cubic-bezier(0.16,1,0.3,1) both",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(93,202,165,0.15)",
              border: "1px solid rgba(93,202,165,0.35)",
              color: "#5dcaa5", fontSize: 11, fontWeight: 600,
              letterSpacing: "0.12em", textTransform: "uppercase",
              padding: "6px 14px", borderRadius: 100,
              marginBottom: 28, width: "fit-content",
              animation: "pillPop 0.5s 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
            }}>
              <div style={{
                width: 6, height: 6, background: "#5dcaa5", borderRadius: "50%",
                animation: "pulse 2s ease-in-out infinite",
              }} />
              Lumen Library Suite
            </div>

            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 38, fontWeight: 700, lineHeight: 1.15,
              color: "#f0ebe0", marginBottom: 20,
              animation: "fadeUp 0.7s 0.3s both",
            }}>
              Run your library like<br />
              a <em style={{ color: "#5dcaa5", fontStyle: "italic" }}>studio</em>: clear flows,<br />
              calm data, quick action.
            </h1>

            <p style={{
              fontSize: 14, color: "rgba(240,235,224,0.62)", lineHeight: 1.75,
              marginBottom: 36, maxWidth: 340,
              animation: "fadeUp 0.7s 0.4s both",
            }}>
              Track inventory, manage users, issue books, and automate due reminders — all in a single workspace designed for librarians and administrators.
            </p>

            <div style={{ display: "flex", gap: 12, animation: "fadeUp 0.7s 0.5s both" }}>
              <button
                style={{
                  background: "#1d9e75", color: "#fff", border: "none",
                  padding: "12px 28px", borderRadius: 100,
                  fontSize: 14, fontWeight: 500, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", transition: "all 0.25s",
                }}
                onClick={() => router.push("/login")}
                onMouseEnter={e => { e.target.style.background = "#22b585"; e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 24px rgba(29,158,117,0.4)"; }}
                onMouseLeave={e => { e.target.style.background = "#1d9e75"; e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "none"; }}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
                onMouseUp={e => e.currentTarget.style.transform = "translateY(-2px)"}
              >
                Sign in
              </button>
              <button
                style={{
                  background: "transparent", color: "rgba(240,235,224,0.85)",
                  border: "1px solid rgba(240,235,224,0.25)",
                  padding: "12px 28px", borderRadius: 100,
                  fontSize: 14, fontWeight: 400, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", transition: "all 0.25s",
                }}
                onClick={() => router.push("/register")}
                onMouseEnter={e => { e.target.style.borderColor = "rgba(240,235,224,0.6)"; e.target.style.background = "rgba(255,255,255,0.06)"; e.target.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.target.style.borderColor = "rgba(240,235,224,0.25)"; e.target.style.background = "transparent"; e.target.style.transform = "translateY(0)"; }}
              >
                Create account
              </button>
            </div>
          </div>

          <div style={{
            padding: "48px 48px 48px 20px",
            display: "flex", flexDirection: "column", justifyContent: "center", gap: 14,
            animation: "slideInRight 0.8s 0.2s cubic-bezier(0.16,1,0.3,1) both",
          }}>
            <StatCard
              label="Today"
              icon={ClockIcon}
              value={`${books42} books issued`}
              sub="Circulation activity"
              badges={[{ label: "6 due soon" }, { label: "2 overdue", warn: true }]}
              delay={0.3}
            />
            <StatCard
              label="Inventory"
              icon={BookIcon}
              value={`${books1284.toLocaleString()} available`}
              sub="14 categories tracked"
              shimmer
              delay={0.45}
            />
            <StatCard
              label="Members"
              icon={PeopleIcon}
              value={`${books328} active`}
              sub="Across all roles"
              badges={[{ label: "Admin" }, { label: "Librarian" }, { label: "Student" }]}
              delay={0.6}
            />
          </div>
        </div>
      </div>
    </>
  );
}