import React, { useState } from 'react';
import { Clock, Volume2, VolumeX, LogOut, Copy, Check, Users } from 'lucide-react';
import { GamePhase } from '../types/game';
import { sound } from '../utils/sound';

interface HeaderBarProps {
  currentRound: number;
  totalRounds: number;
  timeLeft: number;
  totalTime: number;
  wordToGuess: string;
  isDrawer: boolean;
  phase: GamePhase;
  roomCode: string;
  playerCount: number;
  onLeaveRoom: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentRound,
  totalRounds,
  timeLeft,
  totalTime,
  wordToGuess,
  isDrawer,
  phase,
  roomCode,
  playerCount,
  onLeaveRoom
}) => {
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.isMuted);

  const toggleSound = () => {
    sound.isMuted = !sound.isMuted;
    setIsMuted(sound.isMuted);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timeRatio = Math.max(0, Math.min(1, timeLeft / (totalTime || 80)));
  const isTimeLow = timeLeft <= 15 && phase === 'DRAWING';

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b-2 border-slate-700/60 px-3 md:px-6 py-2.5 flex items-center justify-between gap-2 shadow-lg select-none">
      {/* Left: Round & Room Info */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Round Badge */}
        <div className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Round
          </span>
          <span className="text-sm font-black text-blue-400">
            {currentRound} / {totalRounds}
          </span>
        </div>

        {/* Room Code Badge */}
        <button
          type="button"
          onClick={handleCopyCode}
          className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-850 border border-slate-700 px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-300 transition"
          title="Click to copy room code"
        >
          <span>Room: {roomCode}</span>
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        <div className="hidden lg:flex items-center gap-1 text-xs text-slate-400 font-medium">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span>{playerCount}</span>
        </div>
      </div>

      {/* Center: Secret Word or Blanked Hint */}
      <div className="flex flex-col items-center justify-center flex-1 max-w-md mx-2">
        {phase === 'DRAWING' ? (
          <div className="flex flex-col items-center">
            <div className="text-base sm:text-xl md:text-2xl font-black text-amber-300 tracking-widest font-mono uppercase text-center drop-shadow">
              {wordToGuess}
            </div>
            <div className="text-[10px] md:text-xs text-slate-400 font-semibold mt-0.5">
              {isDrawer ? '✍️ You are drawing this word!' : `(${wordToGuess.replace(/\s+/g, '').length} letters)`}
            </div>
          </div>
        ) : phase === 'SELECTING_WORD' ? (
          <div className="text-sm sm:text-base font-bold text-blue-300 animate-pulse text-center">
            {isDrawer ? 'Choose your word!' : 'Drawer is picking a word...'}
          </div>
        ) : (
          <div className="text-sm sm:text-base font-bold text-slate-300">
            Skribbl.io Clone
          </div>
        )}
      </div>

      {/* Right: Timer & Settings Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Animated Countdown Timer */}
        <div
          className={`px-3 py-1 rounded-xl font-mono font-black text-sm md:text-base flex items-center gap-1.5 border transition-all ${
            isTimeLow
              ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
              : 'bg-slate-800 border-slate-700 text-amber-400'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{timeLeft}s</span>
        </div>

        {/* Sound toggle */}
        <button
          type="button"
          onClick={toggleSound}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Leave Room Button */}
        <button
          type="button"
          onClick={onLeaveRoom}
          className="p-2 bg-slate-800 hover:bg-rose-900/30 hover:border-rose-700 text-slate-300 hover:text-rose-300 rounded-xl border border-slate-700 transition"
          title="Leave Room"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
