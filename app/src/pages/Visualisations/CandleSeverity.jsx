import React, { useRef, useEffect, useState } from "react";
import PropTypes from "prop-types";

export default function CandleSeverityCanvas({ height = 450 }) {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(800);
  const [data, setData]   = useState([]);
  const [hoverIdx, setHoverIdx] = useState(null);

  // 1) aggregate 30m → 1h
  function aggregateToHourly(parsed30m) {
    const buckets = parsed30m.reduce((acc, d) => {
      const dt = new Date(d.interval_start);
      dt.setMinutes(0, 0, 0);
      const key = dt.toISOString();
      if (!acc[key]) {
        acc[key] = { ...d, interval_start: key };
      } else {
        const h = acc[key];
        h.high   = Math.max(h.high,   d.high);
        h.low    = Math.min(h.low,    d.low);
        h.close  = d.close;
        h.volume = h.volume + d.volume;
      }
      return acc;
    }, {});
    return Object.values(buckets).sort(
      (a, b) => new Date(a.interval_start) - new Date(b.interval_start)
    );
  }

  // 2) OHLC → Heikin-Ashi
  function toHeikinAshi(arr) {
    if (!arr.length) return [];
    const ha = [];
    const first = arr[0];
    const firstClose = (first.open + first.high + first.low + first.close) / 4;
    const firstOpen  = (first.open + first.close) / 2;
    ha.push({
      interval_start: first.interval_start,
      open:  firstOpen,
      high:  Math.max(first.high, firstOpen, firstClose),
      low:   Math.min(first.low,  firstOpen, firstClose),
      close: firstClose,
      volume: first.volume
    });
    for (let i = 1; i < arr.length; i++) {
      const { open, high, low, close, volume, interval_start } = arr[i];
      const prev = ha[i - 1];
      const haClose = (open + high + low + close) / 4;
      const haOpen  = (prev.open + prev.close) / 2;
      ha.push({
        interval_start,
        open:  haOpen,
        high:  Math.max(high, haOpen, haClose),
        low:   Math.min(low,  haOpen, haClose),
        close: haClose,
        volume
      });
    }
    return ha;
  }

  // Fetch & process
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch("/data/resources/Q3/candlesseverity.csv");
        const text = await res.text();
        const rows = text.trim().split("\n").slice(1);

        const parsed = rows.map(line => {
          const [
            timeStr,
            openStr,
            highStr,
            lowStr,
            closeStr,
            volumeStr
          ] = line.split(",");

          return {
            interval_start: timeStr,
            open:   Number(openStr),
            high:   Number(highStr),
            low:    Number(lowStr),
            close:  Number(closeStr),
            volume: Number(volumeStr),
          };
        });

        const hourly = aggregateToHourly(parsed);
        const ha     = toHeikinAshi(hourly);
        setData(ha);
      } catch (e) {
        console.error("Failed to load severity data:", e);
      }
    })();
  }, []);

  // Handle resize
  useEffect(() => {
    if (!containerRef.current) return;
    setWidth(containerRef.current.clientWidth);
    const obs = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width))
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Mousemove → hover index
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const handle = e => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const margin = { left: 60, right: 60 };
      const bandW = (width - margin.left - margin.right) / data.length;
      const idx = Math.floor((x - margin.left) / bandW + 0.5);
      setHoverIdx(idx >= 0 && idx < data.length ? idx : null);
    };
    canvas.addEventListener("mousemove", handle);
    canvas.addEventListener("mouseout", () => setHoverIdx(null));
    return () => canvas.removeEventListener("mousemove", handle);
  }, [width, data]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W   = width  * dpr;
    const H   = height * dpr;
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const margin   = { top: 20, right: 60, bottom: 40, left: 60 };
    const volFrac  = 0.22;
    const candleH  = (height - margin.top - margin.bottom) * (1 - volFrac);
    const volH     = (height - margin.top - margin.bottom) * volFrac;
    const volY0    = margin.top + candleH;

    const n       = data.length;
    const bandW   = (width - margin.left - margin.right) / n;
    const candleW = Math.max(2, bandW * 0.6);
    const wickW   = Math.max(1, bandW * 0.2);

    // Extend y range by ±3
    const rawMinLow  = Math.min(...data.map(d => d.low));
    const rawMaxHigh = Math.max(...data.map(d => d.high));
    const minLow  = rawMinLow - 3;
    const maxHigh = rawMaxHigh + 3;
    const maxVol  = Math.max(...data.map(d => d.volume));
    const yScale = v =>
      margin.top + ((maxHigh - v) / (maxHigh - minLow)) * candleH;

    // Clear
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    // Axes
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left - 0.5, margin.top);
    ctx.lineTo(margin.left - 0.5, volY0 + volH);
    ctx.moveTo(margin.left, volY0 + 0.5);
    ctx.lineTo(width - margin.right, volY0 + 0.5);
    ctx.stroke();

    // Timeline ticks & labels
    const firstTime = new Date(data[0].interval_start).getTime();
    const lastTime  = new Date(data[n - 1].interval_start).getTime();
    const totalMs   = lastTime - firstTime;
    const targetCount = 7;
    const stepMs = Math.ceil(totalMs / targetCount / (1000*60*60)) * (1000*60*60);

    ctx.fillStyle = "#333";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let t = firstTime; t <= lastTime; t += stepMs) {
      const x = margin.left + ((t - firstTime) / totalMs) * (width - margin.left - margin.right);
      const dt = new Date(t);
      const label = dt.toLocaleString("en-GB", {
        hour: "2-digit",
        day:  "2-digit",
        month:"2-digit"
      });
      ctx.beginPath();
      ctx.moveTo(x, volY0 + volH);
      ctx.lineTo(x, volY0 + volH + 5);
      ctx.stroke();
      ctx.fillText(label, x, volY0 + volH + 6);
    }

    // Candles, volumes & hover highlight
    data.forEach((d, i) => {
      const xC = margin.left + i*bandW + bandW/2;
      const oY = yScale(d.open);
      const cY = yScale(d.close);
      const hY = yScale(d.high);
      const lY = yScale(d.low);
      const up = d.close >= d.open;
      const bodyColor = up ? "#26a69a" : "#ef5350";
      const grey = "#888";

      // Wick (grey)
      ctx.strokeStyle = grey;
      ctx.lineWidth = wickW;
      ctx.beginPath();
      ctx.moveTo(xC, hY);
      ctx.lineTo(xC, lY);
      ctx.stroke();

      // Body (colored)
      ctx.fillStyle = bodyColor;
      const top = Math.min(oY, cY);
      const bh  = Math.max(1, Math.abs(oY - cY));
      ctx.fillRect(xC - candleW/2, top, candleW, bh);

      // Volume bar (grey)
      const vH = (d.volume / maxVol) * volH;
      ctx.fillStyle = grey;
      ctx.fillRect(xC - candleW/2, volY0 + volH - vH, candleW, vH);

      // Hover highlight
      if (i === hoverIdx) {
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          xC - candleW/2 - 1,
          margin.top - 1,
          candleW + 2,
          candleH + 2
        );
      }
    });

    // Tooltip
    if (hoverIdx != null) {
      const d = data[hoverIdx];
      const xC = margin.left + hoverIdx*bandW + bandW/2;
      const tooltip = [
        `Time: ${new Date(d.interval_start).toLocaleString()}`,
        `O: ${d.open.toFixed(2)}  H: ${d.high.toFixed(2)}`,
        `L: ${d.low.toFixed(2)}  C: ${d.close.toFixed(2)}`,
        `Vol: ${d.volume}`
      ];
      const padding = 6;
      ctx.font = "12px sans-serif";
      const w = Math.max(...tooltip.map(t => ctx.measureText(t).width)) + padding*2;
      const h = tooltip.length * 16 + padding*2;
      const boxX = Math.min(
        width - margin.right - w,
        Math.max(margin.left, xC + 10)
      );
      const boxY = margin.top + 10;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillRect(boxX, boxY, w, h);
      ctx.strokeStyle = "#333";
      ctx.strokeRect(boxX, boxY, w, h);
      ctx.fillStyle = "#000";
      tooltip.forEach((line, idx) => {
        ctx.fillText(line, boxX + padding, boxY + padding + idx*16 + 12);
      });
    }
  }, [data, width, hoverIdx, height]);

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <canvas ref={canvasRef} style={{ cursor: "pointer" }} />
    </div>
  );
}

CandleSeverityCanvas.propTypes = {
  height: PropTypes.number,
};
