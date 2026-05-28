import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  noStore();
  try {
    const users = await sql`
      SELECT 
        id::int,
        COALESCE(name, '') as name,
        COALESCE(email, '') as email,
        COALESCE(domain, '') as domain,
        team_id::text
      FROM users
      ORDER BY id ASC
    `;

    console.log(`GET /api/users — returned ${users.length} users`);

    return NextResponse.json({ users, count: users.length }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Surrogate-Control": "no-store",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
