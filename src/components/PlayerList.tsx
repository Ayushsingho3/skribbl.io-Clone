import React from 'react';
import { Crown, Pencil, CheckCircle, Bot } from 'lucide-react';
import { PlayerData } from '../types/game';
import { Avatar } from './Avatar';

interface PlayerListProps {
  players: PlayerData[];
  currentUserId: string;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  currentUserId
}) => {
  // Sort players by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border-2 border-slate-700/50 shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-3 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
        <span className="font-bold text-sm text-slate-100 tracking-wide">
          Players
        </span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
          {players.length}
        </span>
      </div>

      {/* Players list */}
      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
        {sortedPlayers.map((player, index) => {
          const isCurrent = player.id === currentUserId;
          const isLeader = index === 0 && player.score > 0;

          return (
            <div
              key={player.id}
              className={`relative flex items-center justify-between p-2 rounded-xl transition-all border ${
                player.hasGuessedCorrectly
                  ? 'bg-emerald-950/40 border-emerald-500/50 shadow-sm'
                  : player.isDrawing
                  ? 'bg-blue-950/40 border-blue-500/50 shadow-sm'
                  : isCurrent
                  ? 'bg-slate-800/90 border-slate-600'
                  : 'bg-slate-800/40 border-slate-700/40'
              }`}
            >
              {/* Left: Rank, Avatar, Name */}
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`font-mono text-xs font-black w-4 text-center shrink-0 ${
                    index === 0
                      ? 'text-amber-400'
                      : index === 1
                      ? 'text-slate-300'
                      : index === 2
                      ? 'text-amber-600'
                      : 'text-slate-500'
                  }`}
                >
                  #{index + 1}
                </span>

                <div className="relative shrink-0">
                  <Avatar avatar={player.avatar} size={32} />
                  {player.isHost && (
                    <div className="absolute -top-1.5 -right-1.5 text-amber-400 drop-shadow">
                      <Crown className="w-3.5 h-3.5 fill-amber-400" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs font-bold truncate max-w-[80px] sm:max-w-[100px] ${
                        isCurrent ? 'text-blue-300' : 'text-slate-200'
                      }`}
                    >
                      {player.name}
                    </span>
                    {player.isBot && (
                      <span title="Bot Player" className="text-slate-400">
                        <Bot className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] text-blue-400 font-semibold block -mt-0.5">
                      (You)
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Score & Status Indicators */}
              <div className="flex items-center gap-2 shrink-0">
                {player.isDrawing && (
                  <div
                    title="Drawing right now!"
                    className="p-1 rounded-md bg-blue-500/20 text-blue-400 animate-pulse"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </div>
                )}

                {player.hasGuessedCorrectly && (
                  <div
                    title="Guessed correctly!"
                    className="p-1 rounded-md bg-emerald-500/20 text-emerald-400"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className="font-mono text-xs font-black text-slate-100 bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-700/50">
                  {player.score}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
