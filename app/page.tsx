"use client";

import { useEffect, useRef, useState } from "react";

type WorldId = "amsterdam" | "greece" | "japan" | "lodge";

type World = {
  id: WorldId;
  title: string;
  subtitle: string;
  intro: string;
  background: string;
  accent: string;
  playerStart: { x: number; y: number };
  pokemon: { x: number; y: number; name: string; color: string; quote: string };
  hint: string;
  final?: boolean;
};

const worlds: World[] = [
  {
    id: "amsterdam",
    title: "Amsterdam",
    subtitle: "Champs de tulipes",
    intro: "Dès l’entrée, la balade se met en mouvement.",
    background:
      "linear-gradient(180deg, #9ad4ff 0%, #d6f0ff 38%, #dbe9af 38%, #d7ecac 100%)",
    accent: "#ff8262",
    playerStart: { x: 70, y: 210 },
    pokemon: { x: 360, y: 120, name: "Évoli", color: "#d4a5ff", quote: "Tu marches bien. Je viens avec toi." },
    hint: "Traverse les tulipes et parle à Évoli.",
  },
  {
    id: "greece",
    title: "Grèce",
    subtitle: "Plage de Naxos",
    intro: "Le soleil et l’eau calment tout.",
    background:
      "linear-gradient(180deg, #7ec8ff 0%, #c7efff 35%, #b8f1ff 35%, #4cc4d9 100%)",
    accent: "#4aa7ff",
    playerStart: { x: 80, y: 200 },
    pokemon: { x: 395, y: 185, name: "Tétarte", color: "#7ee4ff", quote: "La mer a une voix très calme." },
    hint: "Descends vers la plage et plonge un peu pour le trouver.",
  },
  {
    id: "japan",
    title: "Japon",
    subtitle: "Shirakawa-go",
    intro: "Le village est paisible, presque suspendu dans le temps.",
    background:
      "linear-gradient(180deg, #bfe7af 0%, #dff5b4 35%, #d4eac2 35%, #8dbf76 100%)",
    accent: "#9f6f44",
    playerStart: { x: 92, y: 210 },
    pokemon: { x: 330, y: 130, name: "Mokuro", color: "#7dcf7d", quote: "Le silence est beau, ici." },
    hint: "Promène-toi dans le village et parle à Mokuro.",
  },
  {
    id: "lodge",
    title: "Écosse",
    subtitle: "Lodge au coucher du soleil",
    intro: "La route s’achève. Il reste juste le moment qui compte.",
    background:
      "linear-gradient(180deg, #1d2a3a 0%, #734b3c 25%, #f7ad5b 45%, #f3d299 100%)",
    accent: "#f7d9a1",
    playerStart: { x: 120, y: 185 },
    pokemon: { x: 290, y: 140, name: "Ton moment", color: "#f7d9a1", quote: "" },
    hint: "Le voyage est fini. Regarde vers le coucher du soleil.",
    final: true,
  },
];

const START_TEXT = "Prends des forces. Il y a un beau voyage qui t’attend.";
const PLAYER_SIZE = 18;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [worldIndex, setWorldIndex] = useState(0);
  const [player, setPlayer] = useState(worlds[0].playerStart);
  const [announcement, setAnnouncement] = useState(START_TEXT);
  const [caught, setCaught] = useState<Record<number, boolean>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });
  const joystickRef = useRef({ x: 0, y: 0 });
  const padRef = useRef<HTMLDivElement | null>(null);

  const world = worlds[worldIndex];
  const currentPokemon = world.pokemon;
  const canInteract = started && !isTransitioning && !caught[worldIndex];

  useEffect(() => {
    let frameId = 0;

    const tick = () => {
      setPlayer((prev) => {
        const movement = joystickRef.current;
        if (Math.abs(movement.x) < 0.15 && Math.abs(movement.y) < 0.15) {
          return prev;
        }

        const nextX = clamp(prev.x + movement.x * 2.15, 20, 460);
        const nextY = clamp(prev.y + movement.y * 2.15, 30, 250);
        return { x: nextX, y: nextY };
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (worldIndex === 0 && started) {
      setAnnouncement(START_TEXT);
    }
  }, [worldIndex, started]);

  const updateJoystickFromPointer = (clientX: number, clientY: number) => {
    if (!padRef.current) {
      return;
    }

    const rect = padRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const length = Math.min(Math.hypot(dx, dy), rect.width * 0.28);
    const angle = Math.atan2(dy, dx);
    const x = Math.cos(angle) * (length / (rect.width * 0.28));
    const y = Math.sin(angle) * (length / (rect.width * 0.28));

    joystickRef.current = { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
    setJoystick({ x: joystickRef.current.x, y: joystickRef.current.y });
  };

  const resetJoystick = () => {
    joystickRef.current = { x: 0, y: 0 };
    setJoystick({ x: 0, y: 0 });
  };

  const handleInteract = () => {
    if (!started || !canInteract) {
      return;
    }

    if (distance(player, currentPokemon) > 28) {
      setAnnouncement("Plus près... Tu vois le chemin et le compagnon ?");
      return;
    }

    setCaught((prev) => ({ ...prev, [worldIndex]: true }));
    setAnnouncement(currentPokemon.quote || "Le moment est là.");

    if (worldIndex === worlds.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 700);
      return;
    }

    setIsTransitioning(true);
    setTimeout(() => {
      setWorldIndex((prev) => prev + 1);
      const nextWorld = worlds[Math.min(worldIndex + 1, worlds.length - 1)];
      setPlayer(nextWorld.playerStart);
      setAnnouncement(nextWorld.intro);
      setIsTransitioning(false);
    }, 700);
  };

  const worldIsComplete = caught[worldIndex] || world.final;

  return (
    <main className="game-shell">
      {!started && (
        <div className="intro-overlay">
          <div className="intro-card">
            <p className="eyebrow">wawawawa</p>
            <h1>Le chemin jusqu’à toi</h1>
            <p>{START_TEXT}</p>
            <button onClick={() => setStarted(true)}>Commencer</button>
          </div>
        </div>
      )}

      <div className="game-screen">
        <div className="hud">
          <div className="hud-top">
            <div>
              <p className="eyebrow">Voyage</p>
              <h2>{world.title}</h2>
            </div>
            <div className="badge">{world.subtitle}</div>
          </div>
          <div className="announcement">{announcement}</div>
        </div>

        <div className="world-map" style={{ background: world.background }}>
          {world.id === "amsterdam" && (
            <>
              <div className="windmill windmill-a" />
              <div className="windmill windmill-b" />
              <div className="tulip tulip-a" />
              <div className="tulip tulip-b" />
              <div className="tulip tulip-c" />
            </>
          )}

          {world.id === "greece" && (
            <>
              <div className="sea" />
              <div className="house house-a" />
              <div className="house house-b" />
              <div className="house house-c" />
            </>
          )}

          {world.id === "japan" && (
            <>
              <div className="field field-a" />
              <div className="field field-b" />
              <div className="house house-japan-a" />
              <div className="house house-japan-b" />
            </>
          )}

          {world.id === "lodge" && (
            <>
              <div className="mountains" />
              <div className="lodge-structure" />
              <div className="sun" />
            </>
          )}

          <div
            className="pokemon"
            style={{
              left: `${currentPokemon.x}px`,
              top: `${currentPokemon.y}px`,
              background: currentPokemon.color,
              opacity: worldIsComplete ? 0.25 : 1,
            }}
          >
            <span>{currentPokemon.name}</span>
          </div>

          <div
            className="player"
            style={{
              left: `${player.x}px`,
              top: `${player.y}px`,
              opacity: started ? 1 : 0.3,
            }}
          />
        </div>

        <div className="controls">
          <div
            ref={padRef}
            className="joystick"
            onPointerDown={(event) => {
              event.preventDefault();
              updateJoystickFromPointer(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => {
              if (event.pressure > 0) {
                updateJoystickFromPointer(event.clientX, event.clientY);
              }
            }}
            onPointerUp={resetJoystick}
            onPointerLeave={resetJoystick}
          >
            <div
              className="joystick-knob"
              style={{
                transform: `translate(${joystick.x * 26}px, ${joystick.y * 26}px)`,
              }}
            />
          </div>

          <button className="interaction-button" onClick={handleInteract} disabled={!canInteract}>
            {world.final ? "Regarder" : "Parler"}
          </button>
        </div>
      </div>
    </main>
  );
}
