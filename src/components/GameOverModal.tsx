import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Medal, RotateCcw, Home } from 'lucide-react';
import { PlayerData } from '../types/game';
import { Avatar } from './Avatar';

interface GameOverModalProps {
  winner?: PlayerData;
  leaderboard: PlayerData[];
  isHost: boolean;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  leaderboard,
  isHost,
  onPlayAgain,
  onReturnToLobby
}) => {
  useEffect(() => {
    // Fire celebratory confetti burst
    const end = Date.now() + 2.5 * 1000;
    const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const firstPlace = leaderboard[0];
  const secondPlace = leaderboard[1];
  const thirdPlace = leaderboard[2];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl text-center my-8">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/20 text-amber-400 mb-3 border border-amber-500/30">
          <Trophy className="w-8 h-8 animate-bounce" />
        </div>

        <h2 className="text-3xl font-black text-white">
          Game Over!
        </h2>
        <p className="text-slate-400 text-sm mt-1 mb-6">
          Congratulations to the champion doodler!
        </p>

        {/* Podium */}
        <div className="flex items-end justify-center gap-3 mb-6 pt-4">
          {/* 2nd Place */}
          {secondPlace && (
            <div className="flex flex-col items-center">
              <Avatar avatar={secondPlace.avatar} size={48} animate />
              <div className="font-bold text-xs text-slate-200 mt-1 truncate max-w-[80px]">
                {secondPlace.name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mb-1">
                {secondPlace.score} pts
              </div>
              <div className="w-20 h-20 bg-slate-800 rounded-t-xl border-t-4 border-slate-400 flex flex-col items-center justify-center shadow-lg">
                <Medal className="w-5 h-5 text-slate-300 mb-0.5" />
                <span className="text-xs font-black text-slate-300">2nd</span>
              </div>
            </div>
          )}

          {/* 1st Place (Center & Tallest) */}
          {firstPlace && (
            <div className="flex flex-col items-center -mt-6">
              <div className="relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-amber-400">
                  👑
                </div>
                <Avatar avatar={firstPlace.avatar} size={64} animate />
              </div>
              <div className="font-extrabold text-sm text-amber-300 mt-1 truncate max-w-[90px]">
                {firstPlace.name}
              </div>
              <div className="text-xs text-amber-400 font-mono font-bold mb-1">
                {firstPlace.score} pts
              </div>
              <div className="w-24 h-28 bg-gradient-to-t from-amber-600/30 to-amber-500/20 rounded-t-xl border-t-4 border-amber-400 flex flex-col items-center justify-center shadow-2xl">
                <Trophy className="w-7 h-7 text-amber-400 mb-1" />
                <span className="text-sm font-black text-amber-300">1st</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {thirdPlace && (
            <div className="flex flex-col items-center">
              <Avatar avatar={thirdPlace.avatar} size={44} animate />
              <div className="font-bold text-xs text-slate-200 mt-1 truncate max-w-[80px]">
                {thirdPlace.name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mb-1">
                {thirdPlace.score} pts
              </div>
              <div className="w-20 h-16 bg-slate-800 rounded-t-xl border-t-4 border-amber-700 flex flex-col items-center justify-center shadow-lg">
                <Medal className="w-5 h-5 text-amber-600 mb-0.5" />
                <span className="text-xs font-black text-amber-600">3rd</span>
              </div>
            </div>
          )}
        </div>

        {/* Full Leaderboard list */}
        <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60 mb-6 text-left max-h-40 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 mb-1.5 px-1">
            Complete Standings
          </div>
          <div className="space-y-1">
            {leaderboard.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-900/60 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 font-bold w-4">
                    #{index + 1}
                  </span>
                  <Avatar avatar={player.avatar} size={20} />
                  <span className="font-bold text-slate-200">
                    {player.name}
                  </span>
                </div>
                <span className="font-mono font-bold text-amber-400">
                  {player.score} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-3">
          {isHost ? (
            <button
              type="button"
              onClick={onPlayAgain}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black rounded-2xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          ) : (
            <div className="text-xs text-slate-400 italic">
              Waiting for host to start another game...
            </div>
          )}

          <button
            type="button"
            onClick={onReturnToLobby}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold rounded-2xl border border-slate-700 transition flex items-center justify-center gap-2 text-sm"
          >
            <Home className="w-4 h-4" />
            <span>Lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
};
