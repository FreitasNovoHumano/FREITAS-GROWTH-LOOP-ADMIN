import { JoinExperience } from "@/components/public/join-experience";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string; clientId?: string }>;
}) {
  const { slug } = await params;
  const { ref: referralCode, clientId } = await searchParams;
  return (
    <JoinExperience
      slug={slug}
      referralCode={referralCode}
      clientId={clientId}
    />
  );
}
