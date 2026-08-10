import { z } from "zod";

export const embedButtonIcons = [
  "none",
  "sparkles",
  "gift",
  "users",
  "heart",
  "arrow-right",
] as const;

export const embedButtonStyles = [
  "solid",
  "gradient",
  "outline",
  "glass",
] as const;

export const embedPositions = [
  "bottom-right",
  "bottom-left",
  "top-right",
  "top-left",
] as const;

export const embedAnimations = ["fade", "slide", "pulse", "none"] as const;

const embedConfigurationShape = {
  embedButtonLabel: z.string().trim().min(1).max(60),
  embedButtonIcon: z.enum(embedButtonIcons),
  embedButtonStyle: z.enum(embedButtonStyles),
  embedPosition: z.enum(embedPositions),
  embedDelayMs: z.coerce.number().int().min(0).max(30_000),
  embedAnimation: z.enum(embedAnimations),
  embedInitiallyExpanded: z.boolean(),
};

export const embedConfigurationCreateSchema = z.object({
  embedButtonLabel: embedConfigurationShape.embedButtonLabel.default(
    "Participar agora",
  ),
  embedButtonIcon: embedConfigurationShape.embedButtonIcon.default("none"),
  embedButtonStyle: embedConfigurationShape.embedButtonStyle.default("solid"),
  embedPosition: embedConfigurationShape.embedPosition.default("bottom-right"),
  embedDelayMs: embedConfigurationShape.embedDelayMs.default(0),
  embedAnimation: embedConfigurationShape.embedAnimation.default("fade"),
  embedInitiallyExpanded:
    embedConfigurationShape.embedInitiallyExpanded.default(false),
});

export const embedConfigurationPatchSchema = z
  .object(embedConfigurationShape)
  .partial();

export type EmbedConfiguration = z.infer<
  typeof embedConfigurationCreateSchema
>;

type EmbedConfigurationSource = Partial<
  Record<keyof EmbedConfiguration, string | number | boolean | null | undefined>
>;

export function resolveEmbedConfiguration(
  source: EmbedConfigurationSource,
  fallbackButtonLabel = "Participar agora",
): EmbedConfiguration {
  const presentValues = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== null && value !== undefined),
  );
  const parsed = embedConfigurationPatchSchema.safeParse(presentValues);
  const values = parsed.success ? parsed.data : {};

  return embedConfigurationCreateSchema.parse({
    ...values,
    embedButtonLabel:
      values.embedButtonLabel?.trim() || fallbackButtonLabel.trim() || undefined,
  });
}
