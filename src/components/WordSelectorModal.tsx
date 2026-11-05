import React from 'react';
import { Sparkles, Clock } from 'lucide-react';

interface WordSelectorModalProps {
  words: string[];
  timeLeft: number;
  onSelectWord: (word: string) => void;
}

export const WordSelectorModal: React.FC<WordSelectorModalProps> = ({
  words,
  timeLeft,
  onSelectWord
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-2 border-blue-500/50 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl text-center transform scale-100 transition-all">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-2 text-blue-400 font-bold text-sm tracking-wider uppercase">
          <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
          <span>Your Turn to Draw!</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
          Choose a Word
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Pick one of the options below before the timer runs out!
        </p>

        {/* Timer Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-amber-400 font-bold text-sm mb-6">
          <Clock className="w-4 h-4 animate-pulse" />
          <span>{timeLeft}s remaining</span>
        </div>

        {/* Word Options Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {words.map((word, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectWord(word)}
              className="group relative p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-850 border-2 border-slate-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all text-left flex flex-col justify-between"
            >
              <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-400 transition uppercase tracking-wider">
                Option {idx + 1}
              </span>
              <span className="text-lg font-black text-white capitalize group-hover:text-blue-300 transition my-2">
                {word}
              </span>
              <span className="text-xs text-slate-400">
                {word.length} letters
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
