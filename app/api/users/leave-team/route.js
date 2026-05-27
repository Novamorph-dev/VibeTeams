import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(request) {
  try {
    const { userEmail } = await request.json();
    if (!userEmail) {
      return NextResponse.json({ error: "User email required" }, { status: 400 });
    }

    const normalizedEmail = userEmail.trim().toLowerCase();

    const users = await sql`
      SELECT id, team_id FROM users WHERE email = ${normalizedEmail}
    `;
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!users[0].team_id) {
      return NextResponse.json({ error: "You are not on a team" }, { status: 409 });
    }

    await sql`
      UPDATE users SET team_id = NULL WHERE email = ${normalizedEmail}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Leave team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
