'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  Building2,
  Bus,
  CreditCard,
  HeartPulse,
  Sliders,
  Copy,
  Check,
  Calculator,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  TrendingDown,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { ChatMessage, ChatResponse, ChatCostBreakdown } from '@/shared/types';
import { apiClient } from '@/shared/api-client';

const STARTER_PROMPTS = [
  {
    category: '🧮 Cost Simulation',
    title: 'Calculate £130/wk flat in Dennistoun',
    query: 'Calculate true cost for £130/wk flat in Dennistoun including bills and travel',
  },
  {
    category: '🚌 Transport Rights',
    title: 'How to get Free Bus Travel under 22',
    query: 'How to get Free Bus Pass under 22 in Scotland as a university student?',
  },
  {
    category: '🏥 NHS Scotland',
    title: 'Free NHS Prescriptions & Dental',
    query: 'What healthcare is free in Scotland compared to England for students?',
  },
  {
    category: '💳 Banking Perks',
    title: 'Santander Free 4-Year Railcard',
    query: 'Which student bank gives a free 4-year Railcard and 0% overdraft?',
  },
  {
    category: '⚖️ Tenancy Rules',
    title: 'Council Tax & 5-Week Deposit Cap',
    query: 'What are the rules for student council tax exemption and deposit limits in Scotland?',
  },
  {
    category: '⚖️ Trade-off Simulator',
    title: 'Outer Flat vs On-Campus Hall',
    query: 'Is an outer flat really cheaper than an on-campus hall all-in?',
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `👋 **Welcome to the Glasgow Student Living AI Advisor!**\n\nI am Finley, your dedicated assistant for navigating Glasgow accommodation, transport passes, student banking, and NHS Scotland healthcare entitlements.\n\nType any query below, calculate a private flat rent, or select a starter topic from the left panel!`,
      timestamp: 'Just now',
      suggestedActions: [
        { label: 'Calculate Living Budget', href: '/onboarding', icon: 'budget' },
        { label: 'View Accommodation', href: '/accommodation', icon: 'home' },
        { label: 'NHS Healthcare Guide', href: '/healthcare', icon: 'health' },
      ],
      quickReplies: [
        'Calculate true cost for £130/wk flat',
        'How to get Free Bus Pass under 22?',
        'What healthcare is free in Scotland?',
        'Which bank gives a free 4-year Railcard?',
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customRent, setCustomRent] = useState('135');
  const [customArea, setCustomArea] = useState('Dennistoun');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    try {
      await new Promise((res) => setTimeout(res, 500));
      const res = await apiClient.sendChatMessage(text, messages);
      const data: ChatResponse = res.data;

      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: data.suggestedActions,
        quickReplies: data.quickReplies,
        costBreakdown: data.costBreakdown,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: '⚠️ An error occurred while contacting the advisor service. Please try asking again.',
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCalculateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRent) return;
    handleSendMessage(`Calculate true cost for £${customRent}/wk flat in ${customArea}`);
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-xs text-slate-800 leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-slate-900 text-sm mt-3 mb-1">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('#### ')) {
            return (
              <h5 key={idx} className="font-semibold text-slate-900 text-xs mt-2 mb-0.5">
                {line.replace('#### ', '')}
              </h5>
            );
          }
          if (line.startsWith('* ')) {
            const content = line.replace('* ', '');
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1">
                <span className="text-teal-600 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
              </div>
            );
          }
          if (line.startsWith('> ')) {
            return (
              <blockquote
                key={idx}
                className="border-l-3 border-teal-500 bg-teal-50/70 p-2.5 rounded-r text-xs text-teal-900 my-1.5 font-medium"
              >
                {line.replace('> ', '')}
              </blockquote>
            );
          }
          if (line.startsWith('|')) {
            // Simple table rendering fallback
            return (
              <div key={idx} className="font-mono text-[11px] bg-slate-100 p-1 rounded overflow-x-auto">
                {line}
              </div>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInline = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-600">$1</em>');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER BANNER */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-teal-400 shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Finley AI Student Living Advisor
                </h1>
                <span className="bg-teal-100 text-teal-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  Glasgow Edition
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Unbiased calculations on rent, energy bills, Scottish free bus passes, NHS perks, and 0% student overdrafts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Clear chat conversation?')) setMessages([messages[0]]);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear History
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              <Sliders className="w-3.5 h-3.5 text-teal-400" />
              View Dashboard
            </Link>
          </div>
        </div>

        {/* 2-COLUMN MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
          {/* LEFT SIDEBAR: TOPICS & QUICK CALCULATOR */}
          <div className="lg:col-span-4 flex flex-col gap-5 overflow-y-auto pr-1">
            {/* QUICK RENT CALCULATOR CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Quick Flat Cost Simulator
                </h3>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Found a flat listing? Enter the advertised rent to simulate bills, subway costs, and upfront deposit.
              </p>
              <form onSubmit={handleCalculateCustom} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Advertised Rent (£/week)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">£</span>
                    <input
                      type="number"
                      value={customRent}
                      onChange={(e) => setCustomRent(e.target.value)}
                      min="50"
                      max="600"
                      className="w-full text-xs pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Area</label>
                  <select
                    value={customArea}
                    onChange={(e) => setCustomArea(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none font-medium text-slate-800"
                  >
                    <option value="Dennistoun">Dennistoun (East End)</option>
                    <option value="West End">West End / Hillhead</option>
                    <option value="Finnieston">Finnieston</option>
                    <option value="Southside">Southside / Shawlands</option>
                    <option value="Partick">Partick</option>
                    <option value="City Centre">City Centre</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Calculate True Cost
                </button>
              </form>
            </div>

            {/* STARTER TOPICS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex-1">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Suggested Topics & Questions
              </h3>
              <div className="space-y-2">
                {STARTER_PROMPTS.map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSendMessage(prompt.query)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-teal-300 hover:bg-teal-50/50 transition group"
                  >
                    <div className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">
                      {prompt.category}
                    </div>
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-teal-900 mt-0.5">
                      {prompt.title}
                    </div>
                  </button>
                ))}
              </div>

              {/* RESPONSIBLE AI DISCLOSURE */}
              <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  Zero Sponsored Results
                </div>
                <p>
                  Finley is strictly independent. Rankings and cost calculations are never paid for by private halls or banks.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: CHAT CONVERSATION */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
            {/* MESSAGES FEED */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/40">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs shadow-xs relative group ${
                      msg.sender === 'user'
                        ? 'bg-slate-900 text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    {msg.sender === 'assistant' ? (
                      <div>
                        {renderFormattedText(msg.text)}

                        {/* COST BREAKDOWN CARD */}
                        {msg.costBreakdown && (
                          <div className="mt-3.5 p-3.5 rounded-xl bg-slate-900 text-white space-y-2.5 border border-slate-800">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                              <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                                <Calculator className="w-3.5 h-3.5" />
                                Calculated True Cost Summary
                              </span>
                              <span className="text-sm font-extrabold text-white">
                                £{msg.costBreakdown.totalWeekly.toFixed(2)} / week
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
                              <div className="bg-slate-800/60 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Headline Rent</span>
                                <span className="font-bold text-white">£{msg.costBreakdown.rentWeekly}/wk</span>
                              </div>
                              <div className="bg-slate-800/60 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Estimated Bills</span>
                                <span className="font-bold text-white">£{msg.costBreakdown.billsWeekly.toFixed(2)}/wk</span>
                              </div>
                              <div className="bg-slate-800/60 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Subway/Transit</span>
                                <span className="font-bold text-white">£{msg.costBreakdown.transitWeekly.toFixed(2)}/wk</span>
                              </div>
                              <div className="bg-slate-800/60 p-2 rounded-lg">
                                <span className="text-slate-400 block text-[10px]">Monthly Total</span>
                                <span className="font-bold text-teal-300">~£{msg.costBreakdown.totalMonthly}/mo</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                              <span className="text-slate-400">Upfront 5-week Security Deposit:</span>
                              <span className="font-bold text-amber-400">£{msg.costBreakdown.upfrontDeposit}</span>
                            </div>
                          </div>
                        )}

                        {/* SUGGESTED ACTIONS */}
                        {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2">
                            {msg.suggestedActions.map((act, i) => (
                              <Link
                                key={i}
                                href={act.href}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 text-xs font-semibold transition"
                              >
                                {act.label}
                                <ArrowRight className="w-3 h-3 opacity-60" />
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}

                    {/* Copy Button */}
                    {msg.sender === 'assistant' && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Copy response"
                        className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition text-xs"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  </div>

                  {/* FOLLOW-UP CHIPS */}
                  {msg.sender === 'assistant' &&
                    msg.quickReplies &&
                    msg.id === messages[messages.length - 1].id && (
                      <div className="mt-2.5 flex flex-wrap gap-2 max-w-[90%]">
                        {msg.quickReplies.map((reply, rIdx) => (
                          <button
                            key={rIdx}
                            onClick={() => handleSendMessage(reply)}
                            className="text-xs font-medium text-slate-600 hover:text-teal-800 bg-white hover:bg-teal-50/80 border border-slate-200 hover:border-teal-300 rounded-full px-3 py-1.5 text-left transition shadow-2xs"
                          >
                            💬 {reply}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 p-3.5 rounded-2xl rounded-bl-none w-32 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-xs text-slate-400 font-medium ml-1">Finley is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT COMPOSER */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-3"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask Finley anything (e.g. 'How much does winter heating cost?', 'Is Santander overdraft free?')..."
                  className="flex-1 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-900 border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-3 outline-none transition font-medium"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-teal-400 font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-500" />
                  Real Glasgow datasets: 2026/27 student fares, council tax rules, NHS Scotland rates
                </span>
                <span>Press Enter to send</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
