import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const [input, setInput] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [elevatedText, setElevatedText] = useState("");
  const [clarifiedText, setClarifiedText] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const fixMutation = trpc.grammar.fix.useMutation({
    onSuccess: (data) => {
      setCorrectedText(data.correctedText);
      setError("");
    },
    onError: (err) => setError(err.message || "Something went wrong."),
  });

  const elevateMutation = trpc.grammar.elevate.useMutation({
    onSuccess: (data) => {
      setElevatedText(data.elevatedText);
      setError("");
    },
    onError: (err) => setError(err.message || "Elevate failed."),
  });

  const clarifyMutation = trpc.grammar.clarify.useMutation({
    onSuccess: (data) => {
      setClarifiedText(data.clarifiedText);
      setError("");
    },
    onError: (err) => setError(err.message || "Clarity mode failed."),
  });

  const handleFix = () => {
    if (!input.trim()) return;
    setError("");
    setCorrectedText("");
    setElevatedText("");
    setClarifiedText("");
    fixMutation.mutate({ text: input });
  };

  const handleElevate = () => {
    if (!correctedText) return;
    setElevatedText("");
    elevateMutation.mutate({ text: correctedText });
  };

  const handleClarify = () => {
    if (!correctedText) return;
    setClarifiedText("");
    clarifyMutation.mutate({ text: correctedText });
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Copy failed.");
    }
  };

  const handleReset = () => {
    setInput("");
    setCorrectedText("");
    setElevatedText("");
    setClarifiedText("");
    setError("");
    fixMutation.reset();
    elevateMutation.reset();
    clarifyMutation.reset();
  };

  const isFixing = fixMutation.isPending;
  const maxChars = 5000;
  const showResult = !!correctedText;

  return (
    <div className="scene">
      <div className="stage">

        {/* ── HERO TITLE ── */}
        <header className="hero">
          <span className="hero-top">fix my</span>
          <span className="hero-mid">Damn</span>
          <span className="hero-bot">Sentence<span className="hero-dot">.</span></span>
        </header>

        {/* ── APP WINDOW ── */}
        <div className="window">

          {/* TITLE BAR */}
          <div className="window-bar">
            <div className="window-dots">
              <i /><i /><i />
            </div>
            <span className="window-title">Fix My <span className="window-title-accent">DAMN</span> Sentence</span>
            {!showResult && input.length > 0 && (
              <span className="window-meta">{input.length}/{maxChars}</span>
            )}
            {showResult && (
              <span className="window-meta">corrected</span>
            )}
          </div>

          {/* INPUT VIEW */}
          {!showResult && (
            <textarea
              id="grammar-input"
              className="editor"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="paste something broken here…"
              maxLength={maxChars}
              disabled={isFixing}
            />
          )}

          {/* RESULT VIEW */}
          {showResult && (
            <div className="result">
              <div className="result-original">
                <span className="result-label">original</span>
                <p className="original-text">{input}</p>
              </div>

              <div className="result-corrected">
                <span className="result-label">corrected</span>
                <p className="result-body">{correctedText}</p>
              </div>

              <div className="result-divider" />

              <div className="result-actions">
                <button
                  id="copy-btn"
                  className="btn-pill"
                  onClick={() => handleCopy(correctedText, "corrected")}
                >
                  {copied === "corrected" ? "copied ✓" : "copy ↗"}
                </button>
                <button id="reset-btn" className="btn-pill" onClick={handleReset}>
                  try again
                </button>
                <button
                  id="elevate-btn"
                  className="btn-pill"
                  onClick={handleElevate}
                  disabled={elevateMutation.isPending}
                >
                  {elevateMutation.isPending ? "elevating…" : "elevate ✦"}
                </button>
                <button
                  id="clarify-btn"
                  className="btn-pill"
                  onClick={handleClarify}
                  disabled={clarifyMutation.isPending}
                >
                  {clarifyMutation.isPending ? "clarifying…" : "clarity ●"}
                </button>
              </div>

              {/* ELEVATED */}
              {elevateMutation.isPending && !elevatedText && (
                <div className="extra-panel">
                  <p className="extra-label">elevating</p>
                  <span className="dots dots--inline"><i /><i /><i /></span>
                </div>
              )}
              {elevatedText && (
                <div className="extra-panel">
                  <p className="extra-label">elevated ✦</p>
                  <p className="extra-body">{elevatedText}</p>
                  <div className="extra-actions">
                    <button
                      id="copy-elevated-btn"
                      className="btn-pill"
                      onClick={() => handleCopy(elevatedText, "elevated")}
                    >
                      {copied === "elevated" ? "copied ✓" : "copy ↗"}
                    </button>
                  </div>
                </div>
              )}

              {/* CLARIFIED */}
              {clarifyMutation.isPending && !clarifiedText && (
                <div className="extra-panel">
                  <p className="extra-label">clarifying</p>
                  <span className="dots dots--inline"><i /><i /><i /></span>
                </div>
              )}
              {clarifiedText && (
                <div className="extra-panel">
                  <p className="extra-label">clarity ●</p>
                  <p className="extra-body">{clarifiedText}</p>
                  <div className="extra-actions">
                    <button
                      id="copy-clarified-btn"
                      className="btn-pill"
                      onClick={() => handleCopy(clarifiedText, "clarified")}
                    >
                      {copied === "clarified" ? "copied ✓" : "copy ↗"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && <p className="error-msg">{error}</p>}
        </div>

        {/* ── ACTION BAR (outside window) ── */}
        {!showResult && (
          <div className="action-bar">
            <button
              id="fix-btn"
              className="btn-fix"
              onClick={handleFix}
              disabled={isFixing || !input.trim()}
            >
              {isFixing ? (
                <span className="dots">
                  <i /><i /><i />
                </span>
              ) : (
                <>
                  <span className="btn-fix-icon">⚡</span>
                  Fix Grammar
                </>
              )}
            </button>
            {input && !isFixing && (
              <button id="clear-btn" className="btn-clear" onClick={handleReset}>
                clear
              </button>
            )}
          </div>
        )}

        {/* ── FOOTER ── */}
        <footer className="credits">
          <span>made by muzaib <i className="dot" /> v6</span>
        </footer>

      </div>
    </div>
  );
}
