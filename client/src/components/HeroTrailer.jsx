import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const HeroTrailer = ({ onLaunchClick }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isInteractive, setIsInteractive] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [fps, setFps] = useState(60.0);
  const [currentGesture, setCurrentGesture] = useState("SWIPE_LEFT");
  const [currentSceneTag, setCurrentSceneTag] = useState("SCENE 01 // SWIPE GESTURE — BROWSE BLOCKBUSTERS");

  const duration = 15.0; // 15 seconds video length
  const soundRef = useRef(null);
  const animFrameRef = useRef(null);
  const stateRef = useRef({
    currentTime: 0,
    isPlaying: true,
    isInteractive: false,
    mouseX: 1200,
    mouseY: 500,
    lastTime: performance.now(),
  });

  // Keep ref synchronized with state
  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    stateRef.current.isInteractive = isInteractive;
  }, [isInteractive]);

  // Audio Synthesizer Class
  useEffect(() => {
    class SoundEngine {
      constructor() {
        this.ctx = null;
        this.enabled = true;
      }
      init() {
        if (!this.ctx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AudioContext();
        }
        if (this.ctx.state === "suspended") {
          this.ctx.resume();
        }
      }
      playTone(freq, type = "sine", dur = 0.15, vol = 0.1) {
        if (!this.enabled) return;
        this.init();
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
        } catch (e) {}
      }
      playSwipe() {
        if (!this.enabled) return;
        this.init();
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(320, this.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.25);
          gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.25);
        } catch (e) {}
      }
      playLock() {
        this.playTone(880, "sine", 0.08, 0.15);
        setTimeout(() => this.playTone(1760, "triangle", 0.12, 0.12), 60);
      }
      playPinch() {
        this.playTone(523.25, "sine", 0.1, 0.12);
        setTimeout(() => this.playTone(1046.5, "sine", 0.15, 0.1), 80);
      }
      playConfirm() {
        this.playTone(440, "triangle", 0.1, 0.15);
        setTimeout(() => this.playTone(659.25, "triangle", 0.1, 0.15), 80);
        setTimeout(() => this.playTone(880, "sine", 0.3, 0.2), 160);
      }
    }

    soundRef.current = new SoundEngine();
  }, []);

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.enabled = audioEnabled;
    }
  }, [audioEnabled]);

  // Canvas Main Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Load poster images
    const posters = [];
    ["/posters/cyber_genesis.png", "/posters/chronos_rift.png", "/posters/neon_skyline.png"].forEach((src) => {
      const img = new Image();
      img.src = src;
      posters.push(img);
    });

    // Particle Engine - Scale down on mobile screens for 60FPS performance
    const particles = [];
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const particleCount = isMobile ? 35 : 120;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        radius: Math.random() * 2.5 + 0.5,
        color: Math.random() > 0.4 ? "#00f0ff" : "#ff0055",
        alpha: Math.random() * 0.7 + 0.2,
        speedY: -(Math.random() * 0.6 + 0.2),
        speedX: (Math.random() - 0.5) * 0.4,
      });
    }

    function getHandJoints(baseX, baseY, gesture, scale, screenH) {
      const joints = [];
      const s = scale * (screenH / 1080);
      const wrist = { x: baseX, y: baseY };

      let offsets = [];
      if (gesture === "OPEN_SWIPE") {
        offsets = [
          { x: -35 * s, y: -40 * s }, { x: -65 * s, y: -65 * s }, { x: -90 * s, y: -95 * s }, { x: -115 * s, y: -125 * s },
          { x: -20 * s, y: -70 * s }, { x: -30 * s, y: -130 * s }, { x: -40 * s, y: -180 * s }, { x: -50 * s, y: -230 * s },
          { x: 5 * s, y: -75 * s }, { x: 5 * s, y: -140 * s }, { x: 5 * s, y: -195 * s }, { x: 5 * s, y: -245 * s },
          { x: 30 * s, y: -70 * s }, { x: 35 * s, y: -130 * s }, { x: 40 * s, y: -180 * s }, { x: 45 * s, y: -225 * s },
          { x: 50 * s, y: -60 * s }, { x: 60 * s, y: -110 * s }, { x: 70 * s, y: -150 * s }, { x: 80 * s, y: -190 * s },
        ];
      } else if (gesture === "POINT") {
        offsets = [
          { x: -25 * s, y: -20 * s }, { x: -35 * s, y: -40 * s }, { x: -20 * s, y: -50 * s }, { x: -5 * s, y: -55 * s },
          { x: -20 * s, y: -70 * s }, { x: -35 * s, y: -140 * s }, { x: -50 * s, y: -210 * s }, { x: -65 * s, y: -270 * s },
          { x: 5 * s, y: -60 * s }, { x: 10 * s, y: -80 * s }, { x: 5 * s, y: -70 * s }, { x: 0 * s, y: -60 * s },
          { x: 25 * s, y: -55 * s }, { x: 30 * s, y: -75 * s }, { x: 25 * s, y: -65 * s }, { x: 20 * s, y: -55 * s },
          { x: 45 * s, y: -45 * s }, { x: 50 * s, y: -65 * s }, { x: 45 * s, y: -55 * s }, { x: 40 * s, y: -45 * s },
        ];
      } else if (gesture === "PINCH") {
        offsets = [
          { x: -30 * s, y: -40 * s }, { x: -50 * s, y: -70 * s }, { x: -40 * s, y: -110 * s }, { x: -20 * s, y: -140 * s },
          { x: -20 * s, y: -70 * s }, { x: -30 * s, y: -110 * s }, { x: -25 * s, y: -135 * s }, { x: -18 * s, y: -142 * s },
          { x: 10 * s, y: -65 * s }, { x: 20 * s, y: -110 * s }, { x: 30 * s, y: -140 * s }, { x: 40 * s, y: -165 * s },
          { x: 30 * s, y: -60 * s }, { x: 40 * s, y: -95 * s }, { x: 50 * s, y: -125 * s }, { x: 60 * s, y: -145 * s },
          { x: 50 * s, y: -50 * s }, { x: 60 * s, y: -80 * s }, { x: 70 * s, y: -105 * s }, { x: 80 * s, y: -125 * s },
        ];
      } else if (gesture === "THUMBS_UP") {
        offsets = [
          { x: -40 * s, y: -30 * s }, { x: -70 * s, y: -70 * s }, { x: -90 * s, y: -130 * s }, { x: -100 * s, y: -200 * s },
          { x: -15 * s, y: -50 * s }, { x: -20 * s, y: -70 * s }, { x: 0 * s, y: -65 * s }, { x: 10 * s, y: -50 * s },
          { x: 10 * s, y: -50 * s }, { x: 15 * s, y: -70 * s }, { x: 30 * s, y: -65 * s }, { x: 35 * s, y: -50 * s },
          { x: 30 * s, y: -45 * s }, { x: 35 * s, y: -65 * s }, { x: 50 * s, y: -60 * s }, { x: 55 * s, y: -45 * s },
          { x: 50 * s, y: -40 * s }, { x: 55 * s, y: -60 * s }, { x: 70 * s, y: -55 * s }, { x: 75 * s, y: -40 * s },
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

      joints.push(wrist);
      offsets.forEach((off) => joints.push({ x: wrist.x + off.x, y: wrist.y + off.y }));
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
        if (state.currentTime >= duration) {
          state.currentTime = 0;
        }
      }

      setCurrentTime(state.currentTime);
      if (delta > 0) setFps((1 / delta).toFixed(1));

      const width = canvas.width;
      const height = canvas.height;
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

      // SCENE 1: SWIPE (0s - 2.5s)
      if (t < 2.5) {
        setCurrentGesture("SWIPE_LEFT");
        setCurrentSceneTag("SCENE 01 // SWIPE GESTURE — BROWSE BLOCKBUSTERS");

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
          ctx.roundRect(-posterW / 2, -posterH / 2, posterW, posterH, 18);
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

        const joints = getHandJoints(handX, handY, "OPEN_SWIPE", 1.1, height);
        drawHandSkeleton(joints);
      }
      // SCENE 2: POINT (2.5s - 5.0s)
      else if (t < 5.0) {
        setCurrentGesture("POINT_SELECT");
        setCurrentSceneTag("SCENE 02 // POINT GESTURE — TARGET & EXPAND DETAILS");

        const progress = (t - 2.5) / 2.5;
        const targetX = width * 0.32;
        const targetY = height * 0.45;
        const handX = state.isInteractive ? state.mouseX : width * 0.52 - progress * (width * 0.2);
        const handY = state.isInteractive ? state.mouseY : height * 0.68 - progress * (height * 0.22);

        const posterW = width * 0.24;
        const posterH = posterW * 1.5;

        ctx.save();
        ctx.translate(targetX, targetY);
        ctx.shadowBlur = 40;
        ctx.shadowColor = "#00f0ff";
        ctx.fillStyle = "#050914";
        ctx.beginPath();
        ctx.roundRect(-posterW / 2, -posterH / 2, posterW, posterH, 20);
        ctx.fill();
        if (posters[0] && posters[0].complete && posters[0].naturalWidth !== 0) {
          ctx.clip();
          ctx.drawImage(posters[0], -posterW / 2, -posterH / 2, posterW, posterH);
        }
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 4;
        ctx.strokeRect(-posterW / 2, -posterH / 2, posterW, posterH);
        ctx.restore();

        // Details Panel
        const panelX = width * 0.48;
        const panelY = height * 0.22;
        const panelW = width * 0.45;
        const panelH = height * 0.52;

        ctx.save();
        ctx.fillStyle = "rgba(10, 15, 30, 0.88)";
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 20);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ff0055";
        ctx.font = '800 12px "Space Grotesk"';
        ctx.fillText("FEATURED BLOCKBUSTERS • 4K IMAX 3D", panelX + 30, panelY + 40);

        ctx.fillStyle = "#ffffff";
        ctx.font = '900 32px "Outfit"';
        ctx.fillText("CYBER GENESIS", panelX + 30, panelY + 80);

        ctx.fillStyle = "#00f0ff";
        ctx.font = '700 13px "Space Grotesk"';
        ctx.fillText("IMAX 3D • DOLBY ATMOS • RATING: 9.8 / 10", panelX + 30, panelY + 120);

        ctx.restore();

        const joints = getHandJoints(handX, handY, "POINT", 1.1, height);
        drawHandSkeleton(joints);
      }
      // SCENE 3: PINCH SEATS (5.0s - 7.5s)
      else if (t < 7.5) {
        setCurrentGesture("PINCH_SELECT");
        setCurrentSceneTag("SCENE 03 // PINCH GESTURE — PRECISION SEAT SELECTION");

        const progress = (t - 5.0) / 2.5;
        const isPinched = progress > 0.4;
        const handX = state.isInteractive ? state.mouseX : width * 0.65;
        const handY = state.isInteractive ? state.mouseY : height * 0.65;

        // Screen Bar
        ctx.save();
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#00f0ff";
        ctx.beginPath();
        ctx.arc(width * 0.5, height * -0.4, width * 0.45, Math.PI * 0.35, Math.PI * 0.65);
        ctx.stroke();
        ctx.restore();

        // Seats Grid
        const gridX = width * 0.25;
        const gridY = height * 0.32;
        const seatW = width * 0.035;
        const seatH = seatW * 0.85;

        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 10; c++) {
            const sx = gridX + c * (seatW + 12);
            const sy = gridY + r * (seatH + 12);
            const isSel = r === 3 && (c === 5 || c === 6) && isPinched;

            ctx.save();
            ctx.fillStyle = isSel ? "#00f0ff" : "rgba(0, 240, 255, 0.15)";
            ctx.beginPath();
            ctx.roundRect(sx, sy, seatW, seatH, 6);
            ctx.fill();
            ctx.strokeStyle = isSel ? "#ffffff" : "rgba(0, 240, 255, 0.3)";
            ctx.stroke();
            ctx.restore();
          }
        }

        const joints = getHandJoints(handX, handY, isPinched ? "PINCH" : "NORMAL", 1.1, height);
        drawHandSkeleton(joints);
      }
      // SCENE 4: THUMBS UP (7.5s - 9.8s)
      else if (t < 9.8) {
        setCurrentGesture("THUMBS_UP");
        setCurrentSceneTag("SCENE 04 // THUMBS UP GESTURE — EXPRESS BOOKING");

        const progress = (t - 7.5) / 2.3;
        const isAct = progress > 0.3;
        const handX = state.isInteractive ? state.mouseX : width * 0.5;
        const handY = state.isInteractive ? state.mouseY : height * 0.7;

        // Button
        const btnW = width * 0.4;
        const btnH = height * 0.15;
        const btnX = width * 0.5 - btnW / 2;
        const btnY = height * 0.35;

        ctx.save();
        ctx.fillStyle = isAct ? "#00f0ff" : "rgba(10, 20, 40, 0.85)";
        ctx.shadowBlur = isAct ? 50 : 20;
        ctx.shadowColor = "#00f0ff";
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 25);
        ctx.fill();
        ctx.strokeStyle = isAct ? "#ffffff" : "#00f0ff";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = isAct ? "#000000" : "#ffffff";
        ctx.font = '900 24px "Outfit"';
        ctx.textAlign = "center";
        ctx.fillText(isAct ? "✓ BOOKING CONFIRMED!" : " THUMBS UP TO CONFIRM", width * 0.5, btnY + btnH / 2 + 8);
        ctx.restore();

        const joints = getHandJoints(handX, handY, "THUMBS_UP", 1.25, height);
        drawHandSkeleton(joints);
      }
      // SCENE 5: QR PASS (9.8s - 12.5s)
      else if (t < 12.5) {
        setCurrentGesture("HOLO_PASS_ACTIVE");
        setCurrentSceneTag("SCENE 05 // 3D ROTATING HOLOGRAPHIC QR TICKET");

        const progress = (t - 9.8) / 2.7;
        const angle = progress * Math.PI * 2;
        const ticketW = width * 0.26;
        const ticketH = ticketW * 1.45;

        ctx.save();
        ctx.translate(width * 0.5, height * 0.45);
        ctx.scale(Math.cos(angle), 1);

        ctx.fillStyle = "rgba(8, 15, 35, 0.92)";
        ctx.shadowBlur = 40;
        ctx.shadowColor = "#00f0ff";
        ctx.beginPath();
        ctx.roundRect(-ticketW / 2, -ticketH / 2, ticketW, ticketH, 20);
        ctx.fill();
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 3;
        ctx.stroke();

        if (Math.abs(Math.cos(angle)) > 0.25) {
          ctx.fillStyle = "#ff0055";
          ctx.font = '800 11px "Space Grotesk"';
          ctx.textAlign = "center";
          ctx.fillText("CINEBOOK DIGITAL TICKET", 0, -ticketH / 2 + 35);

          ctx.fillStyle = "#ffffff";
          ctx.font = '900 22px "Outfit"';
          ctx.fillText("CYBER GENESIS", 0, -ticketH / 2 + 68);
        }
        ctx.restore();
      }
      // SCENE 6: LAUNCH SLATE (12.5s - 15.0s)
      else {
        setCurrentGesture("LAUNCH_COMPLETE");
        setCurrentSceneTag("SCENE 06 // PRODUCT LAUNCH TRAILER");

        ctx.save();
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.font = '900 48px "Outfit"';
        ctx.shadowBlur = 30;
        ctx.shadowColor = "#00f0ff";
        ctx.fillText("THE FUTURE OF MOVIE BOOKING", width * 0.5, height * 0.38);

        ctx.fillStyle = "#00f0ff";
        ctx.font = '700 20px "Space Grotesk"';
        ctx.fillText("Book Movies Without Touching the Screen", width * 0.5, height * 0.48);

        ctx.fillStyle = "#ff0055";
        ctx.font = '800 24px "Space Grotesk"';
        ctx.fillText("AI Motion Controller v4.2", width * 0.5, height * 0.58);
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

    stateRef.current.isVisible = true;

    // IntersectionObserver to pause heavy rAF canvas loop when offscreen
    let observer;
    if (typeof IntersectionObserver !== "undefined" && containerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          const isIntersecting = entry ? entry.isIntersecting : true;
          stateRef.current.isVisible = isIntersecting;
          if (isIntersecting && !animFrameRef.current) {
            animFrameRef.current = requestAnimationFrame(renderLoop);
          } else if (!isIntersecting && animFrameRef.current) {
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

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    stateRef.current.mouseX = e.clientX - rect.left;
    stateRef.current.mouseY = e.clientY - rect.top;
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#040409] rounded-3xl border border-cyan-500/20 shadow-2xl my-8">
      
      {/* 16:9 Aspect Ratio Container */}
      <div ref={containerRef} className="relative w-full aspect-video bg-black overflow-hidden">
        {/* Main 60 FPS Canvas */}
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
              Xaviercinema AI • GESTURE ENGINE
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-[11px] font-mono text-gray-300">
            <div>FPS: <span className="text-cyan-400 font-bold">{fps}</span></div>
            <div>GESTURE: <span className="text-cyan-400 font-bold">{currentGesture}</span></div>
            <div>CONFIDENCE: <span className="text-cyan-400 font-bold">99.8%</span></div>
          </div>
        </div>

        {/* Scene Tag */}
        <div className="absolute top-16 left-6 z-20 pointer-events-none bg-cyan-950/60 backdrop-blur-md border-l-4 border-cyan-400 px-4 py-1.5 rounded-r-lg text-xs font-mono font-bold text-cyan-300 tracking-wider">
          {currentSceneTag}
        </div>

        {/* Controls Footer Overlay */}
        <div className="absolute bottom-4 left-6 right-6 z-20 bg-[#080d1a]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex flex-col gap-3 shadow-2xl">
          {/* Progress Bar */}
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

          {/* Buttons Row */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-bold">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3.5 py-2 bg-white/10 hover:bg-cyan-500/20 text-white rounded-xl border border-white/15 transition flex items-center gap-2"
              >
                <span>{isPlaying ? "⏸ PAUSE" : "▶ PLAY"}</span>
              </button>

              <button
                onClick={() => {
                  stateRef.current.currentTime = 0;
                  setIsPlaying(true);
                }}
                className="px-3.5 py-2 bg-white/10 hover:bg-cyan-500/20 text-white rounded-xl border border-white/15 transition"
              >
                 REPLAY
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

              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="px-3.5 py-2 bg-white/10 hover:bg-cyan-500/20 text-white rounded-xl border border-white/15 transition"
              >
                {audioEnabled ? "🔊 SOUND FX ON" : "🔇 SOUND FX OFF"}
              </button>

              <button
                onClick={() => setShowGuide(!showGuide)}
                className="px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-300 rounded-xl border border-cyan-500/30 transition font-mono"
              >
                 GESTURE GUIDE
              </button>
            </div>

            <div className="flex items-center gap-3 font-mono text-gray-400 text-[11px]">
              <span>
                {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1)} / 00:15.0
              </span>
              <a
                href="/hero-video.html"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-extrabold rounded-lg transition"
              >
                 Launch 4K Trailer Window
              </a>
            </div>
          </div>
        </div>

        {/* Gesture Quick Guide Overlay Modal */}
        {showGuide && (
          <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-[#0b1021] border border-cyan-500/40 rounded-3xl p-6 max-w-lg w-full text-white shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-extrabold font-mono text-cyan-300 flex items-center gap-2">
                  <span></span> Xaviercinema AI MOTION GESTURES
                </h3>
                <button
                  onClick={() => setShowGuide(false)}
                  className="text-gray-400 hover:text-white text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                  <div className="text-cyan-400 font-bold mb-1"> OPEN PALM</div>
                  <div className="text-gray-300">Swipe horizontally left/right to browse movies</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                  <div className="text-cyan-400 font-bold mb-1"> POINT FINGER</div>
                  <div className="text-gray-300">Aim target reticle to expand movie details & showtimes</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                  <div className="text-cyan-400 font-bold mb-1"> PINCH FINGERS</div>
                  <div className="text-gray-300">Pinch index + thumb to precision lock recliner seats</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                  <div className="text-cyan-400 font-bold mb-1"> THUMBS UP</div>
                  <div className="text-gray-300">Hold thumbs up for 1s to trigger biometric express booking</div>
                </div>
              </div>

              <button
                onClick={() => setShowGuide(false)}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold rounded-xl hover:opacity-90 transition text-xs"
              >
                GOT IT, LET'S CONTROL!
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default HeroTrailer;
