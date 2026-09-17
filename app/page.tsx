"use client";

import { useEffect, useRef, useState } from "react";

const LOGICAL_WIDTH = 1280;
const LOGICAL_HEIGHT = 720;
const PLAYER_SIZE = 64;
const START_TEXT = "Prends des forces pour le voyage!";

type Direction = "down" | "up" | "left" | "right";
type Position = { x: number; y: number };
type WorldId = "creperie" | "amsterdam" | "greece" | "japan" | "scotland";

type World = {
  id: WorldId;
  title: string;
  map: string;
  walkableMask: string;
  playerStart: Position;
  target: Position;
  targetName: string;
  targetSprite?: string;
  quotes: string[];
  hint: string;
  targetOffset?: Position;
  final?: boolean;
};

const worlds: World[] = [
  {
    id: "creperie",
    title: "2022\nLà où tout a commencé...\nCrêperie de Josselin",
    map: "/maps/creperie_map_16x9.png",
    walkableMask: "/masks/walkable/creperie_walkable.png",
    playerStart: { x: 300, y: 560 },
    target: { x: 647, y: 232 },
    targetName: "Serveuse",
    quotes: [START_TEXT],
    hint: "",
    targetOffset: { x: 100, y: -10 },
  },
  {
    id: "amsterdam",
    title: "2023\nLes tulipes d'Amsterdam",
    map: "/maps/amsterdam_map_16x9.png",
    walkableMask: "/masks/walkable/amsterdam_walkable.png",
    playerStart: { x: 230, y: 570 },
    target: { x: 805, y: 385 },
    targetName: "Évoli",
    targetSprite: "/sprites/pokemon/evoli_idle.png",
    quotes: ["",
      "watashi wa totemo kawaii Ebui desu!",
      "给我吃的！",
      "...",
      "把你抓起来",
    ],
    hint: "Suis le canal et trouve Évoli.",
  },
  {
    id: "greece",
    title: "2024\nLes cyclades",
    map: "/maps/greece_map_16x9.png",
    walkableMask: "/masks/walkable/greece_walkable.png",
    playerStart: { x: 230, y: 560 },
    target: { x: 810, y: 447 },
    targetName: "Tétarte",
    targetSprite: "/sprites/pokemon/tetarte_idle.png",
    quotes: ["",
      "WAWAWAWAWA",
      "Tétarte, 把你抓起来",
    ],
    hint: "Descends vers la plage et trouve Tétarte.",
  },
  {
    id: "japan",
    title: "2025\nLe Japon (the best)",
    map: "/maps/japan_map_16x9.png",
    walkableMask: "/masks/walkable/japan_walkable.png",
    playerStart: { x: 250, y: 585 },
    target: { x: 750, y: 475 },
    targetName: "Mokuro",
    targetSprite: "/sprites/pokemon/mokuro_idle.png",
    quotes: ["",
      "Watashi wa Mokuro desu",
      "Mokuro, 把你抓起来",
    ],
    hint: "Promène-toi dans le village et parle à Mokuro.",
  },
  {
    id: "scotland",
    title: "2026\nEt maintenant ...",
    map: "/maps/scotland_map_16x9.png",
    walkableMask: "/masks/walkable/scotland_walkable.png",
    playerStart: { x: 250, y: 585 },
    target: { x: 1082, y: 425 },
    targetName: "Ton moment",
    targetSprite: "/sprites/ui/ui_button_heart.png",
    quotes: [],
    hint: "",
    final: true,
  },
];

const playerSprites: Record<Direction, { idle: string; walk: string[] }> = {
  down: {
    idle: "/sprites/characters/player_idle_down.png",
    walk: [1, 2, 3, 4].map((frame) => `/sprites/characters/player_walk_down_${frame}.png`),
  },
  up: {
    idle: "/sprites/characters/player_idle_up.png",
    walk: [1, 2, 3, 4].map((frame) => `/sprites/characters/player_walk_up_${frame}.png`),
  },
  left: {
    idle: "/sprites/characters/player_idle_left.png",
    walk: [1, 2, 3, 4].map((frame) => `/sprites/characters/player_walk_left_${frame}.png`),
  },
  right: {
    idle: "/sprites/characters/player_idle_right.png",
    walk: [1, 2, 3, 4].map((frame) => `/sprites/characters/player_walk_right_${frame}.png`),
  },
};

const COMPANION_SPACING = 20;
const COMPANION_HISTORY_LIMIT = 400;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function distance(a: Position, b: Position) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function logicalStyle({ x, y }: Position) {
  return { left: `${(x / LOGICAL_WIDTH) * 100}%`, top: `${(y / LOGICAL_HEIGHT) * 100}%` };
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [worldIndex, setWorldIndex] = useState(0);
  const [player, setPlayer] = useState(worlds[0].playerStart);
  const [announcement, setAnnouncement] = useState(START_TEXT);
  const [caught, setCaught] = useState<Record<number, boolean>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState<Direction>("up");
  const [walkFrame, setWalkFrame] = useState(0);
  const [titleCard, setTitleCard] = useState<{ text: string; visible: boolean } | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const joystickRef = useRef({ x: 0, y: 0 });
  const padRef = useRef<HTMLDivElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const walkableMasksRef = useRef(new Map<WorldId, CanvasRenderingContext2D>());
  const playerHistoryRef = useRef<Position[]>([]);
  const [companionPositions, setCompanionPositions] = useState<Position[]>([]);

  const world = worlds[worldIndex];
  const canInteract = started && !isTransitioning && !caught[worldIndex] && !titleCard;
  const isMoving = Math.abs(joystick.x) >= 0.15 || Math.abs(joystick.y) >= 0.15;
  const playerSprite = isMoving
    ? playerSprites[direction].walk[walkFrame]
    : playerSprites[direction].idle;

  const companions = worlds
    .slice(0, worldIndex)
    .filter((entry) => entry.targetSprite && !entry.final);

  const playTitleCard = (text: string, onDone: () => void) => {
    setTitleCard({ text, visible: false });
    window.setTimeout(() => setTitleCard({ text, visible: true }), 30);
    window.setTimeout(() => setTitleCard({ text, visible: false }), 2200);
    window.setTimeout(() => {
      setTitleCard(null);
      onDone();
    }, 2700);
  };

  useEffect(() => {
    for (const entry of worlds) {
      const image = new Image();
      image.src = entry.walkableMask;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = LOGICAL_WIDTH;
        canvas.height = LOGICAL_HEIGHT;
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (!context) {
          throw new Error(`Unable to load the walkable mask for ${entry.id}.`);
        }

        context.drawImage(image, 0, 0);
        walkableMasksRef.current.set(entry.id, context);
      };
    }
  }, []);

  useEffect(() => {
    let frameId = 0;

    const tick = () => {
      setPlayer((previousPlayer) => {
        const movement = joystickRef.current;
        if (Math.abs(movement.x) < 0.15 && Math.abs(movement.y) < 0.15) {
          return previousPlayer;
        }

        const nextPlayer = {
          x: clamp(previousPlayer.x + movement.x * 5.5, PLAYER_SIZE / 2, LOGICAL_WIDTH - PLAYER_SIZE / 2),
          y: clamp(previousPlayer.y + movement.y * 5.5, PLAYER_SIZE / 2, LOGICAL_HEIGHT - PLAYER_SIZE / 2),
        };
        const mask = walkableMasksRef.current.get(world.id);

        if (!mask || mask.getImageData(Math.round(nextPlayer.x), Math.round(nextPlayer.y), 1, 1).data[0] > 127) {
          const history = playerHistoryRef.current;
          history.unshift(nextPlayer);
          if (history.length > COMPANION_HISTORY_LIMIT) {
            history.length = COMPANION_HISTORY_LIMIT;
          }

          if (companions.length > 0) {
            setCompanionPositions(
              companions.map((_, index) => {
                const historyIndex = (index + 1) * COMPANION_SPACING;
                return history[Math.min(historyIndex, history.length - 1)] ?? nextPlayer;
              })
            );
          }

          return nextPlayer;
        }

        return previousPlayer;
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [world.id, companions.length]);

  useEffect(() => {
    if (!isMoving) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setWalkFrame((currentFrame) => (currentFrame + 1) % 4);
    }, 140);

    return () => window.clearInterval(intervalId);
  }, [isMoving]);

  const updateJoystickFromPointer = (clientX: number, clientY: number) => {
    if (!padRef.current) {
      return;
    }

    const rect = padRef.current.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const length = Math.min(Math.hypot(dx, dy), rect.width * 0.28);
    const angle = Math.atan2(dy, dx);
    const x = clamp(Math.cos(angle) * (length / (rect.width * 0.28)), -1, 1);
    const y = clamp(Math.sin(angle) * (length / (rect.width * 0.28)), -1, 1);

    if (Math.abs(x) > Math.abs(y)) {
      setDirection(x >= 0 ? "right" : "left");
    } else {
      setDirection(y >= 0 ? "down" : "up");
    }

    joystickRef.current = { x, y };
    setJoystick({ x, y });
  };

  const resetJoystick = () => {
    joystickRef.current = { x: 0, y: 0 };
    setJoystick({ x: 0, y: 0 });
  };

  const handleInteract = () => {
    if (!canInteract) {
      return;
    }

    const interactionCenter = {
      x: world.target.x + (world.targetOffset?.x ?? 0),
      y: world.target.y + (world.targetOffset?.y ?? 0),
    };

    if (distance(player, interactionCenter) > 156) {
      setAnnouncement("Plus près... Tu vois le chemin et le compagnon ?");
      return;
    }

    const quotes = world.quotes.length > 0 ? world.quotes : ["Le moment est là."];
    const isLastQuote = quoteIndex >= quotes.length - 1;

    if (!isLastQuote) {
      const nextIndex = quoteIndex + 1;
      setQuoteIndex(nextIndex);
      setAnnouncement(quotes[nextIndex]);
      return;
    }

    setCaught((previousCaught) => ({ ...previousCaught, [worldIndex]: true }));
    setIsTransitioning(true);

    if (!world.final) {
      window.setTimeout(() => {
        const nextWorld = worlds[worldIndex + 1];
        const nextCompanions = worlds.slice(0, worldIndex + 1).filter((entry) => entry.targetSprite && !entry.final);
        setWorldIndex(worldIndex + 1);
        setPlayer(nextWorld.playerStart);
        playerHistoryRef.current = [nextWorld.playerStart];
        setCompanionPositions(nextCompanions.map(() => nextWorld.playerStart));
        setAnnouncement(nextWorld.hint);
        setQuoteIndex(0);
        setIsTransitioning(false);
        playTitleCard(nextWorld.title, () => {});
      }, 700);
      return;
    }

    window.setTimeout(() => setIsTransitioning(false), 700);
  };

  const worldIsComplete = caught[worldIndex] || world.final;

  const handleStart = () => {
    setStarted(true);
    void musicRef.current?.play().catch(() => undefined);
    playTitleCard(worlds[0].title, () => {});
  };

  const toggleMusic = () => {
    const music = musicRef.current;
    if (!music) {
      return;
    }

    if (music.paused) {
      void music.play().catch(() => undefined);
      setMusicEnabled(true);
      return;
    }

    music.pause();
    setMusicEnabled(false);
  };

  return (
    <main className="game-shell">
      <audio ref={musicRef} src="/audio/river-flows-in-you.mp3" loop preload="auto" />

      {!started && (
        <div className="intro-overlay">
          <div className="intro-card">
            <h1>wawawawawa</h1>
            <button onClick={handleStart}>Commencer</button>
          </div>
        </div>
      )}

      {titleCard && (
        <div className={`title-card-overlay${titleCard.visible ? " is-visible" : ""}`}>
          <div className="title-card-text">
            {titleCard.text.split("\n").map((line, index) => (
              <span key={index}>{line}</span>
            ))}
          </div>
        </div>
      )}

      <div className={`game-screen${isTransitioning ? " is-transitioning" : ""}`}>
        <img className="world-map" src={world.map} alt="" draggable={false} />

        <button
          className="music-toggle"
          type="button"
          onClick={toggleMusic}
          aria-label={musicEnabled ? "Couper la musique" : "Activer la musique"}
          title={musicEnabled ? "Couper la musique" : "Activer la musique"}
        >
          {musicEnabled ? "SON" : "MUET"}
        </button>

        <div className="hud">
          <div className={`announcement announcement-${world.id}`}>{announcement || world.hint}</div>
        </div>

        {started && !worldIsComplete && (
          <div
            className="interaction-marker"
            style={logicalStyle({
              x: world.target.x + (world.targetOffset?.x ?? 0),
              y: world.target.y + (world.targetOffset?.y ?? 0) - 78,
            })}
          >
            !
          </div>
        )}

        {world.targetSprite && !worldIsComplete && (
          <img
            className={`target-sprite${world.final ? " target-heart" : ""}`}
            src={world.targetSprite}
            alt={world.targetName}
            draggable={false}
            style={logicalStyle(world.target)}
          />
        )}
        {world.targetSprite && world.final && worldIsComplete && (
          <img
            className="target-sprite target-heart is-complete"
            src={world.targetSprite}
            alt={world.targetName}
            draggable={false}
            style={logicalStyle(world.target)}
          />
        )}

        <img
          className="player-sprite"
          src={playerSprite}
          alt=""
          draggable={false}
          style={{ ...logicalStyle(player), opacity: started ? 1 : 0.3 }}
        />

        {started &&
          companions.map((companion, index) => {
            const position = companionPositions[index] ?? player;
            return (
              <img
                key={companion.id}
                className="companion-sprite"
                src={companion.targetSprite}
                alt={companion.targetName}
                draggable={false}
                style={logicalStyle(position)}
              />
            );
          })}

        <div className="controls">
          <div
            ref={padRef}
            className="joystick"
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              updateJoystickFromPointer(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                updateJoystickFromPointer(event.clientX, event.clientY);
              }
            }}
            onPointerUp={(event) => {
              event.currentTarget.releasePointerCapture(event.pointerId);
              resetJoystick();
            }}
            onPointerCancel={resetJoystick}
          >
            <img className="joystick-base" src="/sprites/ui/ui_joystick_base.png" alt="" draggable={false} />
            <img
              className="joystick-knob"
              src="/sprites/ui/ui_joystick_knob.png"
              alt=""
              draggable={false}
              style={{ transform: `translate(${joystick.x * 26}px, ${joystick.y * 26}px)` }}
            />
          </div>

          <button className="interaction-button" onClick={handleInteract} disabled={!canInteract}>
            <img src="/sprites/ui/ui_button_interact.png" alt="" draggable={false} />
          </button>
        </div>
      </div>
    </main>
  );
}
