import { z } from "zod";

export const campaignSchema = z.object({
  name: z.string().trim().min(3).max(100),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500).optional(),
  initialRewardTitle: z.string().trim().min(3).max(120),
  initialRewardValue: z.string().trim().max(200).optional(),
  milestoneRewardTitle: z.string().trim().min(3).max(120),
  milestoneRewardValue: z.string().trim().max(200).optional(),
  qualifiedReferralGoal: z.coerce.number().int().min(1).max(100).default(3),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#7c3aed"),
});
