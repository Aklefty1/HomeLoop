'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { ArrowLeft, Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  'What maintenance should I prioritize this month?',
  'When should I replace my water heater?',
  'How much would it cost to replace my HVAC system?',
  'What are the most common issues with homes built in my year?',
  'Are any of my systems overdue for service?',
];

export default function AssistantPage() {
  const params = useParams();
  const homeId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(question?: string) {
    const text = question || input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeId, question: text }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Sorry, I couldn't process that: ${data.error}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.answer },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        },
      ]);
    }

    setLoading(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <AppShell>
      <Link
        href={`/homes/${homeId}`}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-4"
      >
        <ArrowLeft size={16} />
        Back to home
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-full bg-neutral-900 flex items-center justify-center">
          <Bot size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Home Assistant</h1>
          <p className="text-xs text-neutral-400">
            Ask anything about your home — powered by your actual data
          </p>
        </div>
      </div>

      {/* Chat area */}
      <div className="border border-neutral-200 rounded-xl bg-white overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 260px)', minHeight: '400px' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Bot size={32} className="mx-auto text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-500 font-medium">
                Ask me anything about your home
              </p>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                I know about your systems, maintenance schedule, and vendors. I can help with cost estimates, seasonal tips, and more.
              </p>

              {/* Suggested questions */}
              <div className="mt-6 space-y-2 max-w-md mx-auto">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="block w-full text-left text-sm px-4 py-2.5 border border-neutral-200 rounded-lg hover:border-neutral-400 hover:bg-neutral-50 transition-colors text-neutral-600"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={14} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-800'
                  }`}
                >
                  {/* Render AI responses with basic formatting */}
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j} className={j > 0 ? 'mt-2' : ''}>
                      {line}
                    </p>
                  ))}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={14} className="text-neutral-600" />
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-neutral-100 rounded-xl px-4 py-3 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-neutral-400" />
                <span className="text-sm text-neutral-400">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-neutral-200 p-3">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your home..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="bg-neutral-900 text-white px-4 py-2.5 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
