import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BrandMark, IconArrow, IconClose, IconMenu } from "../components/icons";

const WORKSPACE = "/overview?participant=C001&sample=L-3";
const NAV = [["Mission", "mission"], ["The process", "how"], ["The science", "science"], ["Our principles", "principles"]];
const PROCESS = [
  ["01", "Observe", "Find the change.", "Explore five biomarkers from a real historical research sample.", WORKSPACE],
  ["02", "Inspect evidence", "Follow the source.", "See the original row, laboratory bounds, baseline and calculation.", "/health?participant=C001&sample=L-3&marker=creatinine"],
  ["03", "Review", "Keep your reasoning.", "Record a human-reviewed note and follow-up status, saved locally.", "/reviews"],
  ["04", "Export", "Carry the evidence.", "Download the measurements, sources and review history as HTML or JSON.", "/reviews"],
];
const PRINCIPLES = [
  ["Source-linked", "Every measurement has an origin.", "Original file, row, column and SHA-256. A clear path from the screen to the source."],
  ["Reproducible", "The method stays visible.", "Descriptive comparisons and sensor integration. Conflicting readings are quarantined, never guessed."],
  ["Human-reviewed", "Your decisions stay yours.", "Saved notes, version checks and review history. Explanations use fixed templates, not a language model."],
  ["Local-first", "Evidence, even without a connection.", "After setup, inspect, save and export with the local service running. No runtime cloud dependency."],
];
function Scene({ name, alt, hero = false }: { name: string; alt: string; hero?: boolean }) {
  return <picture><source media="(max-width: 700px)" srcSet={`/media/orbital/${name}-800.webp`} type="image/webp" /><img src={`/media/orbital/${name}-1600.webp`} srcSet={`/media/orbital/${name}-800.webp 800w, /media/orbital/${name}-1600.webp 1600w`} sizes={hero ? "100vw" : "(max-width: 760px) 100vw, 50vw"} alt={alt} width={1600} height={900} loading={hero ? "eager" : "lazy"} fetchPriority={hero ? "high" : "auto"} decoding="async" /></picture>;
}

/** Public, entirely local introduction. Illustrations are not source measurements. */
export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { document.title = "CytoZoe — Space Health Intelligence"; }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setMenuOpen(false); document.getElementById("landing-menu-toggle")?.focus(); } };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [menuOpen]);
  return (
    <div className="landing">
      <a className="skip-link" href="#intro">Skip to content</a>
      <header className="l-top"><div className="l-wrap l-top-inner">
        <Link to="/" className="l-brand"><BrandMark /><span>CytoZoe<span className="l-brand-sub">ORBITAL INTELLIGENCE</span></span></Link>
        <button id="landing-menu-toggle" className="l-menu-toggle" aria-controls="landing-nav" aria-expanded={menuOpen} aria-label={menuOpen ? "Close landing navigation" : "Open landing navigation"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <IconClose /> : <IconMenu />}</button>
        <nav id="landing-nav" className={`l-nav${menuOpen ? " is-open" : ""}`} aria-label="Landing navigation">
          {NAV.map(([label, id]) => <a href={`#${id}`} key={id} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <Link to={WORKSPACE} className="l-btn l-btn-outline l-nav-launch" onClick={() => setMenuOpen(false)}>Open Workspace<IconArrow /></Link>
        </nav>
      </div></header>
      <main id="intro" tabIndex={-1}>
        <section className="l-hero" aria-labelledby="hero-title">
          <div className="l-hero-media"><Scene name="orbit" hero alt="AI illustration of sunrise over Earth's curved horizon with an orbital station above it" /></div>
          <div className="l-hero-shade" aria-hidden="true" />
          <div className="l-wrap l-hero-content">
            <p className="l-kicker">NASA SPACE APPS CHALLENGE 2026</p>
            <h1 id="hero-title">CytoZoe<span>Space Health<br /><em>Intelligence.</em></span></h1>
            <p className="l-sub">Explore historical astronaut health evidence, understand meaningful changes, and document decisions with complete traceability.</p>
            <div className="l-cta"><Link to={WORKSPACE} className="l-btn l-btn-primary">Launch Workspace<IconArrow /></Link><a href="#science" className="l-btn l-btn-text">Explore the Science<span aria-hidden="true">↘</span></a></div>
            <p className="l-hero-note">Independent research prototype <span aria-hidden="true">/</span> Historical data, not live telemetry</p>
          </div>
          <div className="l-hero-bottom l-wrap"><span>Understand the change. Keep the evidence.</span><a href="#mission">Discover the mission <span aria-hidden="true">↓</span></a><span className="l-art-note">AI-generated illustration</span></div>
        </section>

        <section id="mission" className="l-section l-mission" aria-labelledby="mission-title">
          <div className="l-wrap l-editorial">
            <figure className="l-editorial-image"><Scene name="researcher" alt="AI illustration of a space researcher reviewing a tablet beside an Earth-facing window" /><figcaption>Illustrative vision · not a mission photograph</figcaption></figure>
            <div className="l-editorial-copy"><p className="l-kicker">01 / THE HUMAN QUESTION</p><h2 id="mission-title">Far from Earth.<br />Closer to <em>the evidence.</em></h2><p className="l-lead">A measurement is only the beginning.</p><p>When communication is limited, clear context matters. A reviewer needs to understand what changed, where the observation came from, and what the available data cannot tell them.</p><p>CytoZoe brings that reasoning together in one local workspace: historical research, transparent methods, and a follow-up you can return to.</p><a href="#how" className="l-inline-link">From observation to decision<IconArrow /></a></div>
          </div>
        </section>

        <section id="how" className="l-section l-process" aria-labelledby="how-title"><div className="l-wrap">
          <div className="l-section-head"><p className="l-kicker">02 / THE PROCESS</p><h2 id="how-title">A clear path.<br /><em>An accountable decision.</em></h2><p>Four connected steps. Nothing gets lost between an observation and the record of what happened next.</p></div>
          <ol className="l-flow">{PROCESS.map(([n, label, title, text, to]) => <li key={n}><Link to={to}><span className="l-flow-top"><span>{n}</span><IconArrow /></span><span className="l-flow-label">{label}</span><h3>{title}</h3><p>{text}</p></Link></li>)}</ol>
        </div></section>

        <section id="science" className="l-section l-science" aria-labelledby="science-title"><div className="l-wrap">
          <div className="l-section-head"><p className="l-kicker">03 / THE SCIENCE</p><h2 id="science-title">Two real research cases.<br /><em>Two distinct perspectives.</em></h2><p>Historical NASA research is the evidence. The illustrations are only a window into its context.</p></div>
          <div className="l-cases">
            <article className="l-case"><div className="l-case-image"><Scene name="laboratory" alt="AI illustration of a researcher handling laboratory samples aboard a spacecraft" /><span>AI illustration</span></div><div className="l-case-copy"><p className="l-kicker">HEALTH / NASA OSD-575</p><h3>Small samples.<br />Meaningful context.</h3><p>Inspiration4 serum measurements, compared with the laboratory bounds supplied in the source and each participant’s retrospective preflight baseline. Sparse blood draws—not continuous monitoring.</p><Link to={WORKSPACE} className="l-inline-link">Explore health evidence<IconArrow /></Link></div></article>
            <article className="l-case"><div className="l-case-image"><Scene name="aurora" alt="AI illustration of an orbital station above Earth's green aurora" /><span>AI illustration</span></div><div className="l-case-copy"><p className="l-kicker">ENVIRONMENT / NASA RADLAB</p><h3>The environment.<br />With uncertainty visible.</h3><p>One historical day of DosTel1 readings from the ISS Columbus module. Inspect sensor dose rates, covered intervals and contradictory records kept apart from accepted calculations.</p><Link to="/environment" className="l-inline-link">Explore radiation evidence<IconArrow /></Link></div></article>
          </div>
          <p className="l-case-boundary"><span aria-hidden="true">↳</span> Different missions, dates and people. The radiation record is never linked to an Inspiration4 participant. Sensor dose is not personal dose.</p>
        </div></section>

        <section id="principles" className="l-section l-principles" aria-labelledby="principles-title"><div className="l-wrap l-principles-layout">
          <div className="l-principles-heading"><p className="l-kicker">04 / SCIENTIFIC TRANSPARENCY</p><h2 id="principles-title">Trust is built<br />in the <em>details.</em></h2><p>No invented measurements. No diagnostic claims. A research tool that makes its boundaries as visible as its findings.</p><span className="l-principles-seal"><BrandMark />EVIDENCE BEFORE INFERENCE</span></div>
          <dl className="l-principles-list">{PRINCIPLES.map(([tag, title, text], i) => <div key={tag}><dt><span className="l-principle-index">0{i + 1}</span><span><small>{tag}</small>{title}</span></dt><dd>{text}</dd></div>)}</dl>
        </div></section>

        <section className="l-final" aria-labelledby="final-title"><div className="l-final-orbit" aria-hidden="true" /><div className="l-wrap"><p className="l-kicker">YOUR NEXT OBSERVATION STARTS HERE</p><h2 id="final-title">Every observation<br />deserves <em>evidence.</em></h2><p>From historical space research to traceable decisions.</p><Link to={WORKSPACE} className="l-btn l-btn-primary">Enter CytoZoe Workspace<IconArrow /></Link></div></section>
      </main>
      <footer className="l-footer"><div className="l-wrap">
        <div className="l-footer-top"><Link to="/" className="l-brand"><BrandMark />CytoZoe</Link><p>Understand the change.<br />Keep the evidence.</p><a href="https://github.com/MOH-ED7/CytoZoe" target="_blank" rel="noreferrer noopener">Project repository<IconArrow /></a></div>
        <div className="l-footer-bottom"><div><h2>Research &amp; visual credits</h2><p>Data: <a href="https://osdr.nasa.gov/bio/repo/data/studies/OSD-575" target="_blank" rel="noreferrer noopener">NASA OSDR · OSD-575</a> and <a href="https://visualization.osdr.nasa.gov/radlab/gui/knowledgebase/DosTel1" target="_blank" rel="noreferrer noopener">NASA RadLab · DosTel1</a>.</p><p>All cinematic visuals are AI-generated illustrations, not NASA photography or scientific evidence. Bundled locally for offline use.</p></div><p>Independent research prototype. Historical data, not live telemetry. Not a medical device. Not affiliated with or endorsed by NASA. External source links need internet.</p></div>
        <div className="l-footer-line"><span>CYTOZOE / NASA SPACE APPS CHALLENGE 2026</span><a href="#intro">Back to orbit ↑</a></div>
      </div></footer>
    </div>
  );
}
