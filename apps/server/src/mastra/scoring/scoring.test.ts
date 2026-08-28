import { describe, it, expect } from "vitest";
import type { AppListing } from "@aso/shared";
import { Provenance, sourced } from "@aso/shared";
import { computeScoreCard } from "./index.js";
import { NORMALISED_WEIGHTS, RAW_WEIGHT_TOTAL } from "./weights.js";

function listing(overrides: Partial<AppListing> = {}): AppListing {
  const base: AppListing = {
    appId: "1",
    country: "us",
    name: "Test App",
    developer: "Test Dev",
    iconUrl: "https://example.com/artwork/512x512.png",
    primaryCategory: "Productivity",
    storeUrl: "https://apps.apple.com/us/app/id1",
    title: "Test App — Notes & Tasks",
    subtitle: sourced<string | null>("Plan your day fast", Provenance.Scraped),
    description:
      "You can plan your day fast.\nTrusted by 2 million users. Download now to get started and try it free.",
    keywordField: sourced<string | null>("notes,tasks,planner,todo,reminders", Provenance.Inferred),
    releaseNotes: "New: dark mode, faster sync, and a redesigned editor.",
    promotionalText: sourced<string | null>(null, Provenance.Scraped),
    version: "3.2.1",
    screenshotUrls: Array.from({ length: 8 }, (_, i) => `https://example.com/s${i}.png`),
    hasAppPreviewVideo: true,
    averageRating: 4.6,
    ratingCount: 12000,
    currentVersionRatingCount: 800,
    currentVersionAverageRating: 4.7,
    genres: ["Productivity"],
    price: 0,
    reviews: [
      { rating: 5, title: "Love it", body: "Fast and clean", author: "a" },
      { rating: 2, title: "Crashes", body: "app keeps crashing after update", author: "b" },
      { rating: 1, title: "Bug", body: "constant crash on launch", author: "c" },
    ],
  };
  return { ...base, ...overrides };
}

describe("weights", () => {
  it("normalises the brief's 110% raw total to exactly 100", () => {
    expect(RAW_WEIGHT_TOTAL).toBe(110);
    const sum = Object.values(NORMALISED_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(100, 6);
  });
});

describe("computeScoreCard", () => {
  it("produces an overall in [0,100] and a grade", () => {
    const card = computeScoreCard(listing(), []);
    expect(card.overall).toBeGreaterThanOrEqual(0);
    expect(card.overall).toBeLessThanOrEqual(100);
    expect(["A", "B", "C", "D", "F"]).toContain(card.grade);
    expect(card.dimensions).toHaveLength(10);
  });

  it("rewards a strong, complete listing with a high score", () => {
    const card = computeScoreCard(listing(), []);
    expect(card.overall).toBeGreaterThan(60);
  });

  it("does not crash on a sparse/empty listing (unseen-app robustness)", () => {
    const bare = listing({
      subtitle: sourced<string | null>(null, Provenance.Scraped),
      description: "",
      screenshotUrls: [],
      hasAppPreviewVideo: false,
      averageRating: 0,
      ratingCount: 0,
      currentVersionAverageRating: null,
      currentVersionRatingCount: null,
      releaseNotes: null,
      reviews: [],
      keywordField: sourced<string | null>(null, Provenance.Inferred),
    });
    const card = computeScoreCard(bare, []);
    expect(card.overall).toBeGreaterThanOrEqual(0);
    expect(card.overall).toBeLessThan(50);
  });

  it("detects complaint themes from negative reviews", () => {
    const card = computeScoreCard(listing(), []);
    const reviews = card.dimensions.find((d) => d.id === "reviews");
    expect(reviews?.evidence.join(" ")).toMatch(/crash/i);
  });

  it("flags private keyword field as not observable", () => {
    const card = computeScoreCard(listing(), []);
    const kw = card.dimensions.find((d) => d.id === "keywords");
    expect(kw?.observable).toBe(false);
  });
});
