"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

const VIDEO_SRC = "/video.mp4";
const AUDIO_SRC = "/audio.mp3";
const START_TIME = 50;

export default function Page() {
  const [playing, setPlaying] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [volume, setVolume] = useState(70);
  const [hasInteracted, setHasInteracted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // =========================================================
  // Sync volume with audio element
  // =========================================================

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.volume = volume / 100;
  }, [volume]);

  // =========================================================
  // Set initial audio position once metadata is available
  // =========================================================

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (audio.currentTime < START_TIME) {
      audio.currentTime = START_TIME;
    }

    audio.volume = volume / 100;
  };

  // =========================================================
  // Start audio
  // =========================================================

  const startAudio = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio || hasInteracted) return;

    /*
      Start from 50 seconds.
    */
    audio.currentTime = START_TIME;

    audio.volume = volume / 100;
    audio.muted = false;

    try {
      await audio.play();

      setPlaying(true);
      setHasInteracted(true);
    } catch (error) {
      /*
        This can still happen if the browser decides
        the interaction isn't sufficient for autoplay.
      */
      console.error("Audio playback failed:", error);
    }
  }, [hasInteracted, volume]);

  // =========================================================
  // First user interaction
  //
  // This is required because browsers block audible
  // autoplay without user interaction.
  // =========================================================

  useEffect(() => {
    if (hasInteracted) return;

    const handleFirstInteraction = () => {
      void startAudio();
    };

    window.addEventListener("pointerdown", handleFirstInteraction, {
      once: true,
    });

    window.addEventListener("keydown", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);

      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [hasInteracted, startAudio]);

  // =========================================================
  // Loop audio from START_TIME
  // =========================================================

  const handleAudioEnd = () => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.currentTime = START_TIME;

    audio
      .play()
      .then(() => {
        setPlaying(true);
      })
      .catch((error) => {
        console.error("Audio loop failed:", error);
        setPlaying(false);
      });
  };

  // =========================================================
  // Play / Pause
  // =========================================================

  const togglePlay = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    /*
      Make sure playback never starts before
      the configured start point.
    */
    if (audio.currentTime < START_TIME) {
      audio.currentTime = START_TIME;
    }

    /*
      If user presses Play after muting,
      automatically unmute.
    */
    if (audioMuted) {
      audio.muted = false;
      setAudioMuted(false);
    }

    try {
      await audio.play();

      setPlaying(true);
      setHasInteracted(true);
    } catch (error) {
      console.error("Audio playback error:", error);
    }
  };

  // =========================================================
  // Mute / Unmute
  // =========================================================

  const toggleAudioMute = () => {
    const audio = audioRef.current;

    if (!audio) return;

    const nextMuted = !audioMuted;

    audio.muted = nextMuted;

    setAudioMuted(nextMuted);
  };

  // =========================================================
  // Volume
  // =========================================================

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(event.target.value);

    setVolume(newVolume);

    const audio = audioRef.current;

    if (!audio) return;

    /*
      Moving the volume slider above 0 automatically
      unmutes the audio.
    */
    if (newVolume > 0) {
      audio.muted = false;
      setAudioMuted(false);
    }

    /*
      Volume at 0 behaves like mute.
    */
    if (newVolume === 0) {
      audio.muted = true;
      setAudioMuted(true);
    }
  };

  // =========================================================
  // Keyboard controls
  //
  // Space = Play / Pause
  // M     = Mute
  // =========================================================

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      /*
        Don't hijack keyboard controls while typing
        or using the volume slider.
      */
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT"
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        void togglePlay();
      }

      if (event.code === "KeyM") {
        event.preventDefault();
        toggleAudioMute();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [playing, audioMuted]);

  // =========================================================
  // Render
  // =========================================================

  return (
    <main className="safar-page relative min-h-screen w-full overflow-hidden">
      {/* =====================================================
          VISUAL EFFECTS
          ===================================================== */}

      <div className="ambient-shade" aria-hidden="true" />

      <div className="grain" aria-hidden="true" />

      {/* =====================================================
          AUDIO

          Separate from the video.
          Video remains completely muted.
          ===================================================== */}

      <audio
        ref={audioRef}
        src={AUDIO_SRC}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnd}
        preload="auto"
      />

      {/* =====================================================
          BACKGROUND VIDEO

          ALWAYS MUTED
          ===================================================== */}

      <video
        ref={videoRef}
        className="bg-video absolute inset-0 h-full w-full object-cover pointer-events-none"
        src={VIDEO_SRC}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      {/* =====================================================
          TITLE
          ===================================================== */}

      <div
        className="
          absolute
          top-[24px]
          left-1/2
          z-10
          -translate-x-1/2
          text-center
          pointer-events-none
          w-full
          px-4
        "
      >
        <h1
          className="
            font-extrabold
            text-5xl
            sm:text-6xl
            md:text-7xl
            tracking-widest
            text-white/80
            drop-shadow-2xl
            select-none
          "
        >
          सफ़र
        </h1>
      </div>

      {/* =====================================================
          BOTTOM PLAYER
          ===================================================== */}

      <section className="bottom-player z-20" aria-label="Audio controls">
        {/* Play / Pause */}
        <div className="player-controls">
          <button
            type="button"
            className="deck-play"
            onClick={() => void togglePlay()}
            aria-label={playing ? "Pause music" : "Play music"}
          >
            {playing ? <Pause size={14} /> : <Play size={12} />}

            <span>{playing ? "PAUSE" : "PLAY"}</span>
          </button>
        </div>

        {/* Volume */}
        <div className="volume">
          <button
            type="button"
            onClick={toggleAudioMute}
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
            step="1"
            value={audioMuted ? 0 : volume}
            onChange={handleVolumeChange}
          />
        </div>
      </section>
    </main>
  );
}
