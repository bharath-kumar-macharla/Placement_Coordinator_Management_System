import { useState, useRef, useEffect } from "react";
import { aiApi } from "../api/index.js";
import Spinner from "./Spinner.jsx";

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm your Placement Drive Assistant. Ask me anything about your upcoming rounds, drive eligibility, or application statuses!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  async function handleSubmit(e) {
    e.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: query }]);
    setLoading(true);

    try {
      const { data } = await aiApi.assistantQuery(query);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer || "I could not find an answer for that query.",
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            err?.response?.data?.error?.message ||
            "I don't have that information right now. Please contact the coordinator.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {open && (
        <div className="card w-80 sm:w-96 h-[480px] shadow-2xl flex flex-col mb-4 border border-slate-200 overflow-hidden animate-fade-in bg-white">
          {/* Header */}
          <div className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <h3 className="font-semibold text-sm">Placement Assistant</h3>
                <p className="text-[11px] text-primary-100">Live AI Support</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded transition-colors"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs text-slate-600">
            <span className="text-slate-400 whitespace-nowrap">Try:</span>
            <button
              type="button"
              onClick={() => setInput("When is my next round?")}
              className="badge bg-white border border-slate-200 hover:border-primary-400 hover:text-primary-600 cursor-pointer whitespace-nowrap"
            >
              Next round?
            </button>
            <button
              type="button"
              onClick={() => setInput("Which drives am I eligible for?")}
              className="badge bg-white border border-slate-200 hover:border-primary-400 hover:text-primary-600 cursor-pointer whitespace-nowrap"
            >
              Eligible drives?
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed text-sm ${
                    m.role === "user"
                      ? "bg-primary-600 text-white rounded-br-xs"
                      : "bg-slate-100 text-slate-800 rounded-bl-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl px-3.5 py-2 rounded-bl-xs flex items-center gap-2 text-xs text-slate-500">
                  <Spinner size="sm" />
                  <span>Checking placement records...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-slate-100 bg-white flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about rounds, drives..."
              className="input-field text-sm flex-1 py-1.5"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary px-3 py-1.5 text-sm"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="h-13 w-13 rounded-full bg-primary-600 text-white shadow-xl hover:bg-primary-700 flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary-300"
        aria-label="Toggle Placement AI Assistant"
      >
        {open ? (
          <span className="text-xl">✕</span>
        ) : (
          <span className="text-2xl">💬</span>
        )}
      </button>
    </div>
  );
}
