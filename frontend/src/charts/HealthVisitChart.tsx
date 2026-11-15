import { memo, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { CartesianGrid, ComposedChart, Line, usePlotArea, useXAxisScale, useYAxisScale, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, XAxis, YAxis } from "recharts";
import type { HealthTrend, TrendPoint } from "../api/contracts";
import { fmt, RANGE_TEXT, rangeText } from "../lib/format";

interface DotProps { cx?: number; cy?: number; payload?: TrendPoint }
interface Preview { visit: string; x: number; y: number }
interface SampleProps extends DotProps { selected: string; points: TrendPoint[]; unit: string; onSelect: (visit: string) => void; onExplore: (preview: Preview | null) => void }
function MeasurementDot({ cx, cy, payload: p, selected, points, unit, onSelect, onExplore }: SampleProps) {
  if (cx === undefined || cy === undefined || !p || p.value === null) return <g />;
  const color = p.needs_review ? "#FFB357" : "#00D9C0";
  const active = p.visit === selected;
  const key = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(p.visit); }
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const selectable = points.filter(point => point.value !== null);
      const index = selectable.findIndex(point => point.visit === p.visit);
      const next = event.key === "Home" ? 0 : event.key === "End" ? selectable.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + selectable.length) % selectable.length;
      document.getElementById(`health-point-${selectable[next].visit}`)?.focus();
    }
  };
  return <g id={`health-point-${p.visit}`} className="trend-sample" role="button" tabIndex={0} aria-pressed={active} aria-label={`${p.visit_label}: ${p.value} ${unit}, ${RANGE_TEXT[p.range_status]}`} aria-describedby="trend-point-details" data-visit-point={p.visit} data-value={p.value} onClick={() => onSelect(p.visit)} onKeyDown={key} onFocus={() => onExplore({ visit: p.visit, x: cx, y: cy })} onBlur={() => onExplore(null)} onMouseEnter={() => onExplore({ visit: p.visit, x: cx, y: cy })} onMouseLeave={() => onExplore(null)} style={{ cursor: "pointer" }}>
    <circle cx={cx} cy={cy} r={19} fill="transparent" />
    {active ? <circle cx={cx} cy={cy} r={14} fill="none" stroke={color} strokeWidth={1.5} /> : null}
    <circle className="trend-point-focus" cx={cx} cy={cy} r={18} fill="none" stroke="#F4F7FB" strokeWidth={2} />
    <circle cx={cx} cy={cy} r={active ? 7 : 6} fill={color} stroke="#0E1E32" strokeWidth={2} />
  </g>;
}
/** Round axis bounds to a 1/2/5 × 10^k step so tick labels are readable values. */
export function niceScale(lo: number, hi: number, target = 5): { domain: [number, number]; ticks: number[] } {
  const span = hi - lo || Math.abs(hi) || 1;
  const raw = (span * 1.2) / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const start = Math.floor((lo - span * 0.08) / step) * step;
  const end = Math.ceil((hi + span * 0.08) / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Number(v.toFixed(6)));
  return { domain: [ticks[0], ticks[ticks.length - 1]], ticks };
}

/** Actual samples on an ordinal axis; thin linear guides do not represent unmeasured values. */
export function HealthVisitChart({ trend, selectedVisit, onSelect }: { trend: HealthTrend; selectedVisit: string; onSelect: (visit: string) => void }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => { setPreview(null); }, [trend.participant_id, trend.marker, selectedVisit]);
  useEffect(() => {
    const clearPreview = () => setPreview(null);
    window.addEventListener("resize", clearPreview);
    return () => window.removeEventListener("resize", clearPreview);
  }, []);
  const point = preview ? trend.points.find(p => p.visit === preview.visit) : undefined;
  const width = container.current?.clientWidth ?? 300;
  const tooltipWidth = Math.min(280, width - 16);
  const left = preview ? Math.max(8, Math.min(preview.x + 18, width - tooltipWidth - 8)) : 8;
  return <div ref={container} className="trend-chart" role="group" aria-label={`${trend.marker_name} for ${trend.participant_id} across ${trend.points.length} historical visits in ${trend.unit}. Arrow keys preview points; Enter selects. Full values are in Source Data.`}>
    <div id="trend-point-details" className="trend-preview-tooltip" role="tooltip" hidden={!point} style={{ left: `clamp(8px, ${left}px, max(8px, calc(100% - 288px)))`, top: preview ? preview.y + (preview.y > 180 ? -16 : 22) : 0, transform: preview && preview.y > 180 ? "translateY(-100%)" : undefined }}>
      {point ? <><span className="trend-kicker">{point.visit === selectedVisit ? "SELECTED POINT PREVIEW" : "TEMPORARY PREVIEW · NOT SELECTED"}</span><strong>{point.visit_label} · {trend.marker_name}</strong><span className={point.needs_review ? "flagged" : ""}>{point.value === null ? "Not recorded" : String(point.value)} {trend.unit}</span><span>{RANGE_TEXT[point.range_status]}</span><span>Supplied range {rangeText(point.range_low, point.range_high, trend.unit)}</span><span>Retrospective mean {trend.baseline.available ? `${fmt(trend.baseline.value)} (n = ${trend.baseline.n})` : `unavailable (n = ${trend.baseline.n})`}</span></> : null}
    </div>
    <TrendPlot trend={trend} selectedVisit={selectedVisit} onSelect={onSelect} onExplore={setPreview} />
  </div>;
}

export function HealthChartLegend({ trend }: { trend: HealthTrend }) {
  return <div className="trend-legend"><span><i className="sample" />Measured sample</span><span><i className="flag" />Outside supplied range</span><span><i className="mean" />Retrospective preflight mean{trend.baseline.available ? ` (n = ${trend.baseline.n})` : " unavailable"}</span><span><i className="guide" />Straight visual guide · no interpolation</span><span><i className="bounds" />{trend.bounds_consistent ? "Supplied laboratory range" : "Supplied bounds per visit (they differ)"}</span></div>;
}

const VisitTick = ({ x = 0, y = 0, payload }: { x?: number; y?: number; payload?: { value?: string } }) => <g transform={`translate(${x},${y})`}><text className="trend-visit-label" y={12} textAnchor="middle" fill="#C6D5E3" fontSize={13}>{payload?.value}</text></g>;

const BoundTick = ({ cx, cy }: DotProps) => cx === undefined || cy === undefined ? <g /> : <line x1={cx - 11} x2={cx + 11} y1={cy} y2={cy} stroke="#A8BDD0" strokeWidth={2} />;

const TrendPlot = memo(function TrendPlot({ trend, selectedVisit, onSelect, onExplore }: { trend: HealthTrend; selectedVisit: string; onSelect: (visit: string) => void; onExplore: (preview: Preview | null) => void }) {
  const pts = trend.points;
  const data = useMemo(() => pts.map(p => ({ ...p, x: p.visit })), [pts]);
  const numbers = pts.flatMap(p => [p.value, p.range_low, p.range_high]).concat(trend.baseline.value).filter((v): v is number => v !== null);
  const { domain, ticks } = niceScale(numbers.length ? Math.min(...numbers) : 0, numbers.length ? Math.max(...numbers) : 1);
  return (
    <div className="trend-plot">
      <ResponsiveContainer width="100%" height="100%"><ComposedChart data={data} margin={{ top: 40, right: 24, bottom: 14, left: 0 }} accessibilityLayer={false}>
        <CartesianGrid stroke="#263A4E" vertical={false} strokeDasharray="2 6" />
        {trend.bounds_consistent && trend.range_low !== null && trend.range_high !== null ? <ReferenceArea y1={trend.range_low} y2={trend.range_high} fill="#00D9C0" fillOpacity={0.045} stroke="#42636E" strokeOpacity={0.65} /> : null}
        <VisitContext trend={trend} />
        <XAxis dataKey="x" type="category" interval={0} tick={<VisitTick />} tickMargin={14} tickLine={false} axisLine={{ stroke: "#31495C" }} padding={{ left: 26, right: 26 }} />
        <YAxis domain={domain} ticks={ticks} interval={0} width={52} tick={{ fill: "#A8BDD0", fontSize: 13 }} tickMargin={10} tickLine={false} axisLine={false} tickFormatter={(v: number) => fmt(v, 2)} />
        {trend.baseline.value !== null ? <ReferenceLine y={trend.baseline.value} stroke="#A8BDD0" strokeDasharray="5 6" strokeWidth={1.3} /> : null}
        {!trend.bounds_consistent ? <><Scatter dataKey="range_low" shape={<BoundTick />} isAnimationActive={false} legendType="none" name="Supplied lower bound" /><Scatter dataKey="range_high" shape={<BoundTick />} isAnimationActive={false} legendType="none" name="Supplied upper bound" /></> : null}
        <Line dataKey="value" type="linear" stroke="#00D9C0" strokeOpacity={0.55} strokeWidth={1.5} dot={false} activeDot={false} connectNulls={false} isAnimationActive={false} name="Straight visual guide only" />
        <Scatter dataKey="value" shape={<MeasurementDot selected={selectedVisit} points={pts} unit={trend.unit} onSelect={onSelect} onExplore={onExplore} />} isAnimationActive={false} name={trend.marker_name} />
      </ComposedChart></ResponsiveContainer>
    </div>
  );
});

/** Presentation-only SVG annotations use Recharts' own scales and the source bounds, never new calculations. */
function VisitContext({ trend }: { trend: HealthTrend }) {
  const area = usePlotArea(); const x = useXAxisScale(); const y = useYAxisScale();
  if (!area || !x || !y) return null;
  const positioned = trend.points.map(p => ({ p, cx: x(p.visit, { position: "middle" }) }));
  const pre = positioned.filter(({p}) => p.phase === "PREFLIGHT");
  const post = positioned.filter(({p}) => p.phase === "POSTFLIGHT");
  const lastPre = pre[pre.length - 1]?.cx; const firstPost = post[0]?.cx;
  const separator = lastPre !== undefined && firstPost !== undefined ? (lastPre + firstPost) / 2 : undefined;
  return <g className="trend-visit-context" aria-hidden="true" pointerEvents="none">
    {!trend.bounds_consistent ? positioned.map(({p,cx},i) => {
      if (cx === undefined || p.range_low === null || p.range_high === null) return null;
      const top = y(p.range_high); const bottom = y(p.range_low);
      if (top === undefined || bottom === undefined) return null;
      const adjacent = positioned[i + 1]?.cx ?? positioned[i - 1]?.cx;
      const width = adjacent === undefined ? 24 : Math.abs(adjacent - cx) * .72;
      const left = Math.max(area.x, cx-width/2);
      const right = Math.min(area.x+area.width, cx+width/2);
      return <rect key={p.visit} data-visit-range={p.visit} data-low={p.range_low} data-high={p.range_high} x={left} y={Math.min(top,bottom)} width={Math.max(0,right-left)} height={Math.abs(bottom-top)} fill="#00D9C0" fillOpacity={.055} stroke="#42636E" strokeOpacity={.75} />;
    }) : null}
    {separator !== undefined ? <>
      <line data-phase-separator="true" x1={separator} x2={separator} y1={area.y} y2={area.y+area.height} stroke="#637D91" strokeDasharray="3 6" />
      <text x={(area.x+separator)/2} y={area.y-15} textAnchor="middle" fill="#A8BDD0" fontSize={10} letterSpacing={1}>PREFLIGHT VISITS</text>
      <text x={(separator+area.x+area.width)/2} y={area.y-15} textAnchor="middle" fill="#A8BDD0" fontSize={10} letterSpacing={1}>POSTFLIGHT VISITS</text>
      <title>Boundary between preflight and postflight visit groups; not a precise launch timestamp.</title>
    </> : null}
  </g>;
}
