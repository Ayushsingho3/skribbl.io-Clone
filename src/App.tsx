import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  AvatarConfig,
  ChatMessage,
  DrawStroke,
  RoomSettings,
  RoomState
} from './types/game';
import { AVATAR_COLORS } from './components/Avatar';
import { CanvasBoard } from './components/CanvasBoard';
import { ChatBox } from './components/ChatBox';
import { GameOverModal } from './components/GameOverModal';
import { HeaderBar } from './components/HeaderBar';
import { LobbyView } from './components/LobbyView';
import { PlayerList } from './components/PlayerList';
import { RoundEndModal } from './components/RoundEndModal';
import { WordSelectorModal } from './components/WordSelectorModal';
import { sound } from './utils/sound';

export default function App() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Player Profile State (with fallback or localStorage)
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('skribbl_name') || `Doodler${Math.floor(Math.random() * 900 + 100)}`;
  });
  const [avatar, setAvatar] = useState<AvatarConfig>(() => {
    const saved = localStorage.getItem('skribbl_avatar');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      eyes: Math.floor(Math.random() * 6),
      mouth: Math.floor(Math.random() * 6)
    };
  });

  // Active Game State
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [initialStrokes, setInitialStrokes] = useState<DrawStroke[]>([]);
  const [latestStroke, setLatestStroke] = useState<DrawStroke | null>(null);
  const [clearTrigger, setClearTrigger] = useState<number>(0);
  const [undoTrigger, setUndoTrigger] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync profile to localStorage
  useEffect(() => {
    localStorage.setItem('skribbl_name', playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem('skribbl_avatar', JSON.stringify(avatar));
  }, [avatar]);

  // Connect Socket.IO
  useEffect(() => {
    const socket: Socket = io({
      transports: ['websocket', 'polling'],
      autoConnect: true
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setCurrentUserId(socket.id || '');

      // Check URL query params for ?room=XYZ or ?autostart=1
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      const autostart = params.get('autostart');

      if (roomParam) {
        socket.emit('join_room', {
          roomId: roomParam,
          playerName: playerName || 'Player',
          avatar
        });
      } else if (autostart === '1') {
        socket.emit('quick_join', {
          playerName: playerName || 'FastPlayer',
          avatar
        });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('room_joined', ({ roomId, playerId }) => {
      setCurrentUserId(playerId);
      setErrorMessage(null);
      // Update URL query without full reload
      const newUrl = `${window.location.pathname}?room=${roomId}`;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    });

    socket.on('game_state', (state: RoomState) => {
      setRoomState(prevState => {
        // Play sounds on phase transitions
        if (prevState?.phase !== state.phase) {
          if (state.phase === 'ROUND_END') {
            sound.playRoundEnd();
          }
        }
        return state;
      });
    });

    socket.on('chat_message', (msg: ChatMessage) => {
      setChatMessages(prev => [...prev, msg]);
      if (msg.type === 'correct') {
        sound.playCorrect();
      } else if (msg.type === 'close') {
        sound.playClose();
      } else if (msg.type === 'system' && msg.text.includes('joined')) {
        sound.playJoin();
      }
    });

    socket.on('draw_data', (stroke: DrawStroke) => {
      setLatestStroke(stroke);
    });

    socket.on('canvas_init', (strokes: DrawStroke[]) => {
      setInitialStrokes(strokes);
    });

    socket.on('canvas_undo', () => {
      setUndoTrigger(prev => prev + 1);
    });

    socket.on('canvas_clear', () => {
      setClearTrigger(prev => prev + 1);
      setInitialStrokes([]);
    });

    socket.on('error_message', ({ message }: { message: string }) => {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(null), 4000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Tick countdown sound when under 10s
  useEffect(() => {
    if (roomState?.phase === 'DRAWING' && roomState.timeLeft <= 10 && roomState.timeLeft > 0) {
      sound.playTick();
    }
  }, [roomState?.timeLeft, roomState?.phase]);

  // Actions
  const handleQuickJoin = () => {
    socketRef.current?.emit('quick_join', {
      playerName: playerName.trim() || 'Doodler',
      avatar
    });
  };

  const handleCreateRoom = (isPrivate: boolean) => {
    socketRef.current?.emit('create_room', {
      playerName: playerName.trim() || 'Doodler',
      avatar,
      isPrivate
    });
  };

  const handleJoinRoom = (code: string) => {
    if (!code.trim()) return;
    socketRef.current?.emit('join_room', {
      roomId: code.trim(),
      playerName: playerName.trim() || 'Doodler',
      avatar
    });
  };

  const handleStartGame = () => {
    socketRef.current?.emit('start_game');
  };

  const handleUpdateSettings = (newSettings: Partial<RoomSettings>) => {
    socketRef.current?.emit('update_settings', newSettings);
  };

  const handleAddBot = () => {
    socketRef.current?.emit('add_bot');
  };

  const handleRemoveBot = () => {
    socketRef.current?.emit('remove_bot');
  };

  const handleLeaveRoom = () => {
    setRoomState(null);
    setChatMessages([]);
    setInitialStrokes([]);
    // Remove query param from URL
    window.history.replaceState({}, '', window.location.pathname);
    window.location.reload();
  };

  const handleSelectWord = (word: string) => {
    socketRef.current?.emit('choose_word', { word });
  };

  const handleStrokeComplete = (stroke: DrawStroke) => {
    socketRef.current?.emit('draw_stroke', stroke);
  };

  const handleCanvasUndo = () => {
    socketRef.current?.emit('canvas_undo');
  };

  const handleCanvasClear = () => {
    socketRef.current?.emit('canvas_clear');
  };

  const handleSendMessage = (text: string) => {
    socketRef.current?.emit('send_chat', { text });
  };

  // Helper flags
  const currentPlayer = roomState?.players.find(p => p.id === currentUserId);
  const isHost = currentPlayer?.isHost ?? false;
  const isDrawer = roomState?.currentDrawerId === currentUserId;
  const hasGuessed = currentPlayer?.hasGuessedCorrectly ?? false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Toast Error Alert */}
      {errorMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white font-bold text-sm px-4 py-2.5 rounded-2xl shadow-2xl border border-rose-400 animate-bounce">
          {errorMessage}
        </div>
      )}

      {/* Screen 1: Lobby or Landing Screen */}
      {(!roomState || roomState.phase === 'LOBBY') ? (
        <LobbyView
          playerName={playerName}
          setPlayerName={setPlayerName}
          avatar={avatar}
          setAvatar={setAvatar}
          roomCode={roomState ? roomState.id : null}
          players={roomState ? roomState.players : []}
          settings={roomState ? roomState.settings : {
            maxPlayers: 8,
            rounds: 3,
            drawTime: 80,
            wordCount: 3,
            hintsCount: 2,
            wordCategory: 'all',
            customWords: []
          }}
          isHost={isHost}
          currentUserId={currentUserId}
          onQuickJoin={handleQuickJoin}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onStartGame={handleStartGame}
          onUpdateSettings={handleUpdateSettings}
          onAddBot={handleAddBot}
          onRemoveBot={handleRemoveBot}
          onLeaveRoom={handleLeaveRoom}
        />
      ) : (
        /* Screen 2: Active Gameplay Screen */
        <div className="flex flex-col flex-1 h-screen overflow-hidden">
          {/* Header Bar */}
          <HeaderBar
            currentRound={roomState.currentRound}
            totalRounds={roomState.settings.rounds}
            timeLeft={roomState.timeLeft}
            totalTime={roomState.settings.drawTime}
            wordToGuess={roomState.wordToGuess}
            isDrawer={isDrawer}
            phase={roomState.phase}
            roomCode={roomState.id}
            playerCount={roomState.players.length}
            onLeaveRoom={handleLeaveRoom}
          />

          {/* Main 3-Column Game Grid */}
          <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 p-2 md:p-3 overflow-hidden min-h-0">
            {/* Left: Player List / Scoreboard (2 cols) */}
            <div className="hidden md:block md:col-span-3 lg:col-span-2 h-full min-h-0">
              <PlayerList
                players={roomState.players}
                currentUserId={currentUserId}
              />
            </div>

            {/* Center: Canvas Board (7 cols) */}
            <div className="col-span-1 md:col-span-6 lg:col-span-7 h-full min-h-0 flex flex-col">
              <CanvasBoard
                isDrawer={isDrawer}
                drawerName={roomState.drawerName}
                onStrokeComplete={handleStrokeComplete}
                onUndo={handleCanvasUndo}
                onClear={handleCanvasClear}
                externalStrokes={initialStrokes}
                latestStroke={latestStroke}
                clearTrigger={clearTrigger}
                undoTrigger={undoTrigger}
              />
            </div>

            {/* Right: Chat & Guess Box (3 cols) */}
            <div className="col-span-1 md:col-span-3 lg:col-span-3 h-full min-h-0 flex flex-col">
              <ChatBox
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                isDrawer={isDrawer}
                hasGuessedCorrectly={hasGuessed}
                phase={roomState.phase}
              />
            </div>
          </main>

          {/* Overlays / Modals */}
          {roomState.phase === 'SELECTING_WORD' && isDrawer && roomState.wordOptions && (
            <WordSelectorModal
              words={roomState.wordOptions}
              timeLeft={roomState.timeLeft}
              onSelectWord={handleSelectWord}
            />
          )}

          {roomState.phase === 'ROUND_END' && roomState.roundWinnerInfo && (
            <RoundEndModal
              word={roomState.roundWinnerInfo.word}
              pointsEarned={roomState.roundWinnerInfo.pointsEarned}
              players={roomState.players}
              timeLeft={roomState.timeLeft}
            />
          )}

          {roomState.phase === 'GAME_OVER' && roomState.winner && (
            <GameOverModal
              winner={roomState.winner.player}
              leaderboard={roomState.winner.leaderboard}
              isHost={isHost}
              onPlayAgain={handleStartGame}
              onReturnToLobby={handleLeaveRoom}
            />
          )}
        </div>
      )}
    </div>
  );
}
