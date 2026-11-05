import React from 'react';
import { Trophy, ArrowRight } from 'lucide-react';
import { PlayerData } from '../types/game';
import { Avatar } from './Avatar';

interface RoundEndModalProps {
  word: string;
  pointsEarned: { [playerId: string]: number };
  players: PlayerData[];
  timeLeft: number;
}

export const RoundEndModal: React.FC<RoundEndModalProps> = ({
  word,
  pointsEarned,
  players,
  timeLeft
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Round Ended
        </span>

        <h2 className="text-slate-300 text-sm mt-1 mb-1">
          The word was:
        </h2>
        <div className="text-3xl md:text-4xl font-black text-amber-400 uppercase tracking-widest my-3 bg-amber-400/10 py-2 px-4 rounded-2xl border border-amber-400/30 inline-block shadow-sm">
          {word}
        </div>

        {/* Points breakdown for this round */}
        <div className="mt-4 mb-6 bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60 max-h-48 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 mb-2 text-left px-1 flex items-center justify-between">
            <span>Player Scores This Round</span>
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="space-y-1.5">
            {players.map(player => {
              const gained = pointsEarned[player.id] || 0;
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-900/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Avatar avatar={player.avatar} size={24} />
                    <span className="font-bold text-slate-200">
                      {player.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {gained > 0 ? (
                      <span className="font-extrabold text-emerald-400">
                        +{gained} pts
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">0 pts</span>
                    )}
                    <span className="text-slate-400 font-mono">
                      ({player.score})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next round countdown */}
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
          <span>Next turn in</span>
          <span className="text-blue-400 text-sm font-extrabold">{timeLeft}s</span>
          <ArrowRight className="w-4 h-4 text-blue-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
