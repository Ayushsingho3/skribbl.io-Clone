import { Server, Socket } from 'socket.io';
import { AvatarConfig, DrawStroke, RoomSettings } from '../src/types/game';
import { Player } from './Player';
import { Room } from './Room';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private socketToRoom: Map<string, string> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public initialize(): void {
    this.io.on('connection', (socket: Socket) => {
      this.handleSocketConnection(socket);
    });
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return this.rooms.has(code) ? this.generateRoomCode() : code;
  }

  public getPublicRooms(): { id: string; name: string; playerCount: number; maxPlayers: number; inProgress: boolean }[] {
    const list: { id: string; name: string; playerCount: number; maxPlayers: number; inProgress: boolean }[] = [];
    for (const room of this.rooms.values()) {
      if (!room.isPrivate) {
        list.push({
          id: room.id,
          name: room.name,
          playerCount: room.players.size,
          maxPlayers: room.settings.maxPlayers,
          inProgress: room.game.phase !== 'LOBBY'
        });
      }
    }
    return list;
  }

  private handleSocketConnection(socket: Socket): void {
    // 1. Create Room
    socket.on('create_room', (data: {
      playerName: string;
      avatar: AvatarConfig;
      roomName?: string;
      isPrivate?: boolean;
      settings?: Partial<RoomSettings>;
    }) => {
      const roomId = this.generateRoomCode();
      const roomName = data.roomName?.trim() || `${data.playerName.trim() || 'Player'}'s Room`;
      const isPrivate = data.isPrivate ?? false;

      const room = new Room(roomId, roomName, isPrivate, this.io, data.settings);
      this.rooms.set(roomId, room);

      const player = new Player(socket.id, data.playerName, data.avatar, true);
      socket.join(roomId);
      this.socketToRoom.set(socket.id, roomId);

      room.addPlayer(player);
      socket.emit('room_joined', { roomId, playerId: player.id });
    });

    // 2. Join Room
    socket.on('join_room', (data: {
      roomId: string;
      playerName: string;
      avatar: AvatarConfig;
    }) => {
      const code = data.roomId.trim().toUpperCase();
      const room = this.rooms.get(code);

      if (!room) {
        socket.emit('error_message', { message: `Room "${code}" not found!` });
        return;
      }

      if (room.players.size >= room.settings.maxPlayers) {
        socket.emit('error_message', { message: `Room "${code}" is full!` });
        return;
      }

      const player = new Player(socket.id, data.playerName, data.avatar, false);
      socket.join(room.id);
      this.socketToRoom.set(socket.id, room.id);

      room.addPlayer(player);
      socket.emit('room_joined', { roomId: room.id, playerId: player.id });

      // Send existing canvas strokes if round is active
      if (room.game.phase === 'DRAWING' && room.game.strokes.length > 0) {
        socket.emit('canvas_init', room.game.strokes);
      }
    });

    // 3. Quick Play (Matchmaking)
    socket.on('quick_join', (data: {
      playerName: string;
      avatar: AvatarConfig;
    }) => {
      // Find open public room
      for (const room of this.rooms.values()) {
        if (!room.isPrivate && room.players.size < room.settings.maxPlayers) {
          const player = new Player(socket.id, data.playerName, data.avatar, false);
          socket.join(room.id);
          this.socketToRoom.set(socket.id, room.id);

          room.addPlayer(player);
          socket.emit('room_joined', { roomId: room.id, playerId: player.id });
          if (room.game.phase === 'DRAWING' && room.game.strokes.length > 0) {
            socket.emit('canvas_init', room.game.strokes);
          }
          return;
        }
      }

      // If no public room exists, create a fresh public room
      const roomId = this.generateRoomCode();
      const roomName = `Public Room #${roomId.substring(0, 3)}`;
      const room = new Room(roomId, roomName, false, this.io);
      this.rooms.set(roomId, room);

      const player = new Player(socket.id, data.playerName, data.avatar, true);
      socket.join(roomId);
      this.socketToRoom.set(socket.id, roomId);

      room.addPlayer(player);
      socket.emit('room_joined', { roomId, playerId: player.id });
    });

    // 4. Update Settings (Host only)
    socket.on('update_settings', (newSettings: Partial<RoomSettings>) => {
      const roomId = this.socketToRoom.get(socket.id);
      if (!roomId) return;
      const room = this.rooms.get(roomId);
      if (room) {
        room.updateSettings(newSettings, socket.id);
      }
    });

    // 5. Start Game (Host only)
    socket.on('start_game', () => {
      const roomId = this.socketToRoom.get(socket.id);
      if (!roomId) return;
      const room = this.rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        room.game.startGame();
      }
    });

    // 6. Choose Word (Drawer only)
    socket.on('choose_word', (data: { word: string }) => {
      const roomId = this.socketToRoom.get(socket.id);
      if (!roomId) return;
      const room = this.rooms.get(roomId);
      if (room) {
        const drawer = room.game.getCurrentDrawer();
        if (drawer && drawer.id === socket.id) {
          room.game.selectWord(data.word);
        }
      }
    });

    // 7. Drawing Stroke
    socket.on('draw_stroke', (stroke: DrawStroke) => {
      const roomId = this.socketToRoom.get(socket.id);
      if (!roomId) return;
      const room = this.rooms.get(roomId);
      if (room) {
        room.handleStroke(stroke, socket.id);
      }
    });

    // 8. Canvas Undo
    socket.on('canvas_undo', () => {
      const roomId = this.socketToRoom.get(socket.id);
      if (!roomId) return;
      const room = this.rooms.get(roomId);
      if (room) {
        room.handleUndo(socket.id);
      }
    });

    // 9. Canvas Clear
    socket.on('canvas_clear', () => {
      const roomId = this.socketToRoom.get(socket.id);
      if (!roomId) return;
      const room = this.rooms.get(roomId);
      if (room) {
        room.handleClear(socket.id);
      }
    });

    // 10. Chat & Guess
    socket.on('send_chat', (data: { text: string }) => {
      const roomId = this.socketToRoom.get(socket.id);
      if (!roomId) return;
      const room = this.rooms.get(roomId);
      if (room) {
        const player = room.players.get(socket.id);
        if (player) {
          room.handleChatMessage(player, data.text);
        }
      }
    });

    // 11. Add / Remove Bot (Host testing tool)
    socket.on('add_bot', () => {
      const roomId = this.socketToRoom.get(socket.id);
      if (!roomId) return;
      const room = this.rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        room.addTestBot();
      }
    });

    socket.on('remove_bot', () => {
      const roomId = this.socketToRoom.get(socket.id);
      if (!roomId) return;
      const room = this.rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        room.removeTestBot();
      }
    });

    // 12. Request existing strokes
    socket.on('request_canvas_state', () => {
      const roomId = this.socketToRoom.get(socket.id);
      if (!roomId) return;
      const room = this.rooms.get(roomId);
      if (room && room.game.strokes.length > 0) {
        socket.emit('canvas_init', room.game.strokes);
      }
    });

    // 13. Disconnect
    socket.on('disconnect', () => {
      const roomId = this.socketToRoom.get(socket.id);
      if (!roomId) return;

      const room = this.rooms.get(roomId);
      if (room) {
        room.removePlayer(socket.id);
        if (room.players.size === 0) {
          room.destroy();
          this.rooms.delete(roomId);
        }
      }
      this.socketToRoom.delete(socket.id);
    });
  }
}
