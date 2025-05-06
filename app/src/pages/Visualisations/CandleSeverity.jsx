/******************************************************************************
 *
 * A zero-dependency React component that renders a 30-minute
 * candlestick chart + volume bars for location-normalised
 * quake-severity data.  All drawing is done with plain <canvas>.
 *
 * Props
 * -----
 * data   : Array<{ interval_start, open, high, low, close, volume }>
 * height : number (default 450px)  – full canvas height
 *
 * Width is taken from the parent element; the chart automatically
 * redraws on window resize.
 ******************************************************************************/import React, { useRef, useEffect, useState } from "react";
import PropTypes from "prop-types";

export default function CandleSeverityCanvas({ height = 450 }) {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(800);
  const [data, setData]   = useState([]);

  // Fetch and parse CSV on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/data/resources/Q3/candlesseverity.csv");
        const csv = await res.text();
        const rows = csv.trim().split("\n").slice(1);
        const parsed = rows.map(line => {
          const [interval_start, open, high, low, close, volume] = line.split(",");
          return {
            interval_start,
            open:   Number(open),
            high:   Number(high),
            low:    Number(low),
            close:  Number(close),
            volume: Number(volume),
          };
        });
        setData(parsed);
      } catch (err) {
        console.error("Failed to load severity data:", err);
      }
    })();
  }, []);

  // Resize handling
  useEffect(() => {
    if (!containerRef.current) return;
    setWidth(containerRef.current.clientWidth);
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width))
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Draw on canvas when data, width, or height changes
  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const ctx = canvasRef.current.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W   = width  * dpr;
    const H   = height * dpr;

    canvasRef.current.width  = W;
    canvasRef.current.height = H;
    canvasRef.current.style.width  = `${width}px`;
    canvasRef.current.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Layout constants
    const margin   = { top: 20, right: 60, bottom: 30, left: 60 };
    const volFrac  = 0.22;
    const candleAreaH = (height - margin.top - margin.bottom) * (1 - volFrac);
    const volAreaH    = (height - margin.top - margin.bottom) * volFrac;
    const volAreaY0   = margin.top + candleAreaH;

    const n = data.length;
    const bandW = (width - margin.left - margin.right) / n;
    const candleW = Math.max(1, bandW * 0.6);
    const wickW   = Math.max(1, bandW * 0.2);

    // Pre-compute scales
    const minLow  = Math.min(...data.map(d => d.low));
    const maxHigh = Math.max(...data.map(d => d.high));
    const maxVol  = Math.max(...data.map(d => d.volume));
    const yScale = value =>
      margin.top + ((maxHigh - value) / (maxHigh - minLow)) * candleAreaH;

    // Clear + background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    // Axes
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left - 0.5, margin.top);
    ctx.lineTo(margin.left - 0.5, volAreaY0 + volAreaH);
    ctx.moveTo(margin.left, volAreaY0 + 0.5);
    ctx.lineTo(width - margin.right, volAreaY0 + 0.5);
    ctx.stroke();

    // Draw candles and volume bars
    data.forEach((d, i) => {
      const xCenter = margin.left + i * bandW + bandW / 2;
      const openY = yScale(d.open);
      const closeY= yScale(d.close);
      const highY = yScale(d.high);
      const lowY  = yScale(d.low);
      const isUp  = d.close >= d.open;
      const color = isUp ? "#26a69a" : "#ef5350";

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = wickW;
      ctx.beginPath();
      ctx.moveTo(xCenter, highY);
      ctx.lineTo(xCenter, lowY);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(openY, closeY);
      const bodyH   = Math.abs(openY - closeY);
      ctx.fillStyle = color;
      ctx.fillRect(xCenter - candleW / 2, bodyTop, candleW, Math.max(1, bodyH));

      // Volume bar
      const volH = (d.volume / maxVol) * volAreaH;
      ctx.fillRect(xCenter - candleW / 2, volAreaY0 + volAreaH - volH, candleW, volH);
    });

    // Tiny labels
    ctx.fillStyle = "#666";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(maxHigh.toFixed(1), margin.left - 8, yScale(maxHigh));
    ctx.fillText(minLow.toFixed(1), margin.left - 8, yScale(minLow));
    ctx.fillText("Vol", margin.left - 8, volAreaY0 + volAreaH / 2);
  }, [data, width, height]);

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

CandleSeverityCanvas.propTypes = {
  height: PropTypes.number,
};
