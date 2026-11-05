import { DrawStroke, GamePhase, PlayerData, RoomSettings } from '../src/types/game';
import { calculateDrawerScore, calculateGuesserScore, generateMaskedWord, getRevealedIndices, isCloseGuess, isCorrectGuess } from '../src/game/logic';
import { getRandomWords } from '../src/game/words';
import { Player } from './Player';

export class Game {
  public phase: GamePhase = 'LOBBY';
  public currentRound: number = 1;
  public drawerIndex: number = -1;
  public currentWord: string = '';
  public wordOptions: string[] = [];
  public revealedIndices: Set<number> = new Set<number>();
  public timeLeft: number = 0;
  public totalDrawTime: number = 80;
  public strokes: DrawStroke[] = [];
  public guessOrder: number = 0;
  public roundPointsEarned: { [playerId: string]: number } = {};
  private timerInterval: NodeJS.Timeout | null = null;
  private onStateChange: () => void;
  private onRoundEnd: () => void;

  constructor(
    private getPlayers: () => Player[],
    private getSettings: () => RoomSettings,
    onStateChange: () => void,
    onRoundEnd: () => void
  ) {
    this.onStateChange = onStateChange;
    this.onRoundEnd = onRoundEnd;
  }

  public startGame(): void {
    const players = this.getPlayers();
    if (players.length < 1) return;

    players.forEach(p => p.resetGameState());
    this.currentRound = 1;
    this.drawerIndex = -1;
    this.startNextTurn();
  }

  public startNextTurn(): void {
    this.clearTimer();
    const players = this.getPlayers();
    if (players.length === 0) return;

    this.drawerIndex = (this.drawerIndex + 1);
    
    // Check if full cycle completed
    if (this.drawerIndex >= players.length) {
      this.drawerIndex = 0;
      this.currentRound++;
      const maxRounds = this.getSettings().rounds;
      if (this.currentRound > maxRounds) {
        this.endGame();
        return;
      }
    }

    // Reset round states
    players.forEach(p => p.resetRoundState());
    const drawer = players[this.drawerIndex];
    if (drawer) {
      drawer.isDrawing = true;
    }

    this.strokes = [];
    this.roundPointsEarned = {};
    this.guessOrder = 0;
    this.revealedIndices = new Set<number>();

    // Prepare word options
    const settings = this.getSettings();
    this.totalDrawTime = settings.drawTime;
    this.wordOptions = getRandomWords(settings.wordCount || 3, settings.wordCategory || 'all', settings.customWords);
    this.phase = 'SELECTING_WORD';
    this.timeLeft = 15; // 15 seconds to choose

    this.onStateChange();

    // Start word selection timer
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        // Auto-select first word if drawer didn't choose
        const chosen = this.wordOptions[0] || 'apple';
        this.selectWord(chosen);
      } else {
        this.onStateChange();
      }
    }, 1000);

    // If drawer is a bot, pick automatically after 2 seconds
    if (drawer && drawer.isBot) {
      setTimeout(() => {
        if (this.phase === 'SELECTING_WORD') {
          const randWord = this.wordOptions[Math.floor(Math.random() * this.wordOptions.length)] || 'cat';
          this.selectWord(randWord);
        }
      }, 2000);
    }
  }

  public selectWord(word: string): void {
    if (this.phase !== 'SELECTING_WORD') return;
    this.clearTimer();

    this.currentWord = word;
    this.phase = 'DRAWING';
    this.timeLeft = this.totalDrawTime;
    this.revealedIndices = new Set<number>();

    this.onStateChange();

    // Start drawing round timer
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      
      // Hint revelation logic based on settings
      const settings = this.getSettings();
      const maxHints = settings.hintsCount ?? 2;
      if (maxHints > 0) {
        const halfTime = Math.floor(this.totalDrawTime * 0.5);
        const quarterTime = Math.floor(this.totalDrawTime * 0.25);
        
        if (this.timeLeft === halfTime && this.revealedIndices.size === 0) {
          this.revealHints(1);
        } else if (this.timeLeft === quarterTime && this.revealedIndices.size < maxHints) {
          this.revealHints(maxHints);
        }
      }

      if (this.timeLeft <= 0) {
        this.endRound();
      } else {
        this.onStateChange();
      }
    }, 1000);
  }

  private revealHints(count: number): void {
    const revealed = getRevealedIndices(this.currentWord, count);
    for (const idx of revealed) {
      this.revealedIndices.add(idx);
    }
  }

  public handleGuess(player: Player, guessText: string): {
    isCorrect: boolean;
    isClose: boolean;
    points: number;
  } {
    if (this.phase !== 'DRAWING') {
      return { isCorrect: false, isClose: false, points: 0 };
    }

    if (player.isDrawing || player.hasGuessedCorrectly) {
      return { isCorrect: false, isClose: false, points: 0 };
    }

    if (isCorrectGuess(guessText, this.currentWord)) {
      this.guessOrder++;
      player.hasGuessedCorrectly = true;
      const points = calculateGuesserScore(this.timeLeft, this.totalDrawTime, this.guessOrder);
      player.addScore(points);
      this.roundPointsEarned[player.id] = points;

      // Check if all non-drawers have guessed
      const players = this.getPlayers();
      const guessers = players.filter(p => !p.isDrawing);
      const correctGuessers = guessers.filter(p => p.hasGuessedCorrectly);

      if (guessers.length > 0 && correctGuessers.length === guessers.length) {
        // Speed up round finish (or end immediately)
        setTimeout(() => this.endRound(), 500);
      }

      this.onStateChange();
      return { isCorrect: true, isClose: false, points };
    }

    if (isCloseGuess(guessText, this.currentWord)) {
      return { isCorrect: false, isClose: true, points: 0 };
    }

    return { isCorrect: false, isClose: false, points: 0 };
  }

  public endRound(): void {
    this.clearTimer();
    this.phase = 'ROUND_END';

    const players = this.getPlayers();
    const drawer = this.getCurrentDrawer();
    const guessers = players.filter(p => !p.isDrawing);
    const correctGuessers = guessers.filter(p => p.hasGuessedCorrectly);

    if (drawer && guessers.length > 0) {
      const drawerPoints = calculateDrawerScore(correctGuessers.length, guessers.length);
      drawer.addScore(drawerPoints);
      this.roundPointsEarned[drawer.id] = drawerPoints;
    }

    this.onStateChange();
    this.onRoundEnd();

    // 5 seconds round recap countdown before next drawer
    this.timeLeft = 5;
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.clearTimer();
        this.startNextTurn();
      } else {
        this.onStateChange();
      }
    }, 1000);
  }

  public endGame(): void {
    this.clearTimer();
    this.phase = 'GAME_OVER';
    this.onStateChange();
  }

  public getCurrentDrawer(): Player | null {
    const players = this.getPlayers();
    if (this.drawerIndex >= 0 && this.drawerIndex < players.length) {
      return players[this.drawerIndex];
    }
    return null;
  }

  public addStroke(stroke: DrawStroke): void {
    if (this.phase === 'DRAWING') {
      this.strokes.push(stroke);
    }
  }

  public undoStroke(): void {
    if (this.phase === 'DRAWING' && this.strokes.length > 0) {
      this.strokes.pop();
    }
  }

  public clearCanvas(): void {
    if (this.phase === 'DRAWING') {
      this.strokes = [];
    }
  }

  public clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public getMaskedWord(): string {
    if (this.phase === 'ROUND_END' || this.phase === 'GAME_OVER') {
      return this.currentWord;
    }
    return generateMaskedWord(this.currentWord, this.revealedIndices);
  }
}
