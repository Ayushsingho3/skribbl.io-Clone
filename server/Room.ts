import { Server, Socket } from 'socket.io';
import { ChatMessage, DrawStroke, RoomSettings, RoomState } from '../src/types/game';
import { Game } from './Game';
import { Player } from './Player';

export class Room {
  public readonly id: string;
  public name: string;
  public isPrivate: boolean;
  public settings: RoomSettings;
  public players: Map<string, Player> = new Map();
  public hostId: string | null = null;
  public game: Game;
  public chatHistory: ChatMessage[] = [];
  private io: Server;

  constructor(id: string, name: string, isPrivate: boolean, io: Server, customSettings?: Partial<RoomSettings>) {
    this.id = id;
    this.name = name;
    this.isPrivate = isPrivate;
    this.io = io;

    this.settings = {
      maxPlayers: customSettings?.maxPlayers ?? 8,
      rounds: customSettings?.rounds ?? 3,
      drawTime: customSettings?.drawTime ?? 80,
      wordCount: customSettings?.wordCount ?? 3,
      hintsCount: customSettings?.hintsCount ?? 2,
      wordCategory: customSettings?.wordCategory ?? 'all',
      customWords: customSettings?.customWords ?? []
    };

    this.game = new Game(
      () => Array.from(this.players.values()),
      () => this.settings,
      () => {
        this.broadcastState();
        this.handleBotActions();
      },
      () => this.handleRoundEnd()
    );
  }

  private botTimeouts: NodeJS.Timeout[] = [];

  private clearBotTimeouts(): void {
    this.botTimeouts.forEach(t => clearTimeout(t));
    this.botTimeouts = [];
  }

  private handleBotActions(): void {
    if (this.game.phase !== 'DRAWING') {
      this.clearBotTimeouts();
      return;
    }

    const drawer = this.game.getCurrentDrawer();
    const bots = Array.from(this.players.values()).filter(p => p.isBot);

    // 1. If drawer is a bot, draw preset strokes over time
    if (drawer && drawer.isBot && this.game.strokes.length === 0 && this.botTimeouts.length === 0) {
      const doodleColors = ['#ed1c24', '#00a2e8', '#22b14c', '#ff7f27', '#000000'];
      const chosenColor = doodleColors[Math.floor(Math.random() * doodleColors.length)];

      // Simple doodle: house or smiley
      const stroke1: DrawStroke = {
        id: `bot-stroke-1`,
        color: chosenColor,
        size: 8,
        isEraser: false,
        points: [
          { x: 0.3, y: 0.6 },
          { x: 0.7, y: 0.6 },
          { x: 0.7, y: 0.3 },
          { x: 0.3, y: 0.3 },
          { x: 0.3, y: 0.6 }
        ]
      };

      const stroke2: DrawStroke = {
        id: `bot-stroke-2`,
        color: '#ed1c24',
        size: 8,
        isEraser: false,
        points: [
          { x: 0.3, y: 0.3 },
          { x: 0.5, y: 0.15 },
          { x: 0.7, y: 0.3 }
        ]
      };

      const t1 = setTimeout(() => {
        if (this.game.phase === 'DRAWING' && drawer.isDrawing) {
          this.handleStroke(stroke1, drawer.id);
        }
      }, 1500);

      const t2 = setTimeout(() => {
        if (this.game.phase === 'DRAWING' && drawer.isDrawing) {
          this.handleStroke(stroke2, drawer.id);
        }
      }, 3500);

      this.botTimeouts.push(t1, t2);
    }

    // 2. If bot is a guesser and haven't guessed yet, schedule a guess
    bots.forEach((bot, idx) => {
      if (!bot.isDrawing && !bot.hasGuessedCorrectly && this.botTimeouts.length < 5) {
        const delay = 12000 + idx * 6000;
        const t = setTimeout(() => {
          if (this.game.phase === 'DRAWING' && !bot.hasGuessedCorrectly) {
            this.handleChatMessage(bot, this.game.currentWord);
          }
        }, delay);
        this.botTimeouts.push(t);
      }
    });
  }

  public addPlayer(player: Player): boolean {
    if (this.players.size >= this.settings.maxPlayers) {
      return false;
    }

    if (this.players.size === 0) {
      player.isHost = true;
      this.hostId = player.id;
    }

    this.players.set(player.id, player);
    this.addSystemMessage(`${player.name} joined the room!`);
    this.broadcastState();
    return true;
  }

  public removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    const wasHost = player.isHost;
    const wasDrawing = player.isDrawing;
    this.players.delete(playerId);

    this.addSystemMessage(`${player.name} left the room.`);

    // If host left, reassign host
    if (wasHost && this.players.size > 0) {
      const nextHost = Array.from(this.players.values()).find(p => !p.isBot) || Array.from(this.players.values())[0];
      if (nextHost) {
        nextHost.isHost = true;
        this.hostId = nextHost.id;
        this.addSystemMessage(`${nextHost.name} is now the room host.`);
      }
    }

    // If drawer left during active drawing, advance to next turn
    if (wasDrawing && (this.game.phase === 'DRAWING' || this.game.phase === 'SELECTING_WORD')) {
      this.addSystemMessage(`The drawer disconnected! Skipping to next round...`);
      this.game.startNextTurn();
    } else {
      this.broadcastState();
    }
  }

  public updateSettings(newSettings: Partial<RoomSettings>, playerId: string): boolean {
    if (playerId !== this.hostId) return false;
    this.settings = { ...this.settings, ...newSettings };
    this.broadcastState();
    return true;
  }

  public addTestBot(): boolean {
    if (this.players.size >= this.settings.maxPlayers) return false;
    const botNum = Array.from(this.players.values()).filter(p => p.isBot).length + 1;
    const botColors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
    const botId = `bot-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const botPlayer = new Player(
      botId,
      `DoodleBot ${botNum}`,
      {
        color: botColors[(botNum - 1) % botColors.length],
        eyes: Math.floor(Math.random() * 6),
        mouth: Math.floor(Math.random() * 6)
      },
      false,
      true
    );

    this.addPlayer(botPlayer);
    return true;
  }

  public removeTestBot(): boolean {
    const bots = Array.from(this.players.values()).filter(p => p.isBot);
    if (bots.length === 0) return false;
    const bot = bots[bots.length - 1];
    this.removePlayer(bot.id);
    return true;
  }

  public handleChatMessage(player: Player, text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;

    // If game is in drawing phase, check if it's a guess
    if (this.game.phase === 'DRAWING') {
      // Check if drawer is typing
      if (player.isDrawing) {
        // Drawers can't spoil the word in chat
        const isSecret = this.game.currentWord.toLowerCase().includes(trimmed.toLowerCase());
        if (isSecret && trimmed.length >= 3) {
          // Block drawer from spoiling
          this.sendSystemToPlayer(player.id, "You are the drawer! Don't write the word in chat.");
          return;
        }
      }

      // Check guess
      const guessResult = this.game.handleGuess(player, trimmed);

      if (guessResult.isCorrect) {
        // Send success message to everyone: "Player guessed the word!"
        const msg: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random()}`,
          senderId: player.id,
          senderName: player.name,
          text: `${player.name} guessed the word! (+${guessResult.points} pts)`,
          type: 'correct',
          timestamp: Date.now()
        };
        this.addAndBroadcastMessage(msg);
        return;
      }

      if (guessResult.isClose) {
        // Whisper to player only
        const whisper: ChatMessage = {
          id: `whisper-${Date.now()}`,
          senderName: 'System',
          text: `"${trimmed}" is very close!`,
          type: 'close',
          timestamp: Date.now()
        };
        this.io.to(player.socketId).emit('chat_message', whisper);
      }

      // If player already guessed correctly, their chat is only visible to other players who also guessed
      // or as a guess message so they don't spoil others
      if (player.hasGuessedCorrectly) {
        const guessedMsg: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random()}`,
          senderId: player.id,
          senderName: player.name,
          text: trimmed,
          type: 'chat',
          timestamp: Date.now()
        };
        // Broadcast only to players who have already guessed correctly or the drawer
        for (const p of this.players.values()) {
          if (p.hasGuessedCorrectly || p.isDrawing) {
            this.io.to(p.socketId).emit('chat_message', guessedMsg);
          }
        }
        return;
      }
    }

    // Standard public chat / guess message
    const chatMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      senderId: player.id,
      senderName: player.name,
      text: trimmed,
      type: this.game.phase === 'DRAWING' ? 'guess' : 'chat',
      timestamp: Date.now()
    };
    this.addAndBroadcastMessage(chatMsg);
  }

  public handleStroke(stroke: DrawStroke, playerId: string): void {
    const drawer = this.game.getCurrentDrawer();
    if (!drawer || drawer.id !== playerId || this.game.phase !== 'DRAWING') return;

    this.game.addStroke(stroke);
    // Broadcast stroke to everyone else in the room
    this.io.to(this.id).emit('draw_data', stroke);
  }

  public handleUndo(playerId: string): void {
    const drawer = this.game.getCurrentDrawer();
    if (!drawer || drawer.id !== playerId || this.game.phase !== 'DRAWING') return;

    this.game.undoStroke();
    this.io.to(this.id).emit('canvas_undo');
  }

  public handleClear(playerId: string): void {
    const drawer = this.game.getCurrentDrawer();
    if (!drawer || drawer.id !== playerId || this.game.phase !== 'DRAWING') return;

    this.game.clearCanvas();
    this.io.to(this.id).emit('canvas_clear');
  }

  private addAndBroadcastMessage(msg: ChatMessage): void {
    this.chatHistory.push(msg);
    if (this.chatHistory.length > 100) this.chatHistory.shift();
    this.io.to(this.id).emit('chat_message', msg);
  }

  private addSystemMessage(text: string): void {
    const msg: ChatMessage = {
      id: `sys-${Date.now()}-${Math.random()}`,
      senderName: 'System',
      text,
      type: 'system',
      timestamp: Date.now()
    };
    this.addAndBroadcastMessage(msg);
  }

  private sendSystemToPlayer(playerId: string, text: string): void {
    const player = this.players.get(playerId);
    if (!player) return;
    const msg: ChatMessage = {
      id: `sys-p-${Date.now()}`,
      senderName: 'System',
      text,
      type: 'system',
      timestamp: Date.now()
    };
    this.io.to(player.socketId).emit('chat_message', msg);
  }

  public broadcastState(): void {
    const playersList = Array.from(this.players.values()).map(p => p.toJSON());
    const drawer = this.game.getCurrentDrawer();
    const sortedLeaderboard = [...playersList].sort((a, b) => b.score - a.score);

    // Send state tailored to each player (hide target word unless drawing or round over)
    for (const player of this.players.values()) {
      if (player.isBot) continue;

      const isCurrentDrawer = drawer?.id === player.id;
      const showFullWord = isCurrentDrawer || this.game.phase === 'ROUND_END' || this.game.phase === 'GAME_OVER';

      const state: RoomState = {
        id: this.id,
        name: this.name,
        isPrivate: this.isPrivate,
        settings: this.settings,
        phase: this.game.phase,
        currentRound: this.game.currentRound,
        currentDrawerId: drawer ? drawer.id : null,
        drawerName: drawer ? drawer.name : null,
        wordToGuess: showFullWord ? this.game.currentWord : this.game.getMaskedWord(),
        revealedHints: this.game.getMaskedWord(),
        wordLength: this.game.currentWord.length,
        timeLeft: this.game.timeLeft,
        players: playersList,
        wordOptions: (isCurrentDrawer && this.game.phase === 'SELECTING_WORD') ? this.game.wordOptions : undefined,
        roundWinnerInfo: this.game.phase === 'ROUND_END' ? {
          word: this.game.currentWord,
          pointsEarned: this.game.roundPointsEarned
        } : undefined,
        winner: this.game.phase === 'GAME_OVER' ? {
          player: sortedLeaderboard[0],
          leaderboard: sortedLeaderboard
        } : undefined
      };

      this.io.to(player.socketId).emit('game_state', state);
    }
  }

  private handleRoundEnd(): void {
    // When round ends, send system message revealing word
    this.addSystemMessage(`The word was: "${this.game.currentWord.toUpperCase()}"!`);
  }

  public destroy(): void {
    this.clearBotTimeouts();
    this.game.clearTimer();
  }
}
