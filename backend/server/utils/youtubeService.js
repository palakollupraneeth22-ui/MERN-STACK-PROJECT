const axios = require("axios");

/**
 * Extract playlist ID from YouTube URL
 * @param {string} url - YouTube playlist URL
 * @returns {string|null} - Playlist ID or null if invalid
 */
const extractPlaylistId = (url) => {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    
    // Format: youtube.com/playlist?list=PLAYLIST_ID
    if (urlObj.hostname.includes("youtube.com")) {
      return urlObj.searchParams.get("list");
    }
    
    // Format: youtu.be/... or other YouTube URLs
    if (urlObj.hostname.includes("youtu.be")) {
      return null; // youtu.be links are video links, not playlists
    }
  } catch (error) {
    // Invalid URL
    return null;
  }

  return null;
};

/**
 * Fetch YouTube playlist data
 * @param {string} playlistUrl - YouTube playlist URL
 * @param {string} apiKey - YouTube Data API key
 * @returns {Promise<{title: string, description: string, modules: Array}>}
 */
const fetchYoutubePlaylist = async (playlistUrl, apiKey) => {
  if (!apiKey) {
    throw new Error(
      "YouTube API key not configured. Please set YOUTUBE_API_KEY in environment variables."
    );
  }

  const playlistId = extractPlaylistId(playlistUrl);
  if (!playlistId) {
    throw new Error("Invalid YouTube playlist URL. Please use a valid playlist link.");
  }

  try {
    // Fetch playlist details
    const playlistResponse = await axios.get(
      "https://www.googleapis.com/youtube/v3/playlists",
      {
        params: {
          part: "snippet",
          id: playlistId,
          key: apiKey,
        },
      }
    );

    if (!playlistResponse.data.items || playlistResponse.data.items.length === 0) {
      throw new Error("Playlist not found or is private.");
    }

    const playlistData = playlistResponse.data.items[0];
    const playlistTitle = playlistData.snippet.title;
    const playlistDescription = playlistData.snippet.description || "";

    // Fetch playlist items with pagination
    const videos = [];
    let nextPageToken = null;

    do {
      const itemsResponse = await axios.get(
        "https://www.googleapis.com/youtube/v3/playlistItems",
        {
          params: {
            part: "snippet,contentDetails",
            playlistId,
            pageToken: nextPageToken || undefined,
            maxResults: 50,
            key: apiKey,
          },
        }
      );

      if (itemsResponse.data.items) {
        videos.push(...itemsResponse.data.items);
      }

      nextPageToken = itemsResponse.data.nextPageToken || null;
    } while (nextPageToken);

    // Fetch video durations
    const videoIds = videos.map((v) => v.contentDetails.videoId);
    const durations = {};

    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);
      const videoResponse = await axios.get(
        "https://www.googleapis.com/youtube/v3/videos",
        {
          params: {
            part: "contentDetails",
            id: batch.join(","),
            key: apiKey,
          },
        }
      );

      videoResponse.data.items?.forEach((item) => {
        const duration = parseISO8601Duration(item.contentDetails.duration);
        durations[item.id] = duration;
      });
    }

    // Structure videos into modules (one video per lesson, optional grouping)
    const lessons = videos.map((video) => ({
      title: video.snippet.title,
      duration: durations[video.contentDetails.videoId] || 10, // Default 10 minutes
      videoUrl: `https://www.youtube.com/watch?v=${video.contentDetails.videoId}`,
      completed: false,
    }));

    // Create a single module with all videos as lessons
    // Or split into modules based on a configurable chunk size (e.g., 10 lessons per module)
    const modulesChunkSize = 10;
    const modules = [];

    for (let i = 0; i < lessons.length; i += modulesChunkSize) {
      const moduleIndex = Math.floor(i / modulesChunkSize) + 1;
      modules.push({
        title: `Section ${moduleIndex}: ${playlistTitle}`,
        lessons: lessons.slice(i, i + modulesChunkSize),
      });
    }

    return {
      title: playlistTitle,
      platform: "YouTube",
      description: playlistDescription,
      modules,
    };
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error(
        "YouTube API quota exceeded or invalid API key. Please try again later."
      );
    }
    if (error.response?.status === 404) {
      throw new Error("Playlist not found.");
    }
    throw error;
  }
};

/**
 * Parse ISO 8601 duration format (e.g., PT1H30M45S) to minutes
 * @param {string} duration - ISO 8601 duration string
 * @returns {number} - Duration in minutes
 */
const parseISO8601Duration = (duration) => {
  if (!duration) return 10;

  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);

  if (!matches) return 10;

  const hours = parseInt(matches[1]) || 0;
  const minutes = parseInt(matches[2]) || 0;
  const seconds = parseInt(matches[3]) || 0;

  return Math.ceil(hours * 60 + minutes + seconds / 60);
};

module.exports = {
  extractPlaylistId,
  fetchYoutubePlaylist,
  parseISO8601Duration,
};
