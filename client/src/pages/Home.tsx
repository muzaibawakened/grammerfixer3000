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
      {/* atmospheric blooms */}
      <div className="bloom bloom--amber" />
      <div className="bloom bloom--teal" />
      <div className="bloom bloom--center" />

      <div className="stage">

        {/* ── FILM TITLE ── */}
        <header className="title-block">
          <h1 className="title">
            <span className="title-main">grammerfix</span>
            <span className="title-suffix">er3000</span>
          </h1>
          <span className="title-sub">version five</span>
          <span className="title-line" />
        </header>

        {/* ── GLASS PANEL ── */}
        <main className="glass">

          {/* INPUT */}
          {!showResult && (
            <div className="input-area">
              <textarea
                id="grammar-input"
                className="input-field"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="paste something broken here…"
                maxLength={maxChars}
                disabled={isFixing}
                rows={7}
              />
              <div className="input-meta">
                {input.length > 0 && (
                  <span className="char-count">{input.length} / {maxChars}</span>
                )}
              </div>

              <div className="btn-row">
                <button
                  id="fix-btn"
                  className="btn-primary"
                  onClick={handleFix}
                  disabled={isFixing || !input.trim()}
                >
                  {isFixing ? (
                    <span className="dots">
                      <i /><i /><i />
                    </span>
                  ) : (
                    "Fix Grammar →"
                  )}
                </button>
                {input && !isFixing && (
                  <button id="clear-btn" className="btn-ghost" onClick={handleReset}>
                    clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* RESULT */}
          {showResult && (
            <div className="result">
              <p className="result-tag">corrected</p>
              <p className="result-body">{correctedText}</p>
              <div className="result-line" />
              <div className="result-actions">
                <button
                  id="copy-btn"
                  className="btn-ghost"
                  onClick={() => handleCopy(correctedText, "corrected")}
                >
                  {copied === "corrected" ? "copied ✓" : "copy ↗"}
                </button>
                <span className="sep" />
                <button id="reset-btn" className="btn-ghost" onClick={handleReset}>
                  try again
                </button>
                <span className="sep" />
                <button
                  id="elevate-btn"
                  className="btn-ghost"
                  onClick={handleElevate}
                  disabled={elevateMutation.isPending}
                >
                  {elevateMutation.isPending ? "elevating…" : "elevate ✦"}
                </button>
                <span className="sep" />
                <button
                  id="clarify-btn"
                  className="btn-ghost"
                  onClick={handleClarify}
                  disabled={clarifyMutation.isPending}
                >
                  {clarifyMutation.isPending ? "clarifying…" : "clarity ●"}
                </button>
              </div>

              {/* ELEVATED */}
              {elevateMutation.isPending && !elevatedText && (
                <div className="extra-panel">
                  <p className="extra-tag">elevating</p>
                  <span className="dots dots--inline"><i /><i /><i /></span>
                </div>
              )}
              {elevatedText && (
                <div className="extra-panel">
                  <p className="extra-tag">elevated ✦</p>
                  <p className="extra-body">{elevatedText}</p>
                  <div className="extra-actions">
                    <button
                      id="copy-elevated-btn"
                      className="btn-ghost"
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
                  <p className="extra-tag">clarifying</p>
                  <span className="dots dots--inline"><i /><i /><i /></span>
                </div>
              )}
              {clarifiedText && (
                <div className="extra-panel">
                  <p className="extra-tag">clarity ●</p>
                  <p className="extra-body">{clarifiedText}</p>
                  <div className="extra-actions">
                    <button
                      id="copy-clarified-btn"
                      className="btn-ghost"
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
        </main>

        {/* ── CREDITS ── */}
        <footer className="credits">
          <span>made by muzaib <i className="dot" /> v5</span>
        </footer>

      </div>
    </div>
  );
}
