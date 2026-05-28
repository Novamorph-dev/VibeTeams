import { NextResponse } from "next/server";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
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

    console.log(`Total users from DB: ${users.length}`);
    console.log(`User IDs returned: ${users.map(u => u.id).join(', ')}`);

    return NextResponse.json({ users, count: users.length, ids: users.map(u => u.id) }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
