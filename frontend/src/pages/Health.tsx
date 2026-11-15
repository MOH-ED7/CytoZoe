import { api } from "../api/client";
import type { HealthEvidence } from "../api/contracts";
import { useDrawer } from "../app/providers";
import { HealthChartLegend, HealthVisitChart } from "../charts/HealthVisitChart";
import { RangeStatusLine } from "../components/EvidencePanel";
import { PageHeader } from "../components/PageHeader";
import { MarkerTabs, ParticipantSelect, SampleSelect } from "../components/Selectors";
import { Alert, ErrorState, Skeleton } from "../components/StatusViews";
import { fmt, RANGE_TEXT, rangeText, REVIEW_LABEL, signed } from "../lib/format";
import { useAsync } from "../lib/useAsync";
import { MARKER_NAME, MARKERS, useHealthSelection } from "../lib/useHealthSelection";

export default function Health() {
  const { participants, resolved, notice, update } = useHealthSelection(true);
  const { open, dataVersion } = useDrawer();
  const pid = resolved?.participant.participant_id;
  const visit = resolved?.sample.visit;
  const marker = resolved?.marker ?? undefined;
  const enabled = Boolean(pid && visit && marker);
  const trend = useAsync(() => api.trend(pid!, marker!), [pid, marker, dataVersion], enabled);
  const overview = useAsync(() => api.health(pid!, visit!), [pid, visit, dataVersion], enabled);
  const replay = useAsync(() => api.healthReplay(pid!), [pid, dataVersion], Boolean(pid));
  // Never label a previous participant/visit's response as the newly selected observation.
  const t = trend.data?.participant_id === pid && trend.data?.marker === marker ? trend.data : null;
  const current = overview.data?.participant_id === pid && overview.data?.visit === visit ? overview.data : null;
  const ev: HealthEvidence | undefined = current?.cards.find(c => c.measurement.marker === marker);
  const frame = replay.data && replay.data.participant_id === pid ? replay.data.frames.find(f => f.visit === visit) : undefined;
  const prior = frame?.cards.find(c => c.marker === marker);
  const flagged = new Set(current?.cards.filter(c => c.measurement.needs_review).map(c => c.measurement.marker) ?? []);

  return <div className="health-trends">
    <PageHeader eyebrow="02 / HISTORICAL OBSERVATIONS" title="Health Trends" study="health" purpose="Explore actual historical biomarker measurements and their source evidence." />
    {participants.error ? <ErrorState error={participants.error} onRetry={participants.reload} /> : null}
    <div className="trend-controls">
      {resolved && participants.data ? <div className="trend-selectors" role="group" aria-label="Sample selection">
        <ParticipantSelect participants={participants.data} value={resolved.participant.participant_id} onChange={v => update({ participant: v })} />
        <SampleSelect samples={resolved.participant.samples} value={resolved.sample.visit} onChange={v => update({ sample: v })} />
      </div> : participants.loading ? <Skeleton height={64} label="Loading participants…" /> : null}
      {marker ? <MarkerTabs markers={MARKERS.map(m => ({ id: m, label: MARKER_NAME[m] }))} value={marker} flagged={flagged} onChange={m => update({ marker: m })} panelId="marker-panel" /> : null}
    </div>
    {notice ? <Alert tone="info">{notice}</Alert> : null}
    <div id="marker-panel" role="tabpanel" aria-labelledby={marker ? `tab-${marker}` : undefined}>
      <div className="trend-primary">
        <section className="trend-chart-panel" aria-labelledby="chart-title" aria-busy={trend.loading}>
          <div className="trend-chart-head"><div><p className="trend-kicker">HISTORICAL MEASUREMENTS</p><h2 id="chart-title">{t ? `${t.marker_name} by visit · ${t.participant_id}` : "Marker by visit"}</h2></div>{t ? <span className="trend-unit">{t.unit}</span> : null}</div>
          {trend.error ? <ErrorState error={trend.error} onRetry={trend.reload} /> : null}
          {!t && trend.loading ? <Skeleton height={440} label="Loading chart…" /> : null}
          {t && visit ? <><HealthVisitChart trend={t} selectedVisit={visit} onSelect={v => update({ sample: v })} /><HealthChartLegend trend={t} /><p className="trend-chart-note">Categorical visits · not equally spaced in time. Points are independent samples; no interpolation.</p></> : null}
        </section>
        <section className="trend-observation" aria-labelledby="observation-title" aria-busy={overview.loading}>
          <p className="trend-kicker">SELECTED OBSERVATION</p><h2 id="observation-title">Selected observation</h2>
          {overview.error ? <ErrorState error={overview.error} onRetry={overview.reload} /> : null}
          {!ev && overview.loading ? <Skeleton height={340} label="Loading selected observation…" /> : null}
          {ev ? <>
            <div className="trend-observation-context"><h3>{ev.measurement.marker_name}</h3><span>{ev.context.participant_id} / {ev.context.visit_label}</span></div>
            <div className={`trend-observation-value${ev.measurement.needs_review ? " flagged" : ""}`}>{ev.measurement.value === null ? "Not recorded" : String(ev.measurement.value)}<small>{ev.measurement.unit}</small></div>
            <RangeStatusLine status={ev.measurement.range_status} />
            <dl className="trend-observation-facts"><div><dt>Supplied laboratory range</dt><dd>{rangeText(ev.measurement.range_low, ev.measurement.range_high, ev.measurement.unit)}</dd></div><div><dt>Retrospective preflight mean</dt><dd>{ev.comparison.baseline_available ? `${fmt(ev.comparison.baseline)} ${ev.measurement.unit} (n = ${ev.comparison.n})` : `Not available (n = ${ev.comparison.n}; needs ≥ 2)`}</dd></div>{ev.comparison.delta !== null ? <div><dt>Difference from mean</dt><dd>{signed(ev.comparison.delta)} {ev.measurement.unit}{ev.comparison.percent_delta === null ? " · percentage unavailable (zero baseline)" : ` (${signed(ev.comparison.percent_delta, 2)}%)`}</dd></div> : null}</dl>
            <div className="trend-observation-actions"><button type="button" className="btn btn-primary" onClick={() => open({ kind: "evidence", id: ev.evidence_id })}>Inspect Evidence<span aria-hidden="true">↗</span></button><button type="button" className="btn btn-secondary" onClick={() => open({ kind: "evidence", id: ev.evidence_id, section: "review" })}>{ev.review ? "Update follow-up" : "Record follow-up"}</button></div>
            <p className="trend-observation-foot">{ev.review ? REVIEW_LABEL[ev.review.status] : "No review recorded"} · Not a diagnosis</p>
          </> : null}
        </section>
      </div>
      {t ? <div className="trend-secondary">
        <details className="trend-disclosure"><summary><span>Source Data</span><small>{t.points.length} original measurements</small></summary><div className="trend-disclosure-body table-wrap"><table className="data"><caption>{t.marker_name} ({t.unit}) for {t.participant_id} · original source rows, categorical visit order</caption><thead><tr><th scope="col">Historical visit</th><th scope="col" className="num">Value ({t.unit})</th><th scope="col" className="num">Supplied min</th><th scope="col" className="num">Supplied max</th><th scope="col">Range status</th><th scope="col">Source row</th><th scope="col">Evidence</th></tr></thead><tbody>{t.points.map(p => <tr key={p.visit} className={p.visit === visit ? "row-selected" : undefined} aria-current={p.visit === visit ? "true" : undefined}><td><button type="button" className="btn btn-ghost btn-sm" onClick={() => update({ sample: p.visit })} aria-label={`Select visit ${p.visit_label}`}>{p.visit_label}</button></td><td className="num">{p.value === null ? "missing" : String(p.value)}</td><td className="num">{fmt(p.range_low)}</td><td className="num">{fmt(p.range_high)}</td><td>{RANGE_TEXT[p.range_status]}</td><td>{p.source_row}</td><td><button type="button" className="btn btn-ghost btn-sm" aria-label={`Inspect source evidence for ${p.visit}`} onClick={() => open({ kind: "evidence", id: p.evidence_id })}>Inspect ↗</button></td></tr>)}</tbody></table></div></details>
        <details className="trend-disclosure"><summary><span>Baseline &amp; Methodology</span><small>Definitions, comparison &amp; caveats</small></summary><div className="trend-disclosure-body"><section aria-labelledby="baselines-title" aria-busy={replay.loading}><h2 id="baselines-title">Baseline comparison · {t.marker_name} · {frame?.visit_label ?? visit}</h2><p className="small muted">The retrospective mean uses all available preflight samples. The known-before-visit mean uses only earlier preflight visits, excluding the current and all future samples.</p>{replay.error ? <ErrorState error={replay.error} onRetry={replay.reload} /> : null}<div className="baselines"><div className="baseline-tile"><span className="k">Retrospective preflight mean</span><span className="v">{t.baseline.available ? `${fmt(t.baseline.value)} ${t.unit}` : "Not available"}</span><span className="small muted">n = {t.baseline.n} · {t.baseline.visits.join(", ") || "no preflight values"}</span><span className="small muted">Difference at this visit: {ev?.comparison.delta === null || ev?.comparison.delta === undefined ? "Not available" : `${signed(ev.comparison.delta)} ${t.unit}`}</span></div><div className="baseline-tile replay"><span className="k">Known before this visit (replay)</span>{prior ? <><span className="v">{prior.baseline_so_far === null ? "Not available" : `${fmt(prior.baseline_so_far)} ${prior.unit}`}</span><span className="small muted">n = {prior.n_so_far} · {frame?.baseline_visits?.length ? frame.baseline_visits.join(", ") : "no earlier preflight visit"}{prior.baseline_so_far === null ? " · needs at least 2 earlier preflight values" : ""}</span><span className="small muted">Difference at this visit: {prior.delta === null ? "Not available" : `${signed(prior.delta)} ${prior.unit}`}</span></> : <span className="small muted">{replay.loading ? "Loading prior-visit comparison…" : "Not available for this visit."}</span>}</div></div>{ev?.comparison.includes_selected_sample ? <p className="small muted">At this preflight visit, the retrospective mean includes the visit's own value. The replay baseline never does.</p> : null}<p className="small muted">{t.x_axis_note} Δ = measurement − baseline; %Δ is defined only for a non-zero baseline. Reference bounds belong to each source sample; no clinical thresholds are inferred. Rule: {t.rule_version}.</p></section></div></details>
      </div> : null}
    </div>
  </div>;
}
