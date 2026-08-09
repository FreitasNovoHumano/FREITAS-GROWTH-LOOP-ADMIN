import { growthLoopEmbedScript } from "@/lib/embed-script";

export const dynamic = "force-static";

export function GET() {
  return new Response(growthLoopEmbedScript, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
      "x-content-type-options": "nosniff",
    },
  });
}
