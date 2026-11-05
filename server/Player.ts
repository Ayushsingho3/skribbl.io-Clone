import { AvatarConfig, PlayerData } from '../src/types/game';

export class Player {
  public readonly id: string;
  public name: string;
  public avatar: AvatarConfig;
  public isHost: boolean;
  public score: number = 0;
  public hasGuessedCorrectly: boolean = false;
  public isDrawing: boolean = false;
  public isReady: boolean = true;
  public isBot: boolean = false;
  public socketId: string;

  constructor(id: string, name: string, avatar: AvatarConfig, isHost: boolean = false, isBot: boolean = false) {
    this.id = id;
    this.socketId = id;
    this.name = name.trim() || 'Doodler';
    this.avatar = avatar;
    this.isHost = isHost;
    this.isBot = isBot;
  }

  public resetRoundState(): void {
    this.hasGuessedCorrectly = false;
    this.isDrawing = false;
  }

  public resetGameState(): void {
    this.score = 0;
    this.resetRoundState();
  }

  public addScore(points: number): void {
    this.score += points;
  }

  public toJSON(): PlayerData {
    return {
      id: this.id,
      name: this.name,
      avatar: this.avatar,
      isHost: this.isHost,
      score: this.score,
      hasGuessedCorrectly: this.hasGuessedCorrectly,
      isDrawing: this.isDrawing,
      isReady: this.isReady,
      isBot: this.isBot,
    };
  }
}
