import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{
    correctedText: string;
    roast: string;
  } | null>(null);

  const fixGrammarMutation = trpc.grammar.fix.useMutation({
    onSuccess: (data) => setResult(data),
    onError: (error) => {
      toast.error(error.message || "Failed to fix grammar. Please try again.");
    },
  });

  const handleFix = () => {
    if (!input.trim()) {
      toast.error("Enter some text first.");
      return;
    }
    fixGrammarMutation.mutate({ text: input });
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied.");
    } catch {
      toast.error("Copy failed.");
    }
  };

  const handleReset = () => {
    setInput("");
    setResult(null);
    fixGrammarMutation.reset();
  };

  const isLoading = fixGrammarMutation.isPending;
  const charCount = input.length;
  const maxChars = 5000;

  return (
    <div className="ink-shell">
      <div className="ink-wrapper">

        {/* ── HEADER ── */}
        <header className="ink-header">
          <h1 className="ink-title">
            <em>grammerfix</em>
            <span className="ink-title-num">er3000</span>
          </h1>
          <div className="ink-rule" />
        </header>

        {/* ── CARD ── */}
        <main className="ink-card">

          {/* INPUT */}
          {!result && (
            <div className="ink-body">
              <label className="ink-label">your text</label>
              <textarea
                className="ink-textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="paste something broken here…"
                maxLength={maxChars}
                disabled={isLoading}
                rows={6}
              />
              <div className="ink-field-footer">
                {charCount > 0 ? (
                  <span className="ink-counter">{charCount} / {maxChars}</span>
                ) : (
                  <span />
                )}
              </div>

              <div className="ink-actions">
                <button
                  className="ink-btn-fix"
                  onClick={handleFix}
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? (
                    <span className="ink-loader">
                      <span /><span /><span />
                    </span>
                  ) : (
                    "Fix Grammar →"
                  )}
                </button>
                {input && !isLoading && (
                  <button className="ink-btn-ghost" onClick={handleReset}>
                    clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* RESULT */}
          {result && (
            <div className="ink-result">
              <p className="ink-result-label">corrected</p>
              <p className="ink-result-text">{result.correctedText}</p>
              <div className="ink-result-rule" />
              <div className="ink-result-actions">
                <button
                  className="ink-btn-ghost"
                  onClick={() => handleCopy(result.correctedText)}
                >
                  copy ↗
                </button>
                <button className="ink-btn-ghost" onClick={handleReset}>
                  try again
                </button>
              </div>
            </div>
          )}

          {fixGrammarMutation.isError && (
            <p className="ink-error">Something went wrong — try again.</p>
          )}
        </main>

        {/* ── FOOTER ── */}
        <footer className="ink-footer">
          <span>made by muzaib</span>
          <span className="ink-footer-dot" />
          <span>grammerfixer3000</span>
        </footer>

      </div>
    </div>
  );
}
