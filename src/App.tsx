/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dice5, 
  User, 
  ArrowUpRight, 
  ArrowDownRight, 
  RotateCcw, 
  Trophy,
  History,
  Gamepad2,
  Zap,
  Skull
} from 'lucide-react';

// --- Constants ---
const GRID_SIZE = 10;
const TOTAL_SQUARES = 100;

// Snakes: [start, end]
const SNAKES: Record<number, number> = {
  99: 80,
  95: 75,
  92: 88,
  89: 68,
  64: 60,
  49: 11,
  46: 25,
  16: 6,
};

// Ladders: [start, end]
const LADDERS: Record<number, number> = {
  2: 38,
  7: 14,
  8: 31,
  15: 26,
  21: 42,
  28: 84,
  36: 44,
  51: 67,
  71: 91,
  78: 98,
  87: 94,
};

const COLORS = {
  snake: '#f43f5e',
  ladder: '#10b981',
  p1: '#8b5cf6',
  p2: '#f59e0b',
  bg: '#0f172a',
  card: '#1e293b',
  text: '#f8fafc',
};

type Player = {
  id: number;
  name: string;
  position: number;
  color: string;
  icon: React.ReactNode;
};

type GameLogEntry = {
  id: string;
  message: string;
  type: 'move' | 'snake' | 'ladder' | 'win' | 'info';
  timestamp: Date;
};

export default function App() {
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: 'Player 1', position: 1, color: COLORS.p1, icon: <User className="w-4 h-4" /> },
    { id: 2, name: 'Player 2', position: 1, color: COLORS.p2, icon: <User className="w-4 h-4" /> },
  ]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [gameLog, setGameLog] = useState<GameLogEntry[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string, type: GameLogEntry['type'] = 'info') => {
    setGameLog(prev => [
      { id: Math.random().toString(36).substr(2, 9), message, type, timestamp: new Date() },
      ...prev.slice(0, 49) // Keep last 50
    ]);
  }, []);

  useEffect(() => {
    addLog('Game started! Player 1 goes first.', 'info');
  }, [addLog]);

  const resetGame = () => {
    setPlayers(prev => prev.map(p => ({ ...p, position: 1 })));
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setWinner(null);
    setGameLog([]);
    addLog('Game reset! Player 1 goes first.', 'info');
  };

  const rollDice = async () => {
    if (isRolling || winner) return;

    setIsRolling(true);
    setDiceValue(null);

    // Simulate rolling animation
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceValue(roll);
    setIsRolling(false);

    movePlayer(roll);
  };

  const movePlayer = (steps: number) => {
    const currentPlayer = players[currentPlayerIndex];
    let newPosition = currentPlayer.position + steps;

    addLog(`${currentPlayer.name} rolled a ${steps}.`, 'move');

    if (newPosition > TOTAL_SQUARES) {
      addLog(`${currentPlayer.name} needs exactly ${TOTAL_SQUARES - currentPlayer.position} to win.`, 'info');
      newPosition = currentPlayer.position; // Stay put
    }

    // Check for snakes or ladders
    let finalPosition = newPosition;
    let transitionType: 'snake' | 'ladder' | null = null;

    if (SNAKES[newPosition]) {
      finalPosition = SNAKES[newPosition];
      transitionType = 'snake';
    } else if (LADDERS[newPosition]) {
      finalPosition = LADDERS[newPosition];
      transitionType = 'ladder';
    }

    // Update state
    setPlayers(prev => prev.map((p, i) => 
      i === currentPlayerIndex ? { ...p, position: finalPosition } : p
    ));

    if (transitionType === 'snake') {
      addLog(`Oh no! ${currentPlayer.name} hit a snake at ${newPosition} and fell to ${finalPosition}!`, 'snake');
    } else if (transitionType === 'ladder') {
      addLog(`Great! ${currentPlayer.name} climbed a ladder at ${newPosition} to ${finalPosition}!`, 'ladder');
    }

    if (finalPosition === TOTAL_SQUARES) {
      setWinner(currentPlayer);
      addLog(`🎉 ${currentPlayer.name} wins the game!`, 'win');
    } else {
      setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
    }
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameLog]);

  // Helper to get grid coordinates (x, y) for a square number
  const getCoordinates = (square: number) => {
    const zeroIndexed = square - 1;
    const row = Math.floor(zeroIndexed / GRID_SIZE);
    const col = zeroIndexed % GRID_SIZE;
    
    // Boustrophedon (snake-like) grid layout
    const x = row % 2 === 0 ? col : (GRID_SIZE - 1) - col;
    const y = (GRID_SIZE - 1) - row;
    
    return { x, y };
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Header Section */}
        <header className="lg:col-span-12 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1e293b] pb-6">
          <div>
            <div className="flex items-center gap-2 text-[#94a3b8] uppercase tracking-widest text-xs font-semibold mb-2">
              <Gamepad2 className="w-4 h-4" />
              <span>Premium Experience</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white">
              SNAKE AND <span className="text-[#10b981] drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">LADDER</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={resetGame}
              className="flex items-center gap-2 px-6 py-2 rounded-full border border-[#1e293b] bg-[#1e293b]/50 hover:bg-[#1e293b] transition-all text-sm font-medium text-white shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </header>

        {/* Main Board Section */}
        <main className="lg:col-span-8 flex flex-col gap-4">
          <div className="relative aspect-square w-full bg-[#1e293b] rounded-3xl shadow-2xl border border-[#334155] overflow-hidden p-3 md:p-6">
            {/* Grid Background */}
            <div className="grid grid-cols-10 grid-rows-10 w-full h-full gap-1 md:gap-2">
              {Array.from({ length: TOTAL_SQUARES }).map((_, i) => {
                const vRow = Math.floor(i / 10);
                const vCol = i % 10;
                const row = 9 - vRow;
                const col = row % 2 === 0 ? vCol : 9 - vCol;
                const num = row * 10 + col + 1;

                const isSnakeStart = SNAKES[num];
                const isLadderStart = LADDERS[num];

                return (
                  <div 
                    key={num}
                    id={`square-${num}`}
                    className={`relative flex items-center justify-center rounded-xl text-[10px] md:text-sm font-black transition-all
                      ${(Math.floor((num-1)/10) + (num-1)%10) % 2 === 0 ? 'bg-[#334155]/40' : 'bg-[#334155]/20'}
                      ${isSnakeStart ? 'ring-2 ring-red-500 bg-red-500/20' : ''}
                      ${isLadderStart ? 'ring-2 ring-emerald-500 bg-emerald-500/20' : ''}
                      hover:scale-[1.05] hover:z-20 cursor-default
                    `}
                  >
                    <span className="absolute top-1 left-1.5 opacity-40 text-[8px] md:text-[10px]">{num}</span>
                    
                    {isSnakeStart && (
                      <div className="flex flex-col items-center gap-0.5">
                        <Skull className="w-5 h-5 text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                        <span className="text-[8px] text-red-400 font-bold">-{num - isSnakeStart}</span>
                      </div>
                    )}
                    {isLadderStart && (
                      <div className="flex flex-col items-center gap-0.5">
                        <Zap className="w-5 h-5 text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                        <span className="text-[8px] text-emerald-400 font-bold">+{isLadderStart - num}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* SVG Connections Layer */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full p-3 md:p-6 overflow-visible">
              <defs>
                <linearGradient id="snakeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#9f1239" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="ladderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#065f46" stopOpacity="0.4" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Draw Ladders */}
              {Object.entries(LADDERS).map(([start, end]) => {
                const s = getCoordinates(parseInt(start));
                const e = getCoordinates(end);
                return (
                  <line 
                    key={`ladder-${start}`}
                    x1={`${s.x * 10 + 5}%`} y1={`${s.y * 10 + 5}%`}
                    x2={`${e.x * 10 + 5}%`} y2={`${e.y * 10 + 5}%`}
                    stroke="url(#ladderGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="4 12"
                    className="opacity-60"
                    filter="url(#glow)"
                  />
                );
              })}

              {/* Draw Snakes */}
              {Object.entries(SNAKES).map(([start, end]) => {
                const s = getCoordinates(parseInt(start));
                const e = getCoordinates(end);
                // Deterministic curve based on start position
                const offset = (parseInt(start) % 3 - 1) * 3;
                const midX = (s.x + e.x) / 2 + offset;
                const midY = (s.y + e.y) / 2 + offset;
                return (
                  <path 
                    key={`snake-${start}`}
                    d={`M ${s.x * 10 + 5} ${s.y * 10 + 5} Q ${midX * 10 + 5} ${midY * 10 + 5} ${e.x * 10 + 5} ${e.y * 10 + 5}`}
                    stroke="url(#snakeGradient)"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    className="opacity-60"
                    filter="url(#glow)"
                  />
                );
              })}
            </svg>

            {/* Players Layer */}
            <div className="absolute inset-0 pointer-events-none p-3 md:p-6">
              <div className="relative w-full h-full">
                {players.map((player) => {
                  const { x, y } = getCoordinates(player.position);
                  return (
                    <motion.div
                      key={player.id}
                      initial={false}
                      animate={{ 
                        left: `${x * 10 + 5}%`, 
                        top: `${y * 10 + 5}%` 
                      }}
                      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                      className="absolute w-8 h-8 md:w-10 md:h-10 -ml-4 -mt-4 md:-ml-5 md:-mt-5 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center border-2 border-white/20 z-30"
                      style={{ 
                        backgroundColor: player.color, 
                        color: 'white',
                        boxShadow: `0 0 15px ${player.color}66`
                      }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        {player.icon}
                      </motion.div>
                      {/* Offset for overlapping players */}
                      {players.some(p => p.id !== player.id && p.position === player.position) && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white border-2 border-slate-900" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>

        {/* Info & Controls Section */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Current Turn Card */}
          <div className="bg-[#1e293b] rounded-3xl p-6 shadow-2xl border border-[#334155] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] mb-4 relative z-10">Current Turn</h2>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ring-4 ring-white/5"
                  style={{ backgroundColor: players[currentPlayerIndex].color }}
                >
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-black text-2xl text-white">{players[currentPlayerIndex].name}</p>
                  <p className="text-sm text-[#94a3b8] font-medium">Square {players[currentPlayerIndex].position}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-tighter">Last Roll</p>
                <p className="text-4xl font-black text-white">{diceValue || '-'}</p>
              </div>
            </div>

            <button
              onClick={rollDice}
              disabled={isRolling || !!winner}
              className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-4 transition-all relative z-10
                ${isRolling || !!winner 
                  ? 'bg-[#334155] text-[#64748b] cursor-not-allowed' 
                  : 'bg-[#10b981] text-white hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:brightness-110'
                }
              `}
            >
              <Dice5 className={`w-8 h-8 ${isRolling ? 'animate-spin' : ''}`} />
              {isRolling ? 'ROLLING...' : winner ? 'GAME OVER' : 'ROLL DICE'}
            </button>
          </div>

          {/* Player Stats */}
          <div className="grid grid-cols-2 gap-4">
            {players.map((player) => (
              <div key={player.id} className="bg-[#1e293b] rounded-3xl p-5 shadow-xl border border-[#334155] relative overflow-hidden">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: player.color }} />
                  <span className="text-xs font-black uppercase tracking-widest text-[#94a3b8]">{player.name}</span>
                </div>
                <p className="text-3xl font-black text-white">{player.position}<span className="text-xs text-[#64748b] font-normal ml-1">/100</span></p>
                <div 
                  className="absolute bottom-0 left-0 h-1 transition-all duration-500" 
                  style={{ backgroundColor: player.color, width: `${player.position}%` }} 
                />
              </div>
            ))}
          </div>

          {/* Game Log */}
          <div className="bg-[#1e293b] rounded-3xl shadow-2xl border border-[#334155] flex flex-col h-[300px] overflow-hidden">
            <div className="p-5 border-b border-[#334155] flex items-center gap-3 bg-[#1e293b]/80 backdrop-blur-md">
              <History className="w-4 h-4 text-[#94a3b8]" />
              <h2 className="text-xs font-black uppercase tracking-widest text-[#94a3b8]">Live Feed</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth">
              <AnimatePresence initial={false}>
                {gameLog.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={`text-sm p-4 rounded-2xl border backdrop-blur-sm ${
                      log.type === 'snake' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                      log.type === 'ladder' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                      log.type === 'win' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 font-black' :
                      'bg-slate-800/50 border-slate-700 text-slate-300'
                    }`}
                  >
                    {log.message}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={logEndRef} />
            </div>
          </div>
        </aside>
      </div>

      {/* Winner Modal */}
      <AnimatePresence>
        {winner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0f172a]/90 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-[#1e293b] rounded-[3rem] p-10 md:p-16 max-w-md w-full text-center shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-[#334155]"
            >
              <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-amber-500/10">
                <Trophy className="w-12 h-12 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              </div>
              <h2 className="text-5xl font-black mb-4 text-white tracking-tighter">VICTORY!</h2>
              <p className="text-[#94a3b8] mb-10 text-lg font-medium leading-relaxed">
                <span className="font-black text-white block text-2xl mb-1" style={{ color: winner.color }}>{winner.name}</span> 
                has conquered the summit!
              </p>
              <button
                onClick={resetGame}
                className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
              >
                PLAY AGAIN
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
