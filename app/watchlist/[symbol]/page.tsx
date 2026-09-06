import { notFound } from "next/navigation";
import { getInstrumentDetailAction } from "@/app/actions/trace";
import { AppShell } from "@/components/trace/AppShell";
import { InstrumentDetailContainer } from "@/components/trace/InstrumentDetailContainer";

export const dynamic = "force-dynamic";

interface InstrumentDetailPageProps {
  params: Promise<{ symbol: string }>;
}

export default async function InstrumentDetailPage({
  params,
}: InstrumentDetailPageProps) {
  const { symbol } = await params;
  const decodedSymbol = decodeURIComponent(symbol).toUpperCase();

  const data = await getInstrumentDetailAction(decodedSymbol, "NSE");
  if (!data) {
    notFound();
  }

  return (
    <AppShell>
      <InstrumentDetailContainer data={data} />
    </AppShell>
  );
}
