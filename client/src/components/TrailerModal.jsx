import React, { useEffect, useRef } from "react";

/**
 * Extract a YouTube video ID and return a safe embed URL.
 *
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 * - Direct 11-character YouTube video IDs
 */
export const getYouTubeEmbedUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return "";

  let videoId = "";
  let startTime = "";

  try {
    // Direct 11-char YouTube ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmedUrl)) {
      videoId = trimmedUrl;
    } else {
      const parsedUrl = new URL(trimmedUrl);
      const hostname = parsedUrl.hostname.toLowerCase();
      const pathname = parsedUrl.pathname;

      // Extract timestamp parameter if available (e.g. ?t=90 or ?start=90)
      const t = parsedUrl.searchParams.get("t") || parsedUrl.searchParams.get("start");
      if (t) {
        // Normalize time (convert 1m30s format to seconds if needed)
        const seconds = t.includes("m")
          ? t.split("m").reduce((acc, val) => acc * 60 + (parseInt(val, 10) || 0), 0)
          : parseInt(t, 10);
        if (!isNaN(seconds) && seconds > 0) {
          startTime = `&start=${seconds}`;
        }
      }

      // Standard YouTube hostnames
      if (
        hostname === "youtube.com" ||
        hostname === "www.youtube.com" ||
        hostname === "m.youtube.com" ||
        hostname === "youtube-nocookie.com" ||
        hostname === "www.youtube-nocookie.com"
      ) {
        if (pathname === "/watch") {
          videoId = parsedUrl.searchParams.get("v") || "";
        } else if (pathname.startsWith("/embed/")) {
          videoId = pathname.split("/embed/")[1]?.split("/")[0] || "";
        } else if (pathname.startsWith("/shorts/")) {
          videoId = pathname.split("/shorts/")[1]?.split("/")[0] || "";
        } else if (pathname.startsWith("/live/")) {
          videoId = pathname.split("/live/")[1]?.split("/")[0] || "";
        }
      } else if (hostname === "youtu.be" || hostname === "www.youtu.be") {
        videoId = pathname.replace(/^\/+/, "").split("/")[0];
      }
    }
  } catch (error) {
    console.warn("Invalid YouTube URL:", error);
    return "";
  }

  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return "";
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1${startTime}`;
};

/**
 * Trailer Modal Component
 */
function TrailerModal({ isOpen, onClose, trailerUrl, movieTitle }) {
  const modalRef = useRef(null);

  /* Escape Key & Focus Trap */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      // Focus trapping logic for Accessibility
      if (event.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  /* Body Scroll Lock */
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = "0px";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const embedUrl = getYouTubeEmbedUrl(trailerUrl);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 trailer-backdrop"
      onMouseDown={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${movieTitle || "Movie"} trailer`}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-5xl bg-[#0F0F17] border border-cyan-500/20 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-950/40 trailer-modal-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-800/80 bg-[#0A0A0F]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 bg-red-600/20 border border-red-500/40 rounded-xl flex items-center justify-center text-red-500 text-sm sm:text-base font-black shadow-inner">
              ▶
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide truncate">
                {movieTitle || "Official Trailer"}
              </h3>
              <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">
                Official Cinematic Trailer
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 ml-3 text-gray-400 hover:text-white transition-colors bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-full w-9 h-9 flex items-center justify-center text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Close trailer"
          >
            ✕
          </button>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video w-full bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={`${movieTitle || "Movie"} Trailer`}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <div>
                <div className="text-5xl mb-3 opacity-80" aria-hidden="true">🎬</div>
                <h4 className="text-white font-bold text-base">Trailer Unavailable</h4>
                <p className="text-gray-400 text-xs mt-1.5 max-w-sm">
                  A valid video link for "{movieTitle || "this movie"}" has not been added yet.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-[#0A0A0F] border-t border-gray-800/80 flex flex-col sm:flex-row gap-2.5 justify-between items-center text-xs text-gray-400">
          <span className="text-[11px] text-gray-400">
            {embedUrl ? "Powered by YouTube Embed API" : "Trailer content missing"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition shadow-md shadow-red-600/20 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Close Player
          </button>
        </div>
      </div>
    </div>
  );
}

export default TrailerModal;