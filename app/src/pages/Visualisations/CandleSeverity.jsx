import React, { useRef, useEffect, useState } from "react";
import PropTypes from "prop-types";

export default function CandleSeverityCanvas({ height = 450 }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(800);
  const [data, setData] = useState([]);
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
        h.high = Math.max(h.high, d.high);
        h.low = Math.min(h.low, d.low);
        h.close = d.close;
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
    const firstOpen = (first.open + first.close) / 2;
    ha.push({
      interval_start: first.interval_start,
      open: firstOpen,
      high: Math.max(first.high, firstOpen, firstClose),
      low: Math.min(first.low, firstOpen, firstClose),
      close: firstClose,
      volume: first.volume
    });
    for (let i = 1; i < arr.length; i++) {
      const { open, high, low, close, volume, interval_start } = arr[i];
      const prev = ha[i - 1];
      const haClose = (open + high + low + close) / 4;
      const haOpen = (prev.open + prev.close) / 2;
      ha.push({
        interval_start,
        open: haOpen,
        high: Math.max(high, haOpen, haClose),
        low: Math.min(low, haOpen, haClose),
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
        const res = await fetch("/data/resources/Q3/candlesseverity.csv");
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
            open: Number(openStr),
            high: Number(highStr),
            low: Number(lowStr),
            close: Number(closeStr),
            volume: Number(volumeStr),
          };
        });

        const hourly = aggregateToHourly(parsed);
        const ha = toHeikinAshi(hourly);
        setData(ha);
      } catch (e) {
        console.error("Failed to load severity data:", e);
      }
    })();
  }, []);

  // Handle resize - with debounce to prevent recursive width increases
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Set initial width once
    const initialWidth = containerRef.current.offsetWidth;
    setWidth(initialWidth);
    
    // Debounced resize handler
    let timeoutId = null;
    const handleResize = (entries) => {
      if (timeoutId) clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        // Only update if the container is already rendered and stable
        if (containerRef.current && entries[0]) {
          const newWidth = Math.floor(entries[0].contentRect.width);
          // Only update width if it changed significantly (prevents feedback loop)
          if (Math.abs(newWidth - width) > 5) {
            setWidth(newWidth);
          }
        }
      }, 100); // 100ms debounce
    };
    
    const obs = new ResizeObserver(handleResize);
    obs.observe(containerRef.current);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      obs.disconnect();
    };
  }, [width]);

  // Mousemove → hover index
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const handle = e => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const margin = { left: 70, right: 70 };
      const bandW = (width - margin.left - margin.right) / data.length;
      const idx = Math.floor((x - margin.left) / bandW + 0.5);
      setHoverIdx(idx >= 0 && idx < data.length ? idx : null);
    };
    canvas.addEventListener("mousemove", handle);
    canvas.addEventListener("mouseout", () => setHoverIdx(null));
    return () => {
      canvas.removeEventListener("mousemove", handle);
      canvas.removeEventListener("mouseout", () => setHoverIdx(null));
    };
  }, [width, data]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W = width * dpr;
    const H = height * dpr;
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const margin = { top: 40, right: 70, bottom: 60, left: 70 };
    const volFrac = 0.2; // Reduced volume chart height ratio
    const candleH = (height - margin.top - margin.bottom) * (1 - volFrac);
    const volH = (height - margin.top - margin.bottom) * volFrac;
    const volY0 = margin.top + candleH;

    const n = data.length;
    const bandW = (width - margin.left - margin.right) / n;
    const candleW = Math.max(2, bandW * 0.65);
    const wickW = Math.max(1, bandW * 0.2);

    // Extend y range by ±2%
    const rawMinLow = Math.min(...data.map(d => d.low));
    const rawMaxHigh = Math.max(...data.map(d => d.high));
    const range = rawMaxHigh - rawMinLow;
    const minLow = rawMinLow - range * 0.02;
    const maxHigh = rawMaxHigh + range * 0.02;
    const maxVol = Math.max(...data.map(d => d.volume));
    
    // Apply a log scale to volume to enhance visibility of smaller values
    const volScale = v => Math.log(v + 1) / Math.log(maxVol + 1); // Normalized log scale
    
    const yScale = v =>
      margin.top + ((maxHigh - v) / (maxHigh - minLow)) * candleH;

    // Clear
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f8f9fa"; // Light background
    ctx.fillRect(0, 0, width, height);

    // Add subtle grid
    ctx.strokeStyle = "#e9ecef";
    ctx.lineWidth = 1;
    
    // Horizontal grid lines (price)
    const priceStep = (maxHigh - minLow) / 5;
    for (let i = 0; i <= 5; i++) {
      const price = minLow + priceStep * i;
      const y = yScale(price);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
      
      // Price labels
      ctx.fillStyle = "#495057";
      ctx.font = "11px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(price.toFixed(2), margin.left - 8, y);
    }

    // Title with shadow
    ctx.fillStyle = "#212529";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "Reported Severity to Volume of Reports",
      width / 2,
      margin.top / 2
    );

    // Axes
    ctx.strokeStyle = "#adb5bd";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, volY0 + volH);
    ctx.lineTo(width - margin.right, volY0 + volH);
    ctx.stroke();

    // Axis Labels with improved styling
    // Y-axis label (vertical)
    ctx.save();
    ctx.fillStyle = "#495057";
    ctx.font = "13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.translate(margin.left / 3, margin.top + candleH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Weighted Severity", 0, 0);
    ctx.restore();

    // X-axis label
    ctx.fillStyle = "#495057";
    ctx.font = "13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    const xLabelX = margin.left + (width - margin.left - margin.right) / 2;
    const xLabelY = height - 10;
    ctx.fillText("Timeline", xLabelX, xLabelY);

    // Volume label
    ctx.save();
    ctx.fillStyle = "#495057";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.translate(width - margin.right + 12, volY0 + volH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Volume", 0, 0);
    ctx.restore();

    // Timeline ticks & labels
    const firstTime = new Date(data[0].interval_start).getTime();
    const lastTime = new Date(data[n - 1].interval_start).getTime();
    const totalMs = lastTime - firstTime;
    const targetCount = Math.min(8, Math.floor(width / 120)); // Adaptive tick count
    const stepMs = Math.ceil(totalMs / targetCount / (1000 * 60 * 60)) * (1000 * 60 * 60);

    ctx.fillStyle = "#495057";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let t = firstTime; t <= lastTime; t += stepMs) {
      const x = margin.left + ((t - firstTime) / totalMs) * (width - margin.left - margin.right);
      const dt = new Date(t);
      const label = dt.toLocaleString("en-GB", {
        hour: "2-digit",
        day: "2-digit",
        month: "2-digit"
      });
      
      // Vertical grid
      ctx.strokeStyle = "#e9ecef";
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, volY0 + volH);
      ctx.stroke();
      
      // Tick and label
      ctx.strokeStyle = "#adb5bd";
      ctx.beginPath();
      ctx.moveTo(x, volY0 + volH);
      ctx.lineTo(x, volY0 + volH + 5);
      ctx.stroke();
      ctx.fillText(label, x, volY0 + volH + 8);
    }

    // Candles, volumes & hover highlight
    data.forEach((d, i) => {
      const xC = margin.left + i * bandW + bandW / 2;
      const oY = yScale(d.open);
      const cY = yScale(d.close);
      const hY = yScale(d.high);
      const lY = yScale(d.low);
      const up = d.close >= d.open;
      
      // More appealing colors
      const upColor = "#e62950";   // Pink-red for up
      const downColor = "#33f05a"; // Blue for down
      const wickColor = "rgb(185, 185, 185)"; // Darker grey for wicks
      
      // Wick
      ctx.strokeStyle = wickColor;
      ctx.lineWidth = wickW;
      ctx.beginPath();
      ctx.moveTo(xC, hY);
      ctx.lineTo(xC, lY);
      ctx.stroke();

      // Body
      ctx.fillStyle = up ? upColor : downColor;
      const top = Math.min(oY, cY);
      const bh = Math.max(1, Math.abs(oY - cY));
      ctx.fillRect(xC - candleW / 2, top, candleW, bh);
      
      // Outline for better visibility
      ctx.strokeStyle = up ? "#c92a67" : "#1ca65e";
      ctx.lineWidth = 1;
      ctx.strokeRect(xC - candleW / 2, top, candleW, bh);

      // Volume bar (FLIPPED to hang down from xAxis and logarithmically scaled)
      const vScaled = volScale(d.volume) * volH * 0.9; // Scale factor to enhance visibility
      ctx.fillStyle = up ? "rgba(255, 0, 0, 0.5)" : "rgba(23, 255, 35, 0.5)";
      ctx.fillRect(
        xC - candleW / 2, 
        volY0,  // Start from the dividing line
        candleW, 
        vScaled // Go down by scaled amount
      );
      
      // Border for volume bars
      ctx.strokeStyle = up ? "rgba(231, 64, 64, 0.8)" : "rgba(57, 117, 51, 0.8)";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        xC - candleW / 2,
        volY0,
        candleW,
        vScaled
      );

      // Hover highlight with glow effect
      if (i === hoverIdx) {
        // Shadow for candle
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Highlight candle
        ctx.strokeStyle = "#212529";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          xC - candleW / 2 - 1,
          Math.min(hY, top) - 1,
          candleW + 2,
          Math.max(lY - hY, bh) + 2
        );
        
        // Highlight volume
        ctx.strokeRect(
          xC - candleW / 2 - 1,
          volY0 - 1,
          candleW + 2,
          vScaled + 2
        );
        
        // Reset shadow
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }
    });

    // Tooltip with improved design
    if (hoverIdx != null) {
      const d = data[hoverIdx];
      const xC = margin.left + hoverIdx * bandW + bandW / 2;
      
      // Format date nicely
      const date = new Date(d.interval_start);
      const formattedDate = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
      const formattedTime = date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit"
      });
      
      const tooltip = [
        `${formattedDate} ${formattedTime}`,
        `Open: ${d.open.toFixed(2)} | Close: ${d.close.toFixed(2)}`,
        `High: ${d.high.toFixed(2)} | Low: ${d.low.toFixed(2)}`,
        `Volume: ${d.volume.toLocaleString()}`
      ];
      
      const padding = 10;
      ctx.font = "12px Inter, sans-serif";
      
      // Calculate box size
      const textWidths = tooltip.map(t => ctx.measureText(t).width);
      const w = Math.max(...textWidths) + padding * 2;
      const h = tooltip.length * 18 + padding * 2;
      
      // Position tooltip smartly (avoid edge collisions)
      let boxX = xC + 10;
      if (boxX + w > width - margin.right) {
        boxX = xC - w - 10;
      }
      const boxY = margin.top + 10;
      
      // Draw tooltip box with shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.fillRect(boxX, boxY, w, h);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      
      // Border
      ctx.strokeStyle = "#adb5bd";
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX, boxY, w, h);
      
      // Draw text with section highlighting
      ctx.fillStyle = "#212529";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      
      // Date header
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.fillText(tooltip[0], boxX + padding, boxY + padding);
      
      // Details
      ctx.font = "12px Inter, sans-serif";
      for (let idx = 1; idx < tooltip.length; idx++) {
        const textX = boxX + padding;
        const textY = boxY + padding + idx * 18;
        ctx.fillText(tooltip[idx], textX, textY);
      }
    }
  }, [data, width, hoverIdx, height]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: "100%", 
        maxWidth: "100%", // Prevent expanding beyond container
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#f8f9fa",
        padding: "4px"
      }}
    >
      <canvas 
        ref={canvasRef} 
        style={{ 
          cursor: "crosshair",
          borderRadius: "4px",
          maxWidth: "100%", // Ensure canvas doesn't overflow
          display: "block" // Remove inline element spacing issues
        }} 
      />
    </div>
  );
}

CandleSeverityCanvas.propTypes = {
  height: PropTypes.number,
};