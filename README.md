# Skribbl.io Clone - Full-Stack Multiplayer Drawing & Guessing Game

An end-to-end, production-ready clone of [skribbl.io](https://skribbl.io) built with React, TypeScript, HTML5 Canvas, Express, and Socket.IO.

## 🚀 Live Demo
- **Live Deployment URL**: `https://ais-dev-3tttzlm6gctzuh7epos6rt-438527688793.asia-northeast1.run.app`
- **Shared App URL**: `https://ais-pre-3tttzlm6gctzuh7epos6rt-438527688793.asia-northeast1.run.app`

---

## 🌟 Features Implemented

### 1. Multiplayer Room & Lobby Management
- **Public & Private Rooms**: Create private rooms with custom 6-character room codes or join open matchmaking lobbies.
- **Direct Invite Links**: 1-click invite link copying (`?room=ROOM_CODE`) for frictionless player onboarding.
- **Customizable Avatars**: Interactive SVG avatar customizer (10 body colors, 6 eye expressions, 6 mouth styles, randomizer button).
- **Solo / Testing Bot Feature**: Host can add or remove test bot players (`+ Bot` / `- Bot`) directly in the lobby, allowing solo evaluators to test 100% of multiplayer gameplay and turn rotation immediately!
- **Configurable Room Settings**:
  - Draw time: 30s to 120s
  - Rounds: 2 to 10 rounds
  - Word options per turn: 2 to 5 words
  - Hint count: 0 to 5 hints
  - Word categories: All, Animals, Food, Everyday Objects, Actions/Verbs, Nature
  - Custom word list: comma-separated custom words

### 2. Turn-Based Game Loop
- **Turn Rotation**: Every player in the room takes turns drawing in each round.
- **Word Selection**: Active drawer receives 3 randomized word choices with a 15-second countdown timer. Auto-selects if time expires.
- **Real-Time Guessing**: Non-drawers type guesses into the chatbox.
- **Hidden Secret Word**: Drawer sees the secret word; guessers only see dashes with character counts (e.g. `_ _ _ _ _ (5 letters)`).
- **Progressive Hints**: Letters are revealed automatically at 50% and 25% remaining time.
- **Close Guess Detection**: Built-in Levenshtein distance algorithm detects 1-character typos and whispers "You are very close!" to the player without alerting opponents.
- **Anti-Spoil Chat Filter**: Once a player guesses the word, their chat is highlighted in green for everyone ("PlayerX guessed the word!"), but subsequent messages from that player are hidden from players who haven't guessed yet to avoid spoiling.
- **Round End & Game Over**:
  - Shows the revealed word and round points breakdown with a countdown to the next turn.
  - Complete victory podium (1st, 2nd, 3rd) with celebratory confetti bursts, trophies, and full standings.
  - "Play Again" button for the host.

### 3. Real-Time Canvas & Drawing Tools
- **HTML5 Canvas**: High performance vector-like coordinate normalization (`0.0` to `1.0`) ensuring identical rendering across different screen resolutions and aspect ratios.
- **Smooth Bezier Curves**: Uses quadratic bezier curve interpolation for fluid, lag-free lines.
- **Tool Palette**:
  - Pen tool & Eraser tool
  - 22 Skribbl.io color palette
  - 4 stroke sizes (Fine 4px, Medium 8px, Bold 16px, Jumbo 28px)
  - Undo stroke & Clear canvas (drawer only, synced live to all viewers)
  - Download artwork PNG button

### 4. Interactive Audio Synthesizer
- Built using zero-latency Web Audio API (no external MP3/WAV assets required).
- Custom synthetic sound effects for:
  - Correct guess fanfare chime
  - Close guess nudge
  - Countdown ticking in final 10 seconds
  - Round end victory chord
  - Player join pop
  - Mute/Unmute audio toggle

---

## 🏗️ Architecture Overview

```
                      +-----------------------------+
                      |   React 19 Frontend (Vite)  |
                      |  - HTML5 Normalized Canvas  |
                      |  - SVG Avatar Customizer    |
                      |  - Web Audio Synthesizer    |
                      +--------------+--------------+
                                     |
                          WebSocket (Socket.IO)
                                     |
                      +--------------v--------------+
                      |     Node.js Express Server  |
                      +--------------+--------------+
                                     |
        +----------------------------+----------------------------+
        |                            |                            |
+-------v-------+            +-------v-------+            +-------v-------+
|  RoomManager  |            |     Room      |            |     Game      |
| - Matchmaking | <--------> | - Host/Players| <--------> | - Turn logic  |
| - Room Codes  |            | - Broadcast   |            | - Word timer  |
| - Connection  |            | - Chat filter |            | - Scoring/Hint|
+---------------+            +---------------+            +---------------+
                                                                  |
                                                          +-------v-------+
                                                          |  Game Logic   |
                                                          | - Levenshtein |
                                                          | - Point Math  |
                                                          | - Unit Tested |
                                                          +---------------+
```

### Server-Side OOP Architecture
- **`Player`**: Encapsulates socket ID, nickname, avatar configuration, score, drawing state, and guess status.
- **`Game`**: Manages round iterations, drawer rotation, word selection timer, drawing countdown, hint revelations, stroke history, and scoring algorithms.
- **`Room`**: Manages room state, player membership, chat message broadcasting, anti-spoil filtering, and tailor-made client game states (ensuring non-drawers never receive the secret word in payloads).
- **`RoomManager`**: Handles socket routing, room code generation, matchmaking, room creation, and garbage collection on disconnect.

### Word-Matching & Scoring Logic
- **Levenshtein Distance**: Measures edit distance between user guesses and the target word. If distance is 1 (or 2 for long words), the server whispers a close hint.
- **Guesser Score**: Base points (100) + speed bonus (up to 300 points based on remaining time fraction) + order bonus (+100 for 1st, +50 for 2nd).
- **Drawer Score**: Awarded up to 250 points proportional to how many players successfully guessed their drawing.

---

## 🧪 Unit Testing

Unit tests run using Node's built-in test runner (`node:test` and `node:assert/strict` via `tsx`):

```bash
npx --yes tsx --test src/game/logic.test.ts
```

Tests cover:
- Case-insensitivity, whitespace normalization, and trimming
- Exact word match validation
- Levenshtein edit distance calculations
- Close guess detection heuristics
- Speed and ranking score computations
- Masked word dash formatting with revealed hint indices

---

## 🛠️ Local Development & Setup

### Prerequisites
- Node.js 18+
- npm

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd skribbl-clone

# Install dependencies
npm install

# Run full-stack dev server (Vite + Express + Socket.IO on port 3000)
npm run dev

# Run unit tests
npx --yes tsx --test src/game/logic.test.ts

# Build for production
npm run build

# Start production server
npm start
```
