import { getHistoryAction } from "@/app/actions/trace";
import { AppShell } from "@/components/trace/AppShell";
import { HistoryContainer } from "@/components/trace/HistoryContainer";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const { checkpoints, error } = await getHistoryAction();

  return (
    <AppShell>
      <HistoryContainer checkpoints={checkpoints} error={error} />
    </AppShell>
  );
}
