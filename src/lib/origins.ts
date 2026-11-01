import { z } from "zod";
import raw from "../data/origins.json";
const schema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    nameEn: z.string(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    source: z.url().refine((s) => s.startsWith("https://")),
    reviewedAt: z.iso.date(),
    type: z.literal("public-landmark"),
    notesTh: z.string(),
  }),
);
const result = schema.safeParse(raw);
export type PublicOrigin = z.infer<typeof schema>[number];
export const origins = result.success ? result.data : [];

export type StartingPoint = Omit<PublicOrigin, "type"> & {
  type: "public-landmark" | "selected-place";
};
