import { buildReport, toCsv } from "@/lib/reports";

// TODO: check the logged-in session here (see src/lib/session.ts) before allowing access.

// GET /api/reports/<report>?from=YYYY-MM-DD&to=YYYY-MM-DD   downloads a CSV file
export async function GET(
  req: Request,
  { params }: { params: Promise<{ report: string }> }
) {
  const { report: slug } = await params;
  const url = new URL(req.url);

  const report = await buildReport(slug, {
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
  });
  if (!report) return new Response("Report not found", { status: 404 });

  const filename = report.needsRange
    ? `${report.slug}_${report.from}_to_${report.to}.csv`
    : `${report.slug}.csv`;

  return new Response(toCsv(report.columns, report.rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}