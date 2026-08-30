"use client";

import { useEffect, useRef, useState } from "react";

const LOGICAL_WIDTH = 1280;
const LOGICAL_HEIGHT = 720;
const PLAYER_SIZE = 64;
const START_TEXT = "Prends des forces. Il y a un beau voyage qui t’attend.";

type Direction = "down" | "up" | "left" | "right";
type Position = { x: number; y: number };
type WorldId = "creperie" | "amsterdam" | "greece" | "japan" | "scotland";

type World = {
  id: WorldId;
  dateLabel: string;
  intro: string;
  map: string;
  walkableMask: string;
  playerStart: Position;
  target: Position;
  targetName: string;
  targetSprite?: string;
  quote: string;
  hint: string;
  final?: boolean;
};

const worlds: World[] = [
  {
    id: "creperie",
    dateLabel: "Début 2022",
    intro: "Tout commence autour d'une bonne crêpe.",
    map: "/maps/creperie_map_16x9.png",
    walkableMask: "/masks/walkable/creperie_walkable.png",
    playerStart: { x: 300, y: 560 },
    target: { x: 647, y: 232 },
    targetName: "Serveuse",
    quote: START_TEXT,
    hint: "Approche-toi de la serveuse pour commencer le voyage.",
  },
  {
    id: "amsterdam",
    dateLabel: "Amsterdam 2023",
    intro: "Dès l’entrée, la balade se met en mouvement.",
    map: "/maps/amsterdam_map_16x9.png",
    walkableMask: "/masks/walkable/amsterdam_walkable.png",
    playerStart: { x: 230, y: 570 },
    target: { x: 805, y: 385 },
    targetName: "Évoli",
    targetSprite: "/sprites/pokemon/evoli_idle.png",
    quote: "Tu marches bien. Je viens avec toi.",
    hint: "Traverse les tulipes et parle à Évoli.",
  },
  {
    id: "greece",
    dateLabel: "Grèce 2024",
    intro: "Le soleil et l’eau calment tout.",
    map: "/maps/greece_map_16x9.png",
    walkableMask: "/masks/walkable/greece_walkable.png",
    playerStart: { x: 230, y: 560 },
    target: { x: 810, y: 447 },
    targetName: "Tétarte",
    targetSprite: "/sprites/pokemon/tetarte_idle.png",
    quote: "La mer a une voix très calme.",
    hint: "Descends vers la plage et trouve Tétarte.",
  },
  {
    id: "japan",
    dateLabel: "Japon 2025",
    intro: "Le village est paisible, presque suspendu dans le temps.",
    map: "/maps/japan_map_16x9.png",
    walkableMask: "/masks/walkable/japan_walkable.png",
    playerStart: { x: 250, y: 585 },
    target: { x: 750, y: 475 },
    targetName: "Mokuro",
    targetSprite: "/sprites/pokemon/mokuro_idle.png",
    quote: "Le silence est beau, ici.",
    hint: "Promène-toi dans le village et parle à Mokuro.",
  },
  {
    id: "scotland",
    dateLabel: "Ecosse 2026",
    intro: "La route s’achève. Il reste juste le moment qui compte.",
    map: "/maps/scotland_map_16x9.png",
    walkableMask: "/masks/walkable/scotland_walkable.png",
    playerStart: { x: 250, y: 585 },
    target: { x: 1082, y: 425 },
    targetName: "Ton moment",
    targetSprite: "/sprites/ui/ui_button_heart.png",
    quote: "",
    hint: "Le voyage est fini. Regarde vers le coucher du soleil.",
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
  const joystickRef = useRef({ x: 0, y: 0 });
  const padRef = useRef<HTMLDivElement | null>(null);
  const walkableMasksRef = useRef(new Map<WorldId, CanvasRenderingContext2D>());

  const world = worlds[worldIndex];
  const canInteract = started && !isTransitioning && !caught[worldIndex];
  const isMoving = Math.abs(joystick.x) >= 0.15 || Math.abs(joystick.y) >= 0.15;
  const playerSprite = isMoving
    ? playerSprites[direction].walk[walkFrame]
    : playerSprites[direction].idle;

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
          return nextPlayer;
        }

        return previousPlayer;
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [world.id]);

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

    if (world.id !== "creperie" && distance(player, world.target) > 78) {
      setAnnouncement("Plus près... Tu vois le chemin et le compagnon ?");
      return;
    }

    setCaught((previousCaught) => ({ ...previousCaught, [worldIndex]: true }));
    setAnnouncement(world.quote || "Le moment est là.");
    setIsTransitioning(true);

    if (!world.final) {
      window.setTimeout(() => {
        const nextWorld = worlds[worldIndex + 1];
        setWorldIndex(worldIndex + 1);
        setPlayer(nextWorld.playerStart);
        setAnnouncement(nextWorld.intro);
        setIsTransitioning(false);
      }, 700);
      return;
    }

    window.setTimeout(() => setIsTransitioning(false), 700);
  };

  const worldIsComplete = caught[worldIndex] || world.final;

  return (
    <main className="game-shell">
      {!started && (
        <div className="intro-overlay">
          <div className="intro-card">
            <h1>wawawawawa</h1>
            <button onClick={() => setStarted(true)}>Commencer</button>
          </div>
        </div>
      )}

      <div className={`game-screen${isTransitioning ? " is-transitioning" : ""}`}>
        <img className="world-map" src={world.map} alt="" draggable={false} />

        <div className="hud">
          <div className="announcement">{announcement || world.hint}</div>
          <div className="date-label">{world.dateLabel}</div>
        </div>

        {world.targetSprite && (
          <img
            className={`target-sprite${world.final ? " target-heart" : ""}${worldIsComplete ? " is-complete" : ""}`}
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
