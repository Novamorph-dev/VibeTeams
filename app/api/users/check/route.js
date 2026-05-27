import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const users = await sql`
      SELECT u.id, u.name, u.email, u.domain, u.team_id,
             t.name as team_name, t.domain as team_domain
      FROM users u
      LEFT JOIN teams t ON u.team_id = t.id
      WHERE u.email = ${normalizedEmail}
    `;

    if (users.length === 0) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({ exists: true, user: users[0] });
  } catch (error) {
    console.error("Check user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
