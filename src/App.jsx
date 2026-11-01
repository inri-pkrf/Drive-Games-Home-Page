import { useState, useEffect, useRef } from 'react';
import { GAMES } from './games.js';
import logo from './assets/logo.png';

const SESSION = 180000, WARN = 15; // אחרי 3 דקות במשחק: שאלה "עדיין משחקים?" ואז חזרה אוטומטית
const KEY = 'college-hub-stats';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };

function useCount(n) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let r, t0;
    const f = t => { t0 ??= t; const p = Math.min((t - t0) / 1000, 1); setV(Math.round(n * (1 - (1 - p) ** 3))); if (p < 1) r = requestAnimationFrame(f); };
    r = requestAnimationFrame(f); return () => cancelAnimationFrame(r);
  }, [n]);
  return v;
}
const Num = ({ n }) => <>{useCount(n).toLocaleString('he-IL')}</>;

function Card({ g, n, max, i, onOpen }) {
  return (
    <button className="card" style={{ '--k': g.color, '--d': `${0.5 + i * 0.15}s` }} onClick={() => onOpen(g)}>
      <div className="ico">{g.icon}</div>
      <div className="mid"><div className="h3">{g.title}</div><div className="desc">{g.desc}</div></div>
      <div className="cnt"><div className="n"><Num n={n} /></div><div className="lbl">כניסות</div>
        <div className="bar"><i style={{ width: `${max ? Math.max(6, (n / max) * 100) : 6}%` }} /></div></div>
    </button>
  );
}

export default function App() {
  const [s, setS] = useState(1), [stats, setStats] = useState(load), [cur, setCur] = useState(null);
  const [admin, setAdmin] = useState(false), [sure, setSure] = useState(false);
  const [menu, setMenu] = useState(false), [warn, setWarn] = useState(null), [fs, setFs] = useState(false);
  const hold = useRef();
  const home = () => { setCur(null); setMenu(false); setWarn(null); };
  const toggleFs = () => { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch {} };
  useEffect(() => { const f = () => setFs(!!document.fullscreenElement); document.addEventListener('fullscreenchange', f); return () => document.removeEventListener('fullscreenchange', f); }, []);
  useEffect(() => { if (!cur || warn !== null) return; const t = setTimeout(() => setWarn(WARN), SESSION); return () => clearTimeout(t); }, [cur, warn]);
  useEffect(() => { if (warn === null) return; if (warn <= 0) { home(); return; } const t = setTimeout(() => setWarn(warn - 1), 1000); return () => clearTimeout(t); }, [warn]);

  useEffect(() => {
    const f = () => setS(Math.min(innerWidth / 1080, innerHeight / 1920));
    f(); addEventListener('resize', f); return () => removeEventListener('resize', f);
  }, []);

  const open = g => { const n = { ...stats, [g.id]: (stats[g.id] || 0) + 1 }; setStats(n); save(n); setCur(g); };
  const total = GAMES.reduce((a, g) => a + (stats[g.id] || 0), 0);
  const max = Math.max(0, ...GAMES.map(g => stats[g.id] || 0));
  const reset = () => { if (!sure) return setSure(true); setStats({}); save({}); setSure(false); setAdmin(false); };

  return (
    <div className="wrap">
      <div className="stage" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
        {cur ? (
          <div className="play">
            <iframe title={cur.title} src={cur.url} allow="fullscreen" />
            <button className="tab" aria-label="תפריט" onClick={() => setMenu(true)}>🏠</button>
            {menu && (
              <div className="adm" onClick={() => setMenu(false)}>
                <div className="box" onClick={e => e.stopPropagation()}>
                  <div className="h3">{cur.title}</div>
                  <button className="cta2" onClick={home}>חזרה לתפריט</button>
                  <button className="ghost" onClick={toggleFs}>{fs ? 'יציאה ממסך מלא' : 'מסך מלא'}</button>
                  <button className="ghost" onClick={() => setMenu(false)}>המשך משחק</button>
                </div>
              </div>
            )}
            {warn !== null && (
              <div className="adm">
                <div className="box">
                  <div className="h3">עדיין משחקים?</div>
                  <p>חוזרים לתפריט בעוד {warn} שניות</p>
                  <button className="cta2" onClick={() => setWarn(null)}>כן, ממשיכים</button>
                  <button className="ghost" onClick={home}>חזרה לתפריט</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="hub">
            <i className="blob b1" /><i className="blob b2" /><i className="blob b3" />
            <button className="fsb" onClick={toggleFs}>{fs ? 'יציאה ממסך מלא' : 'מסך מלא'}</button>
            <img className="logo" src={logo} alt="המכללה הלאומית לאיתנות ישראלית"
              onPointerDown={() => (hold.current = setTimeout(() => setAdmin(true), 2500))}
              onPointerUp={() => clearTimeout(hold.current)} onPointerLeave={() => clearTimeout(hold.current)} />
            <h1 className="title">המכללה הלאומית<br />נזהרת בדרכים</h1>
            <div className="strip">{['#f58a3c', '#fdc43f', '#ef5360', '#3bb08a', '#1fb5e6', '#1b7a9e'].map(c => <i key={c} style={{ background: c }} />)}</div>
            <p className="sub">בחרו משחק והתחילו לשחק</p>
            <div className="cards">{GAMES.map((g, i) => <Card key={g.id} g={g} i={i} n={stats[g.id] || 0} max={max} onOpen={open} />)}</div>
            <div className="total"><span>סה״כ נכנסו למשחקים</span><b><Num n={total} /></b></div>
          </div>
        )}
        {admin && (
          <div className="adm" onClick={() => { setAdmin(false); setSure(false); }}>
            <div className="box" onClick={e => e.stopPropagation()}>
              <div className="h3">סטטיסטיקה</div>
              {GAMES.map(g => <p key={g.id}>{g.title}: <b>{stats[g.id] || 0}</b></p>)}
              <p>סה״כ: <b>{total}</b></p>
              <button className="danger" onClick={reset}>{sure ? 'לחצו שוב לאישור איפוס' : 'איפוס מונים'}</button>
              <button className="ghost" onClick={() => { setAdmin(false); setSure(false); }}>סגירה</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
