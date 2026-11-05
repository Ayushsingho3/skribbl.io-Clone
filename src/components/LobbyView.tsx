import React, { useState } from 'react';
import {
  Play,
  PlusCircle,
  KeyRound,
  Copy,
  Check,
  Crown,
  Bot,
  Settings2,
  Dice5,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  Sparkles,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { AvatarConfig, PlayerData, RoomSettings } from '../types/game';
import { Avatar, AVATAR_COLORS } from './Avatar';

interface LobbyViewProps {
  // Player state
  playerName: string;
  setPlayerName: (name: string) => void;
  avatar: AvatarConfig;
  setAvatar: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  
  // Room state (null if in landing mode)
  roomCode: string | null;
  players: PlayerData[];
  settings: RoomSettings;
  isHost: boolean;
  currentUserId: string;

  // Actions
  onQuickJoin: () => void;
  onCreateRoom: (isPrivate: boolean) => void;
  onJoinRoom: (code: string) => void;
  onStartGame: () => void;
  onUpdateSettings: (newSettings: Partial<RoomSettings>) => void;
  onAddBot: () => void;
  onRemoveBot: () => void;
  onLeaveRoom: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  playerName,
  setPlayerName,
  avatar,
  setAvatar,
  roomCode,
  players,
  settings,
  isHost,
  currentUserId,
  onQuickJoin,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  onUpdateSettings,
  onAddBot,
  onRemoveBot,
  onLeaveRoom
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [customWordsText, setCustomWordsText] = useState(
    settings.customWords?.join(', ') || ''
  );
  const [activeTab, setActiveTab] = useState<'quick' | 'create' | 'join'>('quick');

  // Randomize Avatar
  const handleRandomizeAvatar = () => {
    setAvatar({
      color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      eyes: Math.floor(Math.random() * 6),
      mouth: Math.floor(Math.random() * 6)
    });
  };

  const cycleEyes = (delta: number) => {
    setAvatar(prev => ({
      ...prev,
      eyes: (prev.eyes + delta + 6) % 6
    }));
  };

  const cycleMouth = (delta: number) => {
    setAvatar(prev => ({
      ...prev,
      mouth: (prev.mouth + delta + 6) % 6
    }));
  };

  const handleCopyInviteLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCustomWordsBlur = () => {
    if (!isHost) return;
    const words = customWordsText
      .split(',')
      .map(w => w.trim())
      .filter(w => w.length > 1);
    onUpdateSettings({ customWords: words });
  };

  // If already inside a room's lobby:
  if (roomCode) {
    const botCount = players.filter(p => p.isBot).length;
    return (
      <div className="max-w-4xl mx-auto w-full p-4 md:p-6 animate-fade-in">
        {/* Room Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border-2 border-slate-700/60 shadow-xl mb-6">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Room Lobby</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              Room Code: <span className="font-mono text-amber-400">{roomCode}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Invite friends using the room code or copy the direct invite link.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-2xl transition shadow-lg shadow-blue-600/30 flex items-center gap-2 text-sm"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
            </button>
            <button
              type="button"
              onClick={onLeaveRoom}
              className="py-2.5 px-4 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 font-bold rounded-2xl border border-slate-700 transition text-sm"
            >
              Leave
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players in Lobby */}
          <div className="lg:col-span-2 bg-slate-900/70 backdrop-blur-md rounded-3xl p-6 border-2 border-slate-700/60 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">
                    Players in Lobby
                  </h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-blue-400 border border-slate-700">
                    {players.length} / {settings.maxPlayers}
                  </span>
                </div>

                {/* Host bot controls for testing/solo play */}
                {isHost && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={onAddBot}
                      disabled={players.length >= settings.maxPlayers}
                      className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-40"
                      title="Add a test bot player"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-blue-400" />
                      <span>+ Bot</span>
                    </button>
                    {botCount > 0 && (
                      <button
                        type="button"
                        onClick={onRemoveBot}
                        className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-rose-900/30 text-rose-300 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                        title="Remove a test bot player"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        <span>- Bot</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Player Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {players.map((p) => {
                  const isCurrent = p.id === currentUserId;
                  return (
                    <div
                      key={p.id}
                      className={`relative flex flex-col items-center p-3 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-blue-950/40 border-blue-500/60 shadow-md ring-1 ring-blue-500/50'
                          : 'bg-slate-800/60 border-slate-700/50'
                      }`}
                    >
                      {p.isHost && (
                        <div
                          className="absolute top-2 right-2 text-amber-400"
                          title="Room Host"
                        >
                          <Crown className="w-4 h-4 fill-amber-400" />
                        </div>
                      )}

                      <Avatar avatar={p.avatar} size={52} animate />

                      <div className="font-extrabold text-xs text-white mt-2 truncate max-w-full flex items-center gap-1">
                        <span>{p.name}</span>
                        {p.isBot && <Bot className="w-3 h-3 text-slate-400 shrink-0" />}
                      </div>

                      {isCurrent && (
                        <span className="text-[10px] font-bold text-blue-400 uppercase mt-0.5">
                          You
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Start Game Action Bar */}
            <div className="mt-8 pt-4 border-t border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400 text-center sm:text-left">
                {isHost ? (
                  players.length < 2 ? (
                    <span className="text-amber-400 font-medium">
                      Tip: You can click "+ Bot" above to test multiplayer alone!
                    </span>
                  ) : (
                    <span>All set! Click Start Game when everyone is ready.</span>
                  )
                ) : (
                  <span>Waiting for the room host to start the match...</span>
                )}
              </div>

              {isHost && (
                <button
                  type="button"
                  onClick={onStartGame}
                  className="w-full sm:w-auto py-3 px-8 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black rounded-2xl transition shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 text-base"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Game</span>
                </button>
              )}
            </div>
          </div>

          {/* Room Settings Panel */}
          <div className="bg-slate-900/70 backdrop-blur-md rounded-3xl p-6 border-2 border-slate-700/60 shadow-xl">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700/50">
              <Settings2 className="w-4 h-4 text-blue-400" />
              <h2 className="text-lg font-black text-white">
                Room Settings
              </h2>
            </div>

            <div className="space-y-4 text-xs">
              {/* Draw Time */}
              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Draw Time
                </label>
                {isHost ? (
                  <select
                    value={settings.drawTime}
                    onChange={(e) =>
                      onUpdateSettings({ drawTime: Number(e.target.value) })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={30}>30 seconds</option>
                    <option value={45}>45 seconds</option>
                    <option value={60}>60 seconds</option>
                    <option value={80}>80 seconds (Standard)</option>
                    <option value={100}>100 seconds</option>
                    <option value={120}>120 seconds</option>
                  </select>
                ) : (
                  <div className="font-bold text-white bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/50">
                    {settings.drawTime} seconds
                  </div>
                )}
              </div>

              {/* Rounds */}
              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Rounds
                </label>
                {isHost ? (
                  <select
                    value={settings.rounds}
                    onChange={(e) =>
                      onUpdateSettings({ rounds: Number(e.target.value) })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[2, 3, 4, 5, 6, 8, 10].map(r => (
                      <option key={r} value={r}>
                        {r} Rounds
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="font-bold text-white bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/50">
                    {settings.rounds} Rounds
                  </div>
                )}
              </div>

              {/* Word Category */}
              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Word Category
                </label>
                {isHost ? (
                  <select
                    value={settings.wordCategory}
                    onChange={(e) =>
                      onUpdateSettings({ wordCategory: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="animals">Animals</option>
                    <option value="food">Food & Drinks</option>
                    <option value="objects">Everyday Objects</option>
                    <option value="actions">Actions & Verbs</option>
                    <option value="nature">Nature & Earth</option>
                  </select>
                ) : (
                  <div className="font-bold text-white bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/50 capitalize">
                    {settings.wordCategory}
                  </div>
                )}
              </div>

              {/* Word Count Choices */}
              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Word Options per Turn
                </label>
                {isHost ? (
                  <select
                    value={settings.wordCount}
                    onChange={(e) =>
                      onUpdateSettings({ wordCount: Number(e.target.value) })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={2}>2 Words</option>
                    <option value={3}>3 Words (Standard)</option>
                    <option value={4}>4 Words</option>
                    <option value={5}>5 Words</option>
                  </select>
                ) : (
                  <div className="font-bold text-white bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/50">
                    {settings.wordCount} Words
                  </div>
                )}
              </div>

              {/* Custom Words */}
              {isHost && (
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Custom Words (optional)
                  </label>
                  <input
                    type="text"
                    value={customWordsText}
                    onChange={(e) => setCustomWordsText(e.target.value)}
                    onBlur={handleCustomWordsBlur}
                    placeholder="e.g. pikachu, iron man, taj mahal"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Separate words with commas.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Initial Landing View (Before joining a room)
  return (
    <div className="max-w-xl mx-auto w-full p-4 sm:p-6 animate-fade-in my-auto">
      {/* Skribbl Logo Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white inline-flex items-center gap-2 drop-shadow-lg">
          <span className="text-amber-400">skribbl</span>
          <span className="text-blue-400">.io</span>
        </h1>
        <p className="text-slate-300 text-sm mt-1.5 font-medium">
          Multiplayer Drawing & Guessing Pictionary Game
        </p>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-2 border-slate-700/60 shadow-2xl">
        {/* Avatar Customization Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-3">
            <Avatar avatar={avatar} size={84} animate />
            <button
              type="button"
              onClick={handleRandomizeAvatar}
              className="absolute -bottom-1 -right-1 p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-600 shadow-md transition transform hover:rotate-45"
              title="Randomize Avatar"
            >
              <Dice5 className="w-4 h-4" />
            </button>
          </div>

          {/* Color palette for avatar */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3 max-w-xs">
            {AVATAR_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setAvatar(prev => ({ ...prev, color: c }))}
                className={`w-5 h-5 rounded-full transition-transform hover:scale-125 border ${
                  avatar.color === c ? 'ring-2 ring-white scale-125' : 'border-black/30'
                }`}
                style={{ backgroundColor: c }}
                title="Avatar Color"
              />
            ))}
          </div>

          {/* Eye & Mouth controls */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-300">
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700">
              <span className="text-slate-400 text-[10px] mr-1">Eyes:</span>
              <button
                type="button"
                onClick={() => cycleEyes(-1)}
                className="p-1 hover:text-white"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="w-3 text-center">{avatar.eyes + 1}</span>
              <button
                type="button"
                onClick={() => cycleEyes(1)}
                className="p-1 hover:text-white"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700">
              <span className="text-slate-400 text-[10px] mr-1">Mouth:</span>
              <button
                type="button"
                onClick={() => cycleMouth(-1)}
                className="p-1 hover:text-white"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="w-3 text-center">{avatar.mouth + 1}</span>
              <button
                type="button"
                onClick={() => cycleMouth(1)}
                className="p-1 hover:text-white"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Player Name Input */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Your Nickname
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name..."
            maxLength={18}
            className="w-full bg-slate-800 border-2 border-slate-700 focus:border-blue-500 rounded-2xl px-4 py-3 text-white font-bold text-base placeholder-slate-500 focus:outline-none transition"
          />
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-800 rounded-2xl mb-6 border border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'quick' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'create' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'join' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Join</span>
          </button>
        </div>

        {/* Tab Content Actions */}
        {activeTab === 'quick' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={onQuickJoin}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-lg rounded-2xl transition shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2"
            >
              <Globe className="w-5 h-5" />
              <span>Quick Play Now!</span>
            </button>
            <p className="text-center text-xs text-slate-400">
              Instantly matches you with an open public room or starts a new one.
            </p>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onCreateRoom(true)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-black rounded-2xl transition shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 text-base"
            >
              <Lock className="w-4 h-4" />
              <span>Create Private Room</span>
            </button>
            <button
              type="button"
              onClick={() => onCreateRoom(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-750 active:scale-98 text-slate-200 font-bold rounded-2xl border border-slate-700 transition flex items-center justify-center gap-2 text-sm"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Create Public Room</span>
            </button>
          </div>
        )}

        {activeTab === 'join' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                maxLength={8}
                className="flex-1 bg-slate-800 border-2 border-slate-700 focus:border-blue-500 rounded-2xl px-4 py-3 text-white font-mono font-bold text-center tracking-widest placeholder-slate-500 focus:outline-none uppercase"
              />
              <button
                type="button"
                onClick={() => onJoinRoom(joinCodeInput)}
                disabled={!joinCodeInput.trim()}
                className="py-3 px-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black rounded-2xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center shrink-0"
              >
                Join
              </button>
            </div>
            <p className="text-center text-xs text-slate-400">
              Enter the 6-character room code shared by your friend.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
