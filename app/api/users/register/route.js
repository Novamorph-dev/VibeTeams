import { NextResponse } from "next/server";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { name, email, domain } = await request.json();

    if (!email || !domain) {
      return NextResponse.json({ error: "Email and domain are required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists (pre-seeded)
    const existing = await sql`
      SELECT id, name, email, domain, team_id FROM users WHERE email = ${normalizedEmail}
    `;

    if (existing.length > 0) {
      // Pre-seeded user — just update their domain (and name if they want to change it)
      const updatedName = name?.trim() || existing[0].name;
      const updated = await sql`
        UPDATE users SET domain = ${domain}, name = ${updatedName}
        WHERE email = ${normalizedEmail}
        RETURNING id, name, email, domain, team_id, created_at
      `;
      return NextResponse.json({ user: updated[0] });
    }

    // Brand new user — insert
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required for new users" }, { status: 400 });
    }

    const newUser = await sql`
      INSERT INTO users (name, email, domain)
      VALUES (${name.trim()}, ${normalizedEmail}, ${domain})
      RETURNING id, name, email, domain, team_id, created_at
    `;

    return NextResponse.json({ user: newUser[0] }, { status: 201 });
  } catch (error) {
    console.error("Register user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
