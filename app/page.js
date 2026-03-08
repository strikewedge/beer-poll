"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { loadConfig, recordVote } from "@/lib/api";
import styles from "@/lib/styles";

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hasVotedCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith("beer-poll-voted="));
}

function getKioskState() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const v = sessionStorage.getItem("beer-poll-kiosk");
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

function setKioskState(pin) {
  sessionStorage.setItem("beer-poll-kiosk", JSON.stringify({ pin }));
}

function clearKioskState() {
  sessionStorage.removeItem("beer-poll-kiosk");
}

const subtleLink = {
  position: "fixed",
  bottom: 12,
  background: "none",
  border: "none",
  color: "#d2d2d7",
  fontSize: 12,
  cursor: "pointer",
  textDecoration: "none",
  fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
};

export default function PollPage() {
  const [config, setConfig] = useState(null);
  const [options, setOptions] = useState([]);
  const [voted, setVoted] = useState(false);
  const [flash, setFlash] = useState(false);
  const [loading, setLoading] = useState(true);
  const [kiosk, setKiosk] = useState(null);

  const pickNewOptions = useCallback(
    (cfg) => {
      const c = cfg || config;
      if (c && c.beers.length >= 4) {
        const shuffled = shuffleArray(c.beers);
        setOptions(shuffleArray(shuffled.slice(0, c.numPerVote || 3)));
      }
    },
    [config]
  );

  useEffect(() => {
    const stored = getKioskState();
    if (stored) {
      setKiosk(stored);
    } else if (hasVotedCookie()) {
      setVoted(true);
    }
    loadConfig()
      .then((cfg) => {
        setConfig(cfg);
        pickNewOptions(cfg);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVote = async (picked) => {
    if (flash) return;
    if (!kiosk && voted) return;
    setFlash(true);
    const result = await recordVote(
      picked,
      options.map((o) => o.name),
      kiosk?.pin
    ).catch(console.error);
    if (!kiosk) {
      setVoted(true);
    }
    setTimeout(() => {
      setFlash(false);
      if (kiosk) {
        pickNewOptions(config);
      }
    }, 1500);
  };

  const toggleKiosk = () => {
    if (kiosk) {
      const entered = prompt("Enter PIN to exit kiosk mode");
      if (entered && entered === config?.pin) {
        clearKioskState();
        setKiosk(null);
        if (hasVotedCookie()) setVoted(true);
      }
    } else {
      const entered = prompt("Enter PIN to enable kiosk mode");
      if (entered && entered === config?.pin) {
        const state = { pin: entered };
        setKioskState(entered);
        setKiosk(state);
        setVoted(false);
      }
    }
  };

  if (loading) {
    return (
      <div style={styles.pollWrap}>
        <div style={styles.loader} />
      </div>
    );
  }

  if (!config || !config.isLive) {
    return (
      <div style={styles.pollWrap}>
        <p style={styles.closedText}>Poll closed</p>
      </div>
    );
  }

  if (flash) {
    return (
      <div style={styles.pollWrap}>
        <div style={styles.flashWrap}>
          <span style={styles.flashIcon}>🍺</span>
          <p style={styles.flashText}>Vote recorded</p>
        </div>
        {kiosk && (
          <span style={{ ...subtleLink, left: 12 }}>kiosk mode</span>
        )}
      </div>
    );
  }

  if (!kiosk && voted) {
    return (
      <div style={styles.pollWrap}>
        <div style={styles.flashWrap}>
          <span style={styles.flashIcon}>🍺</span>
          <p style={styles.flashText}>Thanks for voting</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pollWrap}>
      <h1 style={styles.pollQuestion}>{config.question}</h1>
      <div style={styles.optionsWrap}>
        {options.map((beer) => (
          <button
            key={beer.id}
            onClick={() => handleVote(beer.name)}
            style={styles.optionBtn}
            onMouseEnter={(e) =>
              Object.assign(e.target.style, styles.optionBtnHover)
            }
            onMouseLeave={(e) => {
              e.target.style.background = "#fff";
              e.target.style.borderColor = "#d2d2d7";
              e.target.style.transform = "none";
            }}
          >
            <span style={styles.beerName}>{beer.name}</span>
            {beer.style && <span style={styles.beerStyle}>{beer.style}</span>}
          </button>
        ))}
        <button
          onClick={() => handleVote("__none__")}
          style={styles.noneBtn}
          onMouseEnter={(e) => {
            e.target.style.background = "#f5f5f7";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "transparent";
          }}
        >
          none of these
        </button>
      </div>
      <button onClick={toggleKiosk} style={{ ...subtleLink, left: 12 }}>
        {kiosk ? "kiosk mode" : "kiosk"}
      </button>
      <Link href="/dashboard" style={{ ...subtleLink, right: 12 }}>
        admin
      </Link>
    </div>
  );
}
