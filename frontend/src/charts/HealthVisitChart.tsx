import { memo, useMemo, useState, type KeyboardEvent } from "react";
import { CartesianGrid, ComposedChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, XAxis, YAxis } from "recharts";
import type { HealthTrend, TrendPoint } from "../api/contracts";
import { fmt, RANGE_TEXT, rangeText } from "../lib/format";

interface DotProps { cx?: number; cy?: number; payload?: TrendPoint }
interface SampleProps extends DotProps { selected: string; points: TrendPoint[]; unit: string; onSelect: (visit: string) => void; onExplore: (visit: string | null) => void }
function MeasurementDot({ cx, cy, payload: p, selected, points, unit, onSelect, onExplore }: SampleProps) {
  if (cx === undefined || cy === undefined || !p || p.value === null) return <g />;
  const color = p.needs_review ? "#FFB357" : "#00D9C0";
  const active = p.visit === selected;
  const key = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(p.visit); }
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const index = points.findIndex(point => point.visit === p.visit);
      const next = event.key === "Home" ? 0 : event.key === "End" ? points.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + points.length) % points.length;
      document.getElementById(`health-point-${points[next].visit}`)?.focus();
    }
  };
  return <g id={`health-point-${p.visit}`} className="trend-sample" role="button" tabIndex={0} aria-pressed={active} aria-label={`${p.visit_label}: ${p.value} ${unit}, ${RANGE_TEXT[p.range_status]}`} aria-describedby="trend-point-details" data-visit-point={p.visit} data-value={p.value} onClick={() => onSelect(p.visit)} onKeyDown={key} onFocus={() => onExplore(p.visit)} onBlur={() => onExplore(null)} onMouseEnter={() => onExplore(p.visit)} onMouseLeave={() => onExplore(null)} style={{ cursor: "pointer" }}>
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

/** Seven independent samples on a categorical axis. No connecting line or interpolated values. */
export function HealthVisitChart({ trend, selectedVisit, onSelect }: { trend: HealthTrend; selectedVisit: string; onSelect: (visit: string) => void }) {
  const [explored, setExplored] = useState<string | null>(null);
  const pts = trend.points;
  const point = pts.find(p => p.visit === (explored ?? selectedVisit)) ?? pts[0];
  return <div className="trend-chart" role="group" aria-label={`${trend.marker_name} for ${trend.participant_id} across ${pts.length} historical visits in ${trend.unit}. Arrow keys explore points; Enter selects. Full values are in Source Data.`}>
    <div id="trend-point-details" className="trend-point-readout" role="tooltip">
      {point ? <><div><span className="trend-kicker">{explored ? "POINT DETAILS" : "SELECTED POINT"}</span><strong>{point.visit_label}</strong><span>{trend.marker_name}</span></div><div><strong className={point.needs_review ? "flagged" : ""}>{point.value === null ? "Not recorded" : String(point.value)} <small>{trend.unit}</small></strong><span>{RANGE_TEXT[point.range_status]}</span></div><div><span>Supplied range</span><strong>{rangeText(point.range_low, point.range_high, trend.unit)}</strong><span>Retrospective mean {trend.baseline.available ? `${fmt(trend.baseline.value)} (n = ${trend.baseline.n})` : `unavailable (n = ${trend.baseline.n})`}</span></div></> : <span>No recorded observations</span>}
    </div>
    <TrendPlot trend={trend} selectedVisit={selectedVisit} onSelect={onSelect} onExplore={setExplored} />
  </div>;
}
export function HealthChartLegend({ trend }: { trend: HealthTrend }) {
  return <div className="trend-legend"><span><i className="sample" />Measured sample</span><span><i className="flag" />Outside supplied range</span><span><i className="mean" />Retrospective mean{trend.baseline.available ? ` · n = ${trend.baseline.n}` : " unavailable"}</span><span><i className="bounds" />{trend.bounds_consistent ? "Supplied laboratory range" : "Supplied bounds per visit (they differ)"}</span></div>;
}

const BoundTick = ({ cx, cy }: DotProps) => cx === undefined || cy === undefined ? <g /> : <line x1={cx - 11} x2={cx + 11} y1={cy} y2={cy} stroke="#A8BDD0" strokeWidth={2} />;

const TrendPlot = memo(function TrendPlot({ trend, selectedVisit, onSelect, onExplore }: { trend: HealthTrend; selectedVisit: string; onSelect: (visit: string) => void; onExplore: (visit: string | null) => void }) {
  const pts = trend.points;
  const data = useMemo(() => pts.map(p => ({ ...p, x: p.visit })), [pts]);
  const numbers = pts.flatMap(p => [p.value, p.range_low, p.range_high]).concat(trend.baseline.value).filter((v): v is number => v !== null);
  const { domain, ticks } = niceScale(numbers.length ? Math.min(...numbers) : 0, numbers.length ? Math.max(...numbers) : 1);
  return (
    <div className="trend-plot">
      <ResponsiveContainer width="100%" height="100%"><ComposedChart data={data} margin={{ top: 28, right: 20, bottom: 14, left: 0 }} accessibilityLayer={false}>
        <CartesianGrid stroke="#263A4E" vertical={false} strokeDasharray="2 6" />
        {trend.bounds_consistent && trend.range_low !== null && trend.range_high !== null ? <ReferenceArea y1={trend.range_low} y2={trend.range_high} fill="#00D9C0" fillOpacity={0.045} stroke="#42636E" strokeOpacity={0.65} /> : null}
        <XAxis dataKey="x" type="category" interval={0} tick={{ fill: "#C6D5E3", fontSize: 13 }} tickMargin={14} tickLine={false} axisLine={{ stroke: "#31495C" }} padding={{ left: 20, right: 20 }} />
        <YAxis domain={domain} ticks={ticks} interval={0} width={52} tick={{ fill: "#A8BDD0", fontSize: 13 }} tickMargin={10} tickLine={false} axisLine={false} tickFormatter={(v: number) => fmt(v, 2)} />
        {trend.baseline.value !== null ? <ReferenceLine y={trend.baseline.value} stroke="#A8BDD0" strokeDasharray="5 6" strokeWidth={1.3} /> : null}
        {!trend.bounds_consistent ? <><Scatter dataKey="range_low" shape={<BoundTick />} isAnimationActive={false} legendType="none" name="Supplied lower bound" /><Scatter dataKey="range_high" shape={<BoundTick />} isAnimationActive={false} legendType="none" name="Supplied upper bound" /></> : null}
        <Scatter dataKey="value" shape={<MeasurementDot selected={selectedVisit} points={pts} unit={trend.unit} onSelect={onSelect} onExplore={onExplore} />} isAnimationActive={false} name={trend.marker_name} />
      </ComposedChart></ResponsiveContainer>
    </div>
  );
});
