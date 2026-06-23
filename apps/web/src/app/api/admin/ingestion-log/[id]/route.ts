import { authedBackendFetch } from "@/lib/server/backend";
import { relayResponse } from "@/lib/server/relay";

/** Single ingestion-log run (forensic robots/tdmrep/ai.txt hashes + counts). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayResponse(
    await authedBackendFetch(`/api/admin/ingestion-log/${encodeURIComponent(id)}`),
  );
}
