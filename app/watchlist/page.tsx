import { getOverviewDataAction } from "@/app/actions/trace";
import { AppShell } from "@/components/trace/AppShell";
import { WatchlistContainer } from "@/components/trace/WatchlistContainer";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const initialData = await getOverviewDataAction();

  return (
    <AppShell>
      <WatchlistContainer initialData={initialData} />
    </AppShell>
  );
}
