import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import sql from "@/lib/db";

export async function PATCH(request, { params }) {
  noStore();
  try {
    const teamId = parseInt(params.id);
    const { name, userEmail } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }
    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    // Verify the requester is the team creator
    const teams = await sql`
      SELECT id, created_by FROM teams WHERE id = ${teamId}
    `;
    if (teams.length === 0) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    if (teams[0].created_by !== userEmail.toLowerCase()) {
      return NextResponse.json({ error: "Only the team creator can rename the team" }, { status: 403 });
    }

    const updated = await sql`
      UPDATE teams SET name = ${name.trim()}
      WHERE id = ${teamId}
      RETURNING id, name, domain, created_by, created_at
    `;

    return NextResponse.json({ team: updated[0] });
  } catch (error) {
    console.error("Rename team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
