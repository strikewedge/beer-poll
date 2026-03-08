"use client";

import { useState, useEffect } from "react";
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

export default function PollPage() {
  const [config, setConfig] = useState(null);
  const [options, setOptions] = useState([]);
  const [voted, setVoted] = useState(false);
  const [flash, setFlash] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasVotedCookie()) {
      setVoted(true);
    }
    loadConfig()
      .then((cfg) => {
        setConfig(cfg);
        if (cfg && cfg.beers.length >= 4) {
          const shuffled = shuffleArray(cfg.beers);
          setOptions(shuffleArray(shuffled.slice(0, cfg.numPerVote || 3)));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleVote = async (picked) => {
    if (voted || flash) return;
    setFlash(true);
    const result = await recordVote(
      picked,
      options.map((o) => o.name)
    ).catch(console.error);
    if (result?.alreadyVoted) {
      setVoted(true);
    } else {
      setVoted(true);
    }
    setTimeout(() => setFlash(false), 1500);
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
      </div>
    );
  }

  if (voted) {
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
      <Link
        href="/dashboard"
        style={{
          position: "fixed",
          bottom: 12,
          right: 12,
          background: "none",
          border: "none",
          color: "#d2d2d7",
          fontSize: 12,
          cursor: "pointer",
          textDecoration: "none",
          fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        }}
      >
        admin
      </Link>
    </div>
  );
}
