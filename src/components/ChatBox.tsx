import React, { useEffect, useRef, useState } from 'react';
import { Send, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { ChatMessage, GamePhase } from '../types/game';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isDrawer: boolean;
  hasGuessedCorrectly: boolean;
  phase: GamePhase;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  isDrawer,
  hasGuessedCorrectly,
  phase
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    onSendMessage(trimmed);
    setInputText('');
  };

  const getPlaceholder = () => {
    if (phase !== 'DRAWING') return 'Chat with players...';
    if (isDrawer) return 'You are drawing! Chat is disabled.';
    if (hasGuessedCorrectly) return 'You guessed it! Chat with other solvers...';
    return 'Type your guess here...';
  };

  const isInputDisabled = phase === 'DRAWING' && isDrawer;

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border-2 border-slate-700/50 shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <span className="font-bold text-sm text-slate-100 tracking-wide">
            {phase === 'DRAWING' ? 'Guesses & Chat' : 'Lobby Chat'}
          </span>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {messages.length} messages
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 text-sm scrollbar-thin scrollbar-thumb-slate-700">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs italic">
            No messages yet. Send a guess or say hi!
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.type === 'correct') {
              return (
                <div
                  key={msg.id}
                  className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-2 animate-bounce-once shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{msg.text}</span>
                </div>
              );
            }

            if (msg.type === 'close') {
              return (
                <div
                  key={msg.id}
                  className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-medium flex items-center gap-2 text-xs"
                >
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{msg.text}</span>
                </div>
              );
            }

            if (msg.type === 'system') {
              return (
                <div
                  key={msg.id}
                  className="py-1 px-2.5 rounded-lg bg-slate-800/60 text-slate-400 text-xs text-center italic border border-slate-700/30"
                >
                  {msg.text}
                </div>
              );
            }

            // Normal chat / guess
            const isGuess = msg.type === 'guess';
            return (
              <div
                key={msg.id}
                className={`p-2 rounded-xl break-words transition-colors ${
                  isGuess ? 'bg-slate-800/40' : 'bg-slate-800/70'
                }`}
              >
                <span className="font-bold text-blue-400 mr-2 text-xs">
                  {msg.senderName}:
                </span>
                <span className={isGuess ? 'text-slate-200' : 'text-slate-300'}>
                  {msg.text}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-2.5 bg-slate-800/80 border-t border-slate-700/60 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={getPlaceholder()}
          disabled={isInputDisabled}
          maxLength={80}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={isInputDisabled || !inputText.trim()}
          className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 shadow"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
