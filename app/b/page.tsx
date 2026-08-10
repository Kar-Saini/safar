"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

const VIDEO_SRC = "/video3.mp4";
const AUDIO_SRC = "/audio3.mp3";
const START_TIME = 20;

export default function Page() {
  const [playing, setPlaying] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [volume, setVolume] = useState(70);
  const [hasInteracted, setHasInteracted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --------------------------------------------------
  // Sync volume
  // --------------------------------------------------
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // --------------------------------------------------
  // Set audio start position when metadata loads
  // --------------------------------------------------
  const handleLoadedMetadata = () => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.currentTime = START_TIME;
    audio.volume = volume / 100;
  };

  // --------------------------------------------------
  // Start audio on FIRST user interaction
  // --------------------------------------------------
  useEffect(() => {
    const startAudio = async () => {
      const audio = audioRef.current;

      if (!audio || hasInteracted) return;

      audio.currentTime = START_TIME;
      audio.volume = volume / 100;
      audio.muted = false;

      try {
        await audio.play();

        setPlaying(true);
        setHasInteracted(true);

        window.removeEventListener("pointerdown", startAudio);
        window.removeEventListener("keydown", startAudio);
      } catch (err) {
        console.error("Audio playback failed:", err);
      }
    };

    window.addEventListener("pointerdown", startAudio);
    window.addEventListener("keydown", startAudio);

    return () => {
      window.removeEventListener("pointerdown", startAudio);
      window.removeEventListener("keydown", startAudio);
    };
  }, [hasInteracted, volume]);

  // --------------------------------------------------
  // Loop audio from START_TIME
  // --------------------------------------------------
  const handleAudioEnd = () => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.currentTime = START_TIME;

    audio.play().catch((err) => {
      console.error("Audio loop failed:", err);
      setPlaying(false);
    });
  };

  // --------------------------------------------------
  // Play / Pause
  // --------------------------------------------------
  const togglePlay = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    if (audio.currentTime < START_TIME) {
      audio.currentTime = START_TIME;
    }

    if (audioMuted) {
      audio.muted = false;
      setAudioMuted(false);
    }

    try {
      await audio.play();
      setPlaying(true);
      setHasInteracted(true);
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  // --------------------------------------------------
  // Mute / Unmute
  // --------------------------------------------------
  const toggleAudioMute = () => {
    const audio = audioRef.current;

    if (!audio) return;

    const nextMuted = !audioMuted;

    audio.muted = nextMuted;
    setAudioMuted(nextMuted);
  };

  // --------------------------------------------------
  // Keyboard shortcuts
  // Space = Play/Pause
  // M = Mute
  // --------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT"
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }

      if (e.code === "KeyM") {
        e.preventDefault();
        toggleAudioMute();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [playing, audioMuted]);

  return (
    <main className="safar-page relative min-h-screen w-full overflow-hidden">
      {/* Ambient effects */}
      <div className="ambient-shade" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      {/* ---------------------------------------------
          AUDIO
          --------------------------------------------- */}
      <audio
        ref={audioRef}
        src={AUDIO_SRC}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnd}
        preload="auto"
      />

      {/* ---------------------------------------------
          BACKGROUND VIDEO
          ALWAYS MUTED
          --------------------------------------------- */}
      <video
        ref={videoRef}
        className="bg-video absolute inset-0 h-full w-full object-cover pointer-events-none"
        src={VIDEO_SRC}
        autoPlay
        loop
        muted
        playsInline
      />

      {/* ---------------------------------------------
          TITLE
          --------------------------------------------- */}
      <div className="absolute top-8 left-1/2 z-10 -translate-x-1/2 text-center pointer-events-none">
        <h1 className="font-extrabold text-6xl md:text-7xl tracking-widest text-white/80 drop-shadow-2xl select-none">
          सफ़र
        </h1>
      </div>

      {/* ---------------------------------------------
          BOTTOM PLAYER
          --------------------------------------------- */}
      <section className="bottom-player z-20" aria-label="Audio controls">
        <div className="player-controls">
          <button
            className="deck-play"
            onClick={togglePlay}
            aria-label={playing ? "Pause music" : "Play music"}
          >
            {playing ? <Pause size={14} /> : <Play size={12} />}

            <span>{playing ? "PAUSE" : "PLAY"}</span>
          </button>
        </div>

        {/* Volume */}
        <div className="volume">
          <button
            onClick={toggleAudioMute}
            className="p-1 hover:text-white transition-colors"
            aria-label={audioMuted ? "Unmute audio" : "Mute audio"}
          >
            {audioMuted || volume === 0 ? (
              <VolumeX size={14} />
            ) : (
              <Volume2 size={14} />
            )}
          </button>

          <input
            aria-label="Volume"
            type="range"
            min="0"
            max="100"
            value={audioMuted ? 0 : volume}
            onChange={(e) => {
              const newVolume = Number(e.target.value);

              setVolume(newVolume);

              if (newVolume > 0 && audioRef.current) {
                audioRef.current.muted = false;
                setAudioMuted(false);
              }
            }}
          />
        </div>
      </section>
    </main>
  );
}
