'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Maximize2,
  Trash2,
  ChevronDown,
  Building2,
  Bus,
  CreditCard,
  HeartPulse,
  Sliders,
  Copy,
  Check,
  Calculator,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { ChatMessage, ChatResponse, ChatCostBreakdown } from '@/shared/types';
import { apiClient } from '@/shared/api-client';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'assistant',
    text: `👋 **Hi! I am Finley, your Glasgow Student Living Cost AI Advisor.**\n\nI can calculate your **true weekly living cost** (rent + bills + subway), explain **NHS Scotland free prescriptions**, guide you on the **Scottish Under-22 Free Bus Pass**, and find the bank with a **free 4-year Railcard**.\n\nTry asking a question or click a starter below!`,
    timestamp: 'Just now',
    suggestedActions: [
      { label: 'Calculate Budget', href: '/onboarding', icon: 'budget' },
      { label: 'Browse Housing', href: '/accommodation', icon: 'home' },
      { label: 'Healthcare Guide', href: '/healthcare', icon: 'health' },
    ],
    quickReplies: [
      'Calculate true cost for £130/wk flat',
      'How to get Free Bus Pass under 22?',
      'What healthcare is free in Scotland?',
      'Which bank gives a free 4-year Railcard?',
    ],
  },
];

export function ChatBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

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
      // Simulate realistic short typing latency (400ms - 800ms)
      await new Promise((res) => setTimeout(res, 600));

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
      console.error('Chatbot error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: '⚠️ Sorry, I had trouble processing that question. Please try asking again or select one of the topics below.',
          timestamp: 'Just now',
          quickReplies: ['Calculate true cost for £130/wk flat', 'What healthcare is free in Scotland?'],
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

  const handleClear = () => {
    if (confirm('Clear chat history?')) {
      setMessages(INITIAL_MESSAGES);
    }
  };

  // Render markdown-like simple text formatting
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-xs text-slate-800 leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-slate-900 text-sm mt-2 mb-1">
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
                className="border-l-2 border-teal-500 bg-teal-50/70 p-2 rounded-r text-[11px] text-teal-900 my-1 font-medium"
              >
                {line.replace('> ', '')}
              </blockquote>
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

  const getActionIcon = (type?: string) => {
    switch (type) {
      case 'home':
        return <Building2 className="w-3.5 h-3.5 text-blue-600" />;
      case 'transit':
        return <Bus className="w-3.5 h-3.5 text-emerald-600" />;
      case 'bank':
        return <CreditCard className="w-3.5 h-3.5 text-amber-600" />;
      case 'health':
        return <HeartPulse className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Sliders className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          aria-label="Open AI Student Living Cost Advisor"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white pl-4 pr-5 py-3 rounded-full shadow-2xl hover:shadow-teal-500/20 border border-slate-700/60 transition-all duration-300 group hover:scale-[1.03] active:scale-[0.98]"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-teal-500/20 border border-teal-400/30">
            <Bot className="w-4 h-4 text-teal-400 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
            </span>
          </div>
          <div className="text-left">
            <div className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
              Ask Finley AI
              <span className="text-[10px] bg-teal-500/30 text-teal-300 font-semibold px-1.5 py-0.5 rounded-full border border-teal-400/30">
                Glasgow
              </span>
            </div>
            <div className="text-[10px] text-slate-300 font-medium">True Cost & Rights Advisor</div>
          </div>
          {unreadCount > 0 && (
            <span className="ml-1 bg-teal-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[94vw] sm:w-[420px] h-[580px] max-h-[88vh] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-scale-in">
          {/* HEADER */}
          <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">Finley AI Advisor</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Glasgow Student Living & Rights
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                title="Clear chat history"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <Link
                href="/chat"
                title="Open full page"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* QUICK TOPIC CHIPS BAR */}
          <div className="bg-slate-50 border-b border-slate-200/80 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
            <button
              onClick={() => handleSendMessage('Calculate true cost for £130/wk flat in Dennistoun')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-700 font-medium text-slate-700 transition"
            >
              🧮 Cost Math
            </button>
            <button
              onClick={() => handleSendMessage('How to get Free Bus Pass under 22 in Scotland?')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-700 font-medium text-slate-700 transition"
            >
              🚌 Free Bus
            </button>
            <button
              onClick={() => handleSendMessage('What healthcare is free in Scotland vs England?')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-700 font-medium text-slate-700 transition"
            >
              🏥 NHS Perks
            </button>
            <button
              onClick={() => handleSendMessage('Which student bank gives a free 4-year Railcard?')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-700 font-medium text-slate-700 transition"
            >
              💳 Railcard
            </button>
          </div>

          {/* MESSAGES FEED */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3 text-xs shadow-sm relative group ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                  }`}
                >
                  {msg.sender === 'assistant' ? (
                    <div>
                      {renderFormattedText(msg.text)}

                      {/* INTERACTIVE COST BREAKDOWN CARD (IF GENERATED) */}
                      {msg.costBreakdown && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-800">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                            <span className="text-[11px] font-bold text-teal-400 flex items-center gap-1">
                              <Calculator className="w-3 h-3" />
                              Calculated True Cost
                            </span>
                            <span className="text-xs font-bold text-white">
                              £{msg.costBreakdown.totalWeekly.toFixed(2)}/wk
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-300">
                            <div>
                              Rent: <span className="text-white font-medium">£{msg.costBreakdown.rentWeekly}/wk</span>
                            </div>
                            <div>
                              Bills: <span className="text-white font-medium">£{msg.costBreakdown.billsWeekly.toFixed(2)}/wk</span>
                            </div>
                            <div>
                              Transit: <span className="text-white font-medium">£{msg.costBreakdown.transitWeekly.toFixed(2)}/wk</span>
                            </div>
                            <div>
                              Monthly: <span className="text-white font-medium">~£{msg.costBreakdown.totalMonthly}/mo</span>
                            </div>
                          </div>

                          <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">Upfront 5-wk deposit:</span>
                            <span className="font-bold text-amber-400">£{msg.costBreakdown.upfrontDeposit}</span>
                          </div>
                        </div>
                      )}

                      {/* SUGGESTED ACTIONS BUTTONS */}
                      {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                          {msg.suggestedActions.map((act, i) => (
                            <Link
                              key={i}
                              href={act.href}
                              onClick={() => setIsOpen(false)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 text-[10px] font-semibold transition"
                            >
                              {getActionIcon(act.icon)}
                              {act.label}
                              <ArrowRight className="w-2.5 h-2.5 ml-0.5 opacity-60" />
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
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition text-[10px]"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-[9px] text-slate-400">{msg.timestamp}</span>
                </div>

                {/* QUICK FOLLOW-UP REPLIES (ON LAST ASSISTANT MESSAGE) */}
                {msg.sender === 'assistant' &&
                  msg.quickReplies &&
                  msg.id === messages[messages.length - 1].id && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                      {msg.quickReplies.map((reply, rIdx) => (
                        <button
                          key={rIdx}
                          onClick={() => handleSendMessage(reply)}
                          className="text-[10px] font-medium text-slate-600 hover:text-teal-700 bg-white hover:bg-teal-50/70 border border-slate-200 hover:border-teal-300 rounded-full px-2.5 py-1 text-left transition shadow-2xs"
                        >
                          💬 {reply}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            ))}

            {/* TYPING INDICATOR */}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none w-28 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-[10px] text-slate-400 font-medium ml-1">Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT FORM */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about rent, bus pass, NHS, or banking..."
                className="flex-1 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 border border-slate-200 focus:border-teal-500 rounded-xl px-3.5 py-2.5 outline-none transition"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                aria-label="Send message"
                className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-teal-400 rounded-xl transition shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="text-[10px] text-slate-400 text-center mt-1.5 flex items-center justify-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-teal-500" />
              <span>Glasgow Living AI • 100% Unbiased & Zero Sponsored Content</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
