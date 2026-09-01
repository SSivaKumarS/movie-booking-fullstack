import React, { useEffect, useRef, useState, useCallback } from "react";

const HeroTrailer = ({ onLaunchClick }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isInteractive, setIsInteractive] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [fps, setFps] = useState("60.0");
  const [currentGesture, setCurrentGesture] = useState("SWIPE_LEFT");
  const [currentSceneTag, setCurrentSceneTag] = useState("SCENE 01 // SWIPE GESTURE — BROWSE BLOCKBUSTERS");

  const duration = 15.0;
  const soundRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastStateUpdateRef = useRef(0);

  const stateRef = useRef({
    currentTime: 0,
    isPlaying: true,
    isInteractive: false,
    mouseX: 1200,
    mouseY: 500,
    lastTime: performance.now(),
    isVisible: true,
  });

  // Sync state values to mutable refs to prevent render-loop closures
  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    stateRef.current.isInteractive = isInteractive;
  }, [isInteractive]);

  // Web Audio Synthesizer Engine (Safely Managed)
  useEffect(() => {
    class SoundEngine {
      constructor() {
        this.ctx = null;
        this.enabled = true;
      }
      init() {
        if (!this.ctx) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) this.ctx = new AudioContextClass();
        }
        if (this.ctx && this.ctx.state === "suspended") {
          this.ctx.resume();
        }
      }
      playTone(freq, type = "sine", dur = 0.15, vol = 0.1) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(vol, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + dur);
        } catch (e) {
          // Fallback handling for browser autoplay restrictions
        }
      }
      destroy() {
        if (this.ctx) {
          this.ctx.close();
          this.ctx = null;
        }
      }
    }

    soundRef.current = new SoundEngine();
    return () => {
      if (soundRef.current) soundRef.current.destroy();
    };
  }, []);

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.enabled = audioEnabled;
    }
  }, [audioEnabled]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const posters = ["/posters/cyber_genesis.png", "/posters/chronos_rift.png", "/posters/neon_skyline.png"].map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const particleCount = isMobile ? 35 : 100;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * 1920,
      y: Math.random() * 1080,
      radius: Math.random() * 2.5 + 0.5,
      color: Math.random() > 0.4 ? "#00f0ff" : "#ff0055",
      alpha: Math.random() * 0.7 + 0.2,
      speedY: -(Math.random() * 0.6 + 0.2),
      speedX: (Math.random() - 0.5) * 0.4,
    }));

    const drawRoundedRect = (x, y, w, h, r) => {
      if (ctx.roundRect) {
        ctx.roundRect(x, y, w, h, r);
      } else {
        ctx.rect(x, y, w, h);
      }
    };

    function getHandJoints(baseX, baseY, gesture, scale, screenH) {
      const joints = [{ x: baseX, y: baseY }];
      const s = scale * (screenH / 1080);
      let offsets = [];

      if (gesture === "POINT") {
        offsets = [
          { x: -25 * s, y: -20 * s }, { x: -35 * s, y: -40 * s }, { x: -20 * s, y: -50 * s }, { x: -5 * s, y: -55 * s },
          { x: -20 * s, y: -70 * s }, { x: -35 * s, y: -140 * s }, { x: -50 * s, y: -210 * s }, { x: -65 * s, y: -270 * s },
          { x: 5 * s, y: -60 * s }, { x: 10 * s, y: -80 * s }, { x: 5 * s, y: -70 * s }, { x: 0 * s, y: -60 * s },
          { x: 25 * s, y: -55 * s }, { x: 30 * s, y: -75 * s }, { x: 25 * s, y: -65 * s }, { x: 20 * s, y: -55 * s },
          { x: 45 * s, y: -45 * s }, { x: 50 * s, y: -65 * s }, { x: 45 * s, y: -55 * s }, { x: 40 * s, y: -45 * s },
        ];
      } else {
        offsets = [
          { x: -30 * s, y: -35 * s }, { x: -55 * s, y: -60 * s }, { x: -75 * s, y: -85 * s }, { x: -95 * s, y: -110 * s },
          { x: -15 * s, y: -65 * s }, { x: -25 * s, y: -120 * s }, { x: -35 * s, y: -165 * s }, { x: -45 * s, y: -210 * s },
          { x: 5 * s, y: -70 * s }, { x: 5 * s, y: -130 * s }, { x: 5 * s, y: -180 * s }, { x: 5 * s, y: -225 * s },
          { x: 25 * s, y: -65 * s }, { x: 30 * s, y: -120 * s }, { x: 35 * s, y: -165 * s }, { x: 40 * s, y: -205 * s },
          { x: 45 * s, y: -55 * s }, { x: 55 * s, y: -100 * s }, { x: 65 * s, y: -135 * s }, { x: 75 * s, y: -170 * s },
        ];
      }

      offsets.forEach((off) => joints.push({ x: baseX + off.x, y: baseY + off.y }));
      return joints;
    }

    function drawHandSkeleton(joints) {
      if (!joints || joints.length < 21) return;
      ctx.save();
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [9, 10], [10, 11], [11, 12],
        [13, 14], [14, 15], [15, 16],
        [0, 17], [17, 18], [18, 19], [19, 20],
        [5, 9], [9, 13], [13, 17],
      ];

      ctx.lineWidth = 3;
      ctx.strokeStyle = "#00f0ff";
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#00f0ff";

      connections.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(joints[i].x, joints[i].y);
        ctx.lineTo(joints[j].x, joints[j].y);
        ctx.stroke();
      });

      joints.forEach((pt, idx) => {
        const isTip = [4, 8, 12, 16, 20].includes(idx);
        ctx.fillStyle = isTip ? "#ffffff" : "#00f0ff";
        ctx.shadowBlur = isTip ? 18 : 10;
        ctx.shadowColor = isTip ? "#ffffff" : "#00f0ff";
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isTip ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    const renderLoop = (now) => {
      const state = stateRef.current;
      const delta = (now - state.lastTime) / 1000;
      state.lastTime = now;

      if (state.isPlaying) {
        state.currentTime += delta;
        if (state.currentTime >= duration) state.currentTime = 0;
      }

      // Throttle React state updates to ~15fps for performance UI metrics
      if (now - lastStateUpdateRef.current > 66) {
        setCurrentTime(state.currentTime);
        if (delta > 0) setFps((1 / delta).toFixed(1));
        lastStateUpdateRef.current = now;
      }

      const { width, height } = canvas;
      const t = state.currentTime;
      ctx.clearRect(0, 0, width, height);

      // Render Particles
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y < 0) p.y = height + 10;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc((p.x / 1920) * width, (p.y / 1080) * height, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Scene timeline orchestration
      if (t < 2.5) {
        if (currentGesture !== "SWIPE_LEFT") {
          setCurrentGesture("SWIPE_LEFT");
          setCurrentSceneTag("SCENE 01 // SWIPE GESTURE — BROWSE BLOCKBUSTERS");
        }
        const progress = t / 2.5;
        const handX = state.isInteractive ? state.mouseX : width * (0.85 - progress * 0.45);
        const handY = state.isInteractive ? state.mouseY : height * 0.55;

        const posterW = width * 0.22;
        const posterH = posterW * 1.5;
        const carouselOffset = -progress * width * 0.35;

        [
          { title: "CYBER GENESIS", img: posters[0], x: width * 0.38 },
          { title: "CHRONOS RIFT", img: posters[1], x: width * 0.65 },
          { title: "NEON SKYLINE", img: posters[2], x: width * 0.92 },
        ].forEach((p, idx) => {
          const posX = p.x + carouselOffset;
          ctx.save();
          ctx.translate(posX, height * 0.45);
          ctx.shadowBlur = idx === 0 ? 30 : 12;
          ctx.shadowColor = "#00f0ff";
          ctx.fillStyle = "#070b19";
          ctx.beginPath();
          drawRoundedRect(-posterW / 2, -posterH / 2, posterW, posterH, 18);
          ctx.fill();

          if (p.img && p.img.complete && p.img.naturalWidth !== 0) {
            ctx.clip();
            ctx.drawImage(p.img, -posterW / 2, -posterH / 2, posterW, posterH);
          }
          ctx.strokeStyle = idx === 0 ? "#00f0ff" : "rgba(255,255,255,0.2)";
          ctx.lineWidth = idx === 0 ? 3 : 1;
          ctx.strokeRect(-posterW / 2, -posterH / 2, posterW, posterH);
          ctx.restore();
        });

        drawHandSkeleton(getHandJoints(handX, handY, "OPEN_SWIPE", 1.1, height));
      } else if (t < 5.0) {
        if (currentGesture !== "POINT_SELECT") {
          setCurrentGesture("POINT_SELECT");
          setCurrentSceneTag("SCENE 02 // POINT GESTURE — TARGET & EXPAND DETAILS");
        }
        const progress = (t - 2.5) / 2.5;
        const handX = state.isInteractive ? state.mouseX : width * 0.52 - progress * (width * 0.2);
        const handY = state.isInteractive ? state.mouseY : height * 0.68 - progress * (height * 0.22);

        drawHandSkeleton(getHandJoints(handX, handY, "POINT", 1.1, height));
      } else {
        if (currentGesture !== "LAUNCH_COMPLETE") {
          setCurrentGesture("LAUNCH_COMPLETE");
          setCurrentSceneTag("SCENE 06 // PRODUCT LAUNCH TRAILER");
        }
        ctx.save();
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.font = '900 48px "Outfit", sans-serif';
        ctx.shadowBlur = 30;
        ctx.shadowColor = "#00f0ff";
        ctx.fillText("THE FUTURE OF MOVIE BOOKING", width * 0.5, height * 0.45);
        ctx.restore();
      }

      if (stateRef.current.isVisible) {
        animFrameRef.current = requestAnimationFrame(renderLoop);
      }
    };

    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };

    let observer;
    if (typeof IntersectionObserver !== "undefined" && containerRef.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          const isVisible = entry ? entry.isIntersecting : true;
          stateRef.current.isVisible = isVisible;
          if (isVisible && !animFrameRef.current) {
            animFrameRef.current = requestAnimationFrame(renderLoop);
          } else if (!isVisible && animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(containerRef.current);
    }

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (observer && containerRef.current) observer.unobserve(containerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    stateRef.current.mouseX = e.clientX - rect.left;
    stateRef.current.mouseY = e.clientY - rect.top;
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-[#040409] rounded-3xl border border-cyan-500/20 shadow-2xl my-8">
      <div ref={containerRef} className="relative w-full aspect-video bg-black overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          className="absolute inset-0 w-full h-full cursor-crosshair z-10"
        />

        {/* HUD Top Bar */}
        <div className="absolute top-4 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-cyan-500/30">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#00f0ff]" />
            <span className="text-xs font-mono font-bold text-white tracking-widest uppercase">
              AI Motion Controller
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-[11px] font-mono text-gray-300">
            <div>FPS: <span className="text-cyan-400 font-bold">{fps}</span></div>
            <div>GESTURE: <span className="text-cyan-400 font-bold">{currentGesture}</span></div>
          </div>
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-4 left-6 right-6 z-20 bg-[#080d1a]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex flex-col gap-3 shadow-2xl">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickRatio = (e.clientX - rect.left) / rect.width;
              stateRef.current.currentTime = clickRatio * duration;
            }}
            className="w-full h-1.5 bg-gray-800 rounded-full cursor-pointer overflow-hidden relative"
          >
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-pink-500 shadow-[0_0_12px_#00f0ff]"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-bold">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3.5 py-2 bg-white/10 hover:bg-cyan-500/20 text-white rounded-xl border border-white/15 transition"
              >
                {isPlaying ? "PAUSE" : "PLAY"}
              </button>
              <button
                onClick={() => setIsInteractive(!isInteractive)}
                className={`px-3.5 py-2 rounded-xl transition border ${
                  isInteractive
                    ? "bg-cyan-400 text-black border-cyan-400 font-extrabold shadow-[0_0_15px_#00f0ff]"
                    : "bg-white/10 text-white border-white/15 hover:bg-cyan-500/20"
                }`}
              >
                INTERACTIVE HAND MODE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroTrailer;