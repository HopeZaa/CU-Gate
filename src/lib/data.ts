import { z } from "zod";
import raw from "../data/gates.json";
export const statusSchema = z.enum([
  "VERIFIED",
  "HISTORICAL",
  "UNVERIFIED",
  "UNKNOWN",
]);
const date = z.iso.date();
const webUrl = z
  .url()
  .refine(
    (value) => /^https?:\/\//.test(value),
    "Only HTTP(S) source URLs are permitted",
  );
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$|^24:00$/);
export const scheduleSchema = z.object({
  verificationStatus: statusSchema,
  validFrom: date.nullable(),
  validThrough: date.nullable(),
  holidayPolicy: z.enum(["same", "closed", "unknown"]),
  intervals: z
    .array(
      z.object({
        days: z.array(z.number().int().min(0).max(6)).min(1),
        open: time,
        close: time,
      }),
    )
    .refine(
      (xs) => xs.every((x) => x.open !== "24:00" && x.open !== x.close),
      "Use 00:00–24:00 for a full day",
    ),
});
const operatingRuleSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  modes: z.array(z.enum(["pedestrian", "car", "motorcycle"])).min(1),
  coveredDays: z.array(z.number().int().min(0).max(6)).min(1),
  schedule: scheduleSchema
    .refine(
      (s) => s.verificationStatus === "HISTORICAL",
      "Adopted rules retain historical provenance",
    )
    .refine(
      (s) => s.validFrom === null && s.validThrough === null,
      "Adopted weekly baselines do not reuse expired event date ranges",
    ),
  entryAllowed: z.boolean(),
  exitAllowed: z.boolean(),
  exitWhenClosedGate: z.string().nullable().default(null),
  conditionTh: z.string().nullable(),
  conditionEn: z.string().nullable(),
  noteTh: z.string(),
  noteEn: z.string(),
});
export const gateSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    nameEn: z.string().nullable(),
    nameEnType: z.enum(["official-map", "editorial-translation"]),
    shortNameTh: z.string().min(1),
    nearbyTh: z.string().min(1),
    notesTh: z.string().min(1),
    coordinateVerificationNotesTh: z.string().min(1),
    aliases: z.array(z.string()),
    nearby: z.string(),
    category: z.enum([
      "vehicle",
      "pedestrian",
      "restricted",
      "emergency",
      "service",
      "temporary",
    ]),
    mapLetter: z.string().nullable(),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    coordinateConfidence: z.enum(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]),
    coordinateVerificationStatus: statusSchema,
    coordinateSource: webUrl.nullable(),
    coordinateLastVerified: date.nullable(),
    coordinateReviewedAt: date,
    coordinateSourceUpdatedAt: z.string().nullable(),
    coordinateVerificationNotes: z.string(),
    accessType: z.enum(["public", "restricted", "unknown"]),
    permissions: z.object({
      pedestrian: z.boolean().nullable(),
      motorcycle: z.boolean().nullable(),
      car: z.boolean().nullable(),
    }),
    entryAllowed: z.boolean().nullable(),
    exitAllowed: z.boolean().nullable(),
    accessVerificationStatus: statusSchema,
    permittedVehicles: z.array(z.enum(["car", "motorcycle"])),
    schedule: scheduleSchema.nullable(),
    scheduleSource: z.string().nullable(),
    scheduleLastVerified: date.nullable(),
    operatingDays: z.array(z.number().int().min(0).max(6)).nullable(),
    holidayRestrictions: z.string().nullable(),
    specialRestrictions: z.string().nullable(),
    verificationStatus: statusSchema,
    confidence: z.enum(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]),
    lastReviewed: date,
    lastVerified: date.nullable(),
    sources: z.array(z.string()).min(1),
    historicalEvidence: z.array(
      z.object({ source: z.string(), note: z.string() }),
    ),
    referenceAccess: z
      .array(
        z.object({
          appliesTo: z.enum(["pedestrian", "vehicle", "car", "motorcycle"]),
          source: z.string(),
          verificationStatus: z.literal("HISTORICAL"),
          context: z.enum(["general-policy", "temporary-policy", "event-only"]),
          entryAllowed: z.boolean().nullable(),
          exitAllowed: z.boolean().nullable(),
          hoursTh: z.string(),
          hoursEn: z.string(),
          restrictionTh: z.string(),
          restrictionEn: z.string(),
          requiresAuthorization: z.boolean().nullable(),
        }),
      )
      .default([]),
    notes: z.string(),
    operatingRules: z.array(operatingRuleSchema).default([]),
  })
  .superRefine((g, c) => {
    if ((g.latitude === null) !== (g.longitude === null))
      c.addIssue({
        code: "custom",
        message: "Coordinates must be a complete pair",
      });
    if (
      g.latitude === null &&
      (g.coordinateConfidence !== "UNKNOWN" ||
        g.coordinateVerificationStatus !== "UNKNOWN")
    )
      c.addIssue({
        code: "custom",
        message: "Missing coordinates must have UNKNOWN confidence and status",
      });
    if (
      g.latitude !== null &&
      (!g.coordinateSource || g.coordinateConfidence === "UNKNOWN")
    )
      c.addIssue({
        code: "custom",
        message: "Coordinates need provenance and confidence",
      });
    if (
      g.coordinateVerificationStatus === "VERIFIED" &&
      (!g.coordinateLastVerified || g.coordinateConfidence !== "HIGH")
    )
      c.addIssue({
        code: "custom",
        message:
          "Verified coordinates need a verification date and HIGH confidence",
      });
  });
export const datasetSchema = z
  .object({
    schemaVersion: z.literal(1),
    researchedAt: date,
    timezone: z.literal("Asia/Bangkok"),
    scope: z.string(),
    operationPolicy: z
      .object({
        basis: z.literal("historical-baseline"),
        adoptedAt: date,
        noteTh: z.string(),
        noteEn: z.string(),
        holidayAssumption: z.literal("weekly-pattern-unless-overridden"),
      })
      .optional(),
    sources: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        titleTh: z.string(),
        url: webUrl,
        publishedAt: z
          .union([
            date,
            z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/),
            z.string().regex(/^\d{4}$/),
          ])
          .nullable(),
        reviewedAt: date,
        scope: z.string(),
        scopeTh: z.string(),
      }),
    ),
    gates: z.array(gateSchema),
  })
  .superRefine((d, c) => {
    if (new Set(d.gates.map((g) => g.id)).size !== d.gates.length)
      c.addIssue({ code: "custom", message: "Duplicate gate ID" });
    if (new Set(d.sources.map((s) => s.id)).size !== d.sources.length)
      c.addIssue({ code: "custom", message: "Duplicate source ID" });
    const coords = d.gates
      .filter((g) => g.latitude !== null)
      .map((g) => `${g.latitude},${g.longitude}`);
    if (new Set(coords).size !== coords.length)
      c.addIssue({
        code: "custom",
        message: "Duplicate coordinate pair needs review",
      });
    for (const g of d.gates) {
      if (
        g.operatingRules.some(
          (r) =>
            r.exitWhenClosedGate &&
            !d.gates.some((target) => target.id === r.exitWhenClosedGate),
        )
      )
        c.addIssue({
          code: "custom",
          message: `Unresolved linked gate for ${g.id}`,
        });
      if (
        g.sources.some((id) => !d.sources.some((s) => s.id === id)) ||
        g.historicalEvidence.some((h) => !g.sources.includes(h.source)) ||
        g.referenceAccess.some((h) => !g.sources.includes(h.source)) ||
        g.operatingRules.some((h) => !g.sources.includes(h.source))
      )
        c.addIssue({
          code: "custom",
          message: `Unresolved source for ${g.id}`,
        });
    }
  });
export type Gate = z.infer<typeof gateSchema>;
export type Dataset = z.infer<typeof datasetSchema>;
export type VerificationStatus = z.infer<typeof statusSchema>;
export type TravelMode = keyof Gate["permissions"];
export type Schedule = z.infer<typeof scheduleSchema>;
export const dataResult = datasetSchema.safeParse(raw);
export const dataset = dataResult.success ? dataResult.data : null;
