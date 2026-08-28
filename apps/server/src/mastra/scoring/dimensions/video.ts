import { clampScore, type DimensionScorer } from "../types.js";

/**
 * App preview video. Binary from public data: it either exists or it doesn't.
 * The brief's finer checks (hook in first 3s, 15–30s, works muted) require
 * watching the video, which we can't do from metadata — so a present video
 * scores well but not perfectly, with the qualitative checks deferred.
 */
export const scoreVideo: DimensionScorer = ({ listing }) => {
  if (listing.hasAppPreviewVideo) {
    return {
      id: "video",
      score: clampScore(8),
      evidence: [
        "An app preview video is present — a strong conversion asset most competitors skip.",
        "Whether the hook lands in the first 3 seconds and reads without sound needs a manual watch — deferred to the analyst.",
      ],
      observable: true,
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
