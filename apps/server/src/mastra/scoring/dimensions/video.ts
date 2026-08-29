import { clampScore, type DimensionScorer } from "../types.js";

/**
 * App preview video. Binary from public data: it either exists or it doesn't.
 * The brief's finer checks (hook in first 3s, 15–30s, works muted) require
 * watching the video, which we can't do from metadata — so a present video
 * scores well but stays partially observable, with quality checks deferred.
 */
export const scoreVideo: DimensionScorer = ({ listing }) => {
  if (listing.hasAppPreviewVideo) {
    return {
      id: "video",
      score: clampScore(6.5),
      evidence: [
        "An app preview video is present — a strong conversion asset many competitors skip.",
        "The hook in the first 3 seconds, 15–30s pacing and muted comprehension need a manual watch; public metadata only confirms presence.",
      ],
      observable: false,
    };
  }

  return {
    id: "video",
    score: 0,
    evidence: [
      "No app preview video detected. Listings with a preview video convert measurably better; this is a clear gap.",
    ],
    observable: true,
  };
};
