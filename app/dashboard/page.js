"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import QRCode from "qrcode";
import Link from "next/link";
import {
  loadConfig,
  saveConfig as apiSaveConfig,
  loadResults,
  clearVotes as apiClearVotes,
} from "@/lib/api";
import styles from "@/lib/styles";

// ─── Pin Gate ───
function PinGate({ config, onUnlock }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);

  const submit = () => {
    if (pin === config.pin) {
      onUnlock();
    } else {
      setErr(true);
      setTimeout(() => setErr(false), 1500);
    }
  };

  if (!config.pin) {
    onUnlock();
    return null;
  }

  return (
    <div style={styles.dashWrap}>
      <div style={styles.pinBox}>
        <h2 style={styles.pinTitle}>Enter PIN</h2>
        <input
          type="tel"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          style={{
            ...styles.pinInput,
            borderColor: err ? "#ff3b30" : "#d2d2d7",
          }}
          placeholder="• • • •"
          autoFocus
        />
        <button onClick={submit} style={styles.pinSubmit}>
          enter
        </button>
      </div>
    </div>
  );
}

// ─── QR Code Block ───
function QRCodeBlock() {
  const [dataUrl, setDataUrl] = useState(null);
  const [pollUrl, setPollUrl] = useState("");

  useEffect(() => {
    const url = window.location.origin;
    setPollUrl(url);
    QRCode.toDataURL(url, {
      width: 800,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    }).then(setDataUrl);
  }, []);

  const downloadPNG = useCallback(async () => {
    const canvas = document.createElement("canvas");
    await QRCode.toCanvas(canvas, pollUrl, {
      width: 800,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
    const link = document.createElement("a");
    link.download = "beer-poll-qr.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [pollUrl]);

  if (!dataUrl) return null;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14,
      background: "#f5f5f7",
      borderRadius: 16,
      padding: 24,
    }}>
      <img
        src={dataUrl}
        alt="Poll QR code"
        style={{ width: 240, height: 240, imageRendering: "pixelated" }}
      />
      <span style={{
        color: "#86868b",
        fontSize: 13,
        fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        wordBreak: "break-all",
        textAlign: "center",
      }}>
        {pollUrl}
      </span>
      <button onClick={downloadPNG} style={{
        background: "#000",
        border: "none",
        borderRadius: 10,
        padding: "10px 24px",
        color: "#fff",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }}>
        Save as PNG
      </button>
      <span style={{
        color: "#86868b",
        fontSize: 12,
        fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        textAlign: "center",
        lineHeight: 1.4,
      }}>
        On iPhone, long-press the QR code and tap Save to Photos
      </span>
    </div>
  );
}

// ─── Config Tab ───
function ConfigTab({ config, setConfig }) {
  const [q, setQ] = useState(config.question);
  const [beers, setBeers] = useState(config.beers);
  const [newName, setNewName] = useState("");
  const [pin, setPin] = useState(config.pin);
  const [numPer, setNumPer] = useState(config.numPerVote);
  const [saved, setSaved] = useState(false);

  const addBeer = () => {
    if (!newName.trim()) return;
    setBeers([
      ...beers,
      { id: Date.now().toString(), name: newName.trim() },
    ]);
    setNewName("");
  };

  const removeBeer = (id) => setBeers(beers.filter((b) => b.id !== id));

  const save = async () => {
    const updated = {
      ...config,
      question: q,
      beers,
      pin,
      numPerVote: numPer,
    };
    const result = await apiSaveConfig(updated);
    setConfig(result);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const toggleLive = async () => {
    const updated = {
      ...config,
      isLive: !config.isLive,
      question: q,
      beers,
      pin,
      numPerVote: numPer,
    };
    const result = await apiSaveConfig(updated);
    setConfig(result);
  };

  return (
    <div style={styles.configWrap}>
      <div style={styles.field}>
        <label style={styles.label}>Question</label>
        <input
          style={styles.textInput}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Which beer would you pick?"
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Options shown per vote</label>
        <div style={{ display: "flex", gap: 8 }}>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => setNumPer(n)}
              style={{
                ...styles.numBtn,
                background: numPer === n ? "#000" : "#f5f5f7",
                color: numPer === n ? "#fff" : "#1d1d1f",
                borderColor: numPer === n ? "#000" : "#d2d2d7",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>PIN (for dashboard access)</label>
        <input
          style={styles.textInput}
          value={pin}
          onChange={(e) =>
            setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder="1234"
          type="tel"
          maxLength={6}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Beers ({beers.length})</label>
        <div style={styles.beerList}>
          {beers.map((b) => (
            <div key={b.id} style={styles.beerRow}>
              <span style={styles.beerRowName}>{b.name}</span>
              <button
                onClick={() => removeBeer(b.id)}
                style={styles.removeBtn}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div style={styles.addRow}>
          <input
            style={{ ...styles.textInput, flex: 1, minWidth: 0 }}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Beer name"
            onKeyDown={(e) => e.key === "Enter" && addBeer()}
          />
          <button onClick={addBeer} style={styles.addBtn}>
            +
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={save} style={styles.saveBtn}>
          {saved ? "✓ saved" : "save"}
        </button>
        <button
          onClick={toggleLive}
          style={{
            ...styles.liveBtn,
            background: config.isLive ? "#ff3b30" : "#34c759",
          }}
        >
          {config.isLive ? "close poll" : "go live"}
        </button>
      </div>

      <QRCodeBlock />

      {beers.length < 4 && (
        <p style={styles.warn}>Add at least 4 beers to run the poll.</p>
      )}
    </div>
  );
}

// ─── Results Tab ───
function ResultsTab({ config, votes, setVotes }) {
  const stats = useMemo(() => {
    const map = {};
    config.beers.forEach((b) => {
      map[b.name] = { shown: 0, picked: 0, noneWhenShown: 0 };
    });
    votes.forEach((v) => {
      v.shown.forEach((name) => {
        if (map[name]) {
          map[name].shown++;
          if (v.picked === "__none__") map[name].noneWhenShown++;
        }
      });
      if (v.picked !== "__none__" && map[v.picked]) {
        map[v.picked].picked++;
      }
    });
    return Object.entries(map)
      .map(([name, d]) => ({
        name,
        ...d,
        winRate: d.shown > 0 ? d.picked / d.shown : 0,
        noneRate: d.shown > 0 ? d.noneWhenShown / d.shown : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate);
  }, [config.beers, votes]);

  const maxRate = Math.max(...stats.map((s) => s.winRate), 0.01);

  const dailyData = useMemo(() => {
    const days = {};
    votes.forEach((v) => {
      const d = v.ts?.slice(0, 10);
      if (d) days[d] = (days[d] || 0) + 1;
    });
    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date: date.slice(5), count }));
  }, [votes]);

  const maxDaily = Math.max(...dailyData.map((d) => d.count), 1);

  const handleClear = async () => {
    if (confirm("Clear all votes? This can't be undone.")) {
      await apiClearVotes();
      setVotes([]);
    }
  };

  const top2 = stats.filter((s) => s.shown > 0).slice(0, 2);

  return (
    <div style={styles.resultsWrap}>
      {votes.length >= 10 && top2.length === 2 && (
        <div style={styles.heroBox}>
          <p style={styles.heroLabel}>Top 2 beers</p>
          <p style={styles.heroName}>{top2[0].name}</p>
          <p style={styles.heroName}>{top2[1].name}</p>
        </div>
      )}

      <div style={styles.totalBox}>
        <span style={styles.totalNum}>{votes.length}</span>
        <span style={styles.totalLabel}>
          {votes.length === 1 ? "response" : "responses"}
        </span>
        {votes.length > 0 && votes.length < 50 && (
          <span style={styles.confidenceNote}>
            Keep going — 50+ responses for a solid read
          </span>
        )}
        {votes.length >= 50 && votes.length < 100 && (
          <span style={styles.confidenceNote}>
            good sample, trends forming
          </span>
        )}
        {votes.length >= 100 && (
          <span style={styles.confidenceNote}>
            strong data — results reliable
          </span>
        )}
      </div>

      <div style={styles.chartWrap}>
        {stats.map((s, i) => (
          <div key={s.name} style={styles.barRow}>
            <div style={styles.barLabel}>
              <span style={styles.barRank}>#{i + 1}</span>
              <span style={styles.barName}>{s.name}</span>
            </div>
            <div style={styles.barTrack}>
              <div
                style={{
                  ...styles.barFill,
                  width: `${(s.winRate / maxRate) * 100}%`,
                  background:
                    i === 0 ? "#1d1d1f" : i === 1 ? "#86868b" : "#d2d2d7",
                }}
              />
            </div>
            <div style={styles.barStats}>
              <span style={styles.barPct}>
                {(s.winRate * 100).toFixed(1)}%
              </span>
              <span style={styles.barDetail}>
                {s.picked}/{s.shown} shown
              </span>
            </div>
          </div>
        ))}
      </div>

      {dailyData.length > 1 && (
        <div style={styles.dailyWrap}>
          <p style={styles.dailyTitle}>Responses / day</p>
          <div style={styles.dailyChart}>
            {dailyData.map((d) => (
              <div key={d.date} style={styles.dailyCol}>
                <div
                  style={{
                    ...styles.dailyBar,
                    height: `${(d.count / maxDaily) * 100}%`,
                  }}
                />
                <span style={styles.dailyLabel}>{d.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {config.isLive && (
        <div style={styles.qrHint}>
          <p style={styles.qrText}>
            Poll is live. Share the URL or scan the QR code from your deployed
            app.
          </p>
        </div>
      )}

      {votes.length > 0 && (
        <button onClick={handleClear} style={styles.clearBtn}>
          Clear all votes
        </button>
      )}
    </div>
  );
}

// ─── Dashboard ───
export default function DashboardPage() {
  const [config, setConfig] = useState(null);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState("results");

  useEffect(() => {
    Promise.all([loadConfig(), loadResults()])
      .then(([cfg, v]) => {
        setConfig(cfg);
        setVotes(v);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !config) {
    return (
      <div style={styles.pollWrap}>
        <div style={styles.loader} />
      </div>
    );
  }

  if (!unlocked) {
    return <PinGate config={config} onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div style={styles.dashWrap}>
      <div style={styles.dashHeader}>
        <h1 style={styles.dashTitle}>Dashboard</h1>
        <div style={styles.tabRow}>
          <button
            onClick={() => setTab("results")}
            style={{
              ...styles.tab,
              borderBottomColor:
                tab === "results" ? "#1d1d1f" : "transparent",
              color: tab === "results" ? "#1d1d1f" : "#86868b",
            }}
          >
            Results
          </button>
          <button
            onClick={() => setTab("config")}
            style={{
              ...styles.tab,
              borderBottomColor:
                tab === "config" ? "#1d1d1f" : "transparent",
              color: tab === "config" ? "#1d1d1f" : "#86868b",
            }}
          >
            Configure
          </button>
        </div>
      </div>
      {tab === "results" ? (
        <ResultsTab config={config} votes={votes} setVotes={setVotes} />
      ) : (
        <ConfigTab config={config} setConfig={setConfig} />
      )}
      <Link href="/" style={styles.backLink}>
        ← view poll
      </Link>
    </div>
  );
}
