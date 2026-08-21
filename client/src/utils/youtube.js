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
