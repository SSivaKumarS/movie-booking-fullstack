import React, { useEffect } from "react";

/**
 * Extract a YouTube video ID and return a safe embed URL.
 *
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - Direct 11-character YouTube video IDs
 *
 * This helper uses only native JavaScript APIs.
 */
export const getYouTubeEmbedUrl = (url) => {
  if (!url || typeof url !== "string") {
    return "";
  }

  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return "";
  }

  let videoId = "";

  try {
    // Direct YouTube video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmedUrl)) {
      videoId = trimmedUrl;
    } else {
      const parsedUrl = new URL(trimmedUrl);

      const hostname = parsedUrl.hostname.toLowerCase();
      const pathname = parsedUrl.pathname;

      // youtube.com
      if (
        hostname === "youtube.com" ||
        hostname === "www.youtube.com" ||
        hostname === "m.youtube.com"
      ) {
        // /watch?v=VIDEO_ID
        if (pathname === "/watch") {
          videoId = parsedUrl.searchParams.get("v") || "";
        }

        // /embed/VIDEO_ID
        else if (pathname.startsWith("/embed/")) {
          videoId = pathname.split("/embed/")[1]?.split("/")[0] || "";
        }

        // /shorts/VIDEO_ID
        else if (pathname.startsWith("/shorts/")) {
          videoId = pathname.split("/shorts/")[1]?.split("/")[0] || "";
        }

        // /live/VIDEO_ID
        else if (pathname.startsWith("/live/")) {
          videoId = pathname.split("/live/")[1]?.split("/")[0] || "";
        }
      }

      // youtu.be/VIDEO_ID
      else if (
        hostname === "youtu.be" ||
        hostname === "www.youtu.be"
      ) {
        videoId = pathname
          .replace(/^\/+/, "")
          .split("/")[0];
      }
    }
  } catch (error) {
    console.warn("Invalid YouTube URL:", error);
    return "";
  }

  // Validate the final YouTube ID
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return "";
  }

  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
};

/**
 * Trailer Modal
 */
function TrailerModal({
  isOpen,
  onClose,
  trailerUrl,
  movieTitle,
}) {
  /* =========================================================
     ESCAPE KEY
  ========================================================= */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  /* =========================================================
     BODY SCROLL LOCK
  ========================================================= */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  /* =========================================================
     DO NOT RENDER
  ========================================================= */

  if (!isOpen) {
    return null;
  }

  /* =========================================================
     YOUTUBE URL
  ========================================================= */

  const embedUrl = getYouTubeEmbedUrl(trailerUrl);

  /* =========================================================
     BACKDROP CLICK
  ========================================================= */

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn"
      onMouseDown={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${movieTitle || "Movie"} trailer`}
    >
      <div className="relative w-full max-w-5xl bg-[#111118] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-800 bg-[#0A0A0F]">

          <div className="flex items-center gap-3 min-w-0">

            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 bg-red-600/20 border border-red-500/40 rounded-xl flex items-center justify-center text-red-500 text-lg">
              ▶
            </div>

            <div className="min-w-0">

              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide truncate">
                {movieTitle || "Official Trailer"}
              </h3>

              <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">
                Official YouTube Trailer
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 ml-3 text-gray-400 hover:text-white transition-colors bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-full w-9 h-9 flex items-center justify-center text-sm"
            aria-label="Close trailer"
          >
            ✕
          </button>

        </div>

        {/* =====================================================
            VIDEO PLAYER
        ===================================================== */}

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
            <div className="absolute inset-0 flex items-center justify-center p-6">

              <div className="text-center">

                <div className="text-5xl mb-4">
                  🎬
                </div>

                <h4 className="text-white font-bold text-base">
                  Trailer unavailable
                </h4>

                <p className="text-gray-500 text-xs mt-2 max-w-sm">
                  A valid YouTube trailer has not been provided for this
                  movie yet.
                </p>

              </div>

            </div>
          )}

        </div>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="px-4 sm:px-6 py-3 bg-[#0A0A0F] border-t border-gray-800 flex flex-col sm:flex-row gap-3 justify-between items-center text-xs text-gray-400">

          <span>
            {embedUrl
              ? "Official trailer powered by YouTube"
              : "Trailer information unavailable"}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition shadow-md shadow-red-600/20"
          >
            Close Player
          </button>

        </div>

      </div>
    </div>
  );
}

export default TrailerModal;