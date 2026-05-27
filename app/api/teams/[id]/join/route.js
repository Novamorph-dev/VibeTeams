import { NextResponse } from "next/server";
import sql from "@/lib/db";

const MAX_TEAM_SIZE = 4;

export async function POST(request, { params }) {
  try {
    const teamId = parseInt(params.id);
    const { userEmail } = await request.json();

    if (!userEmail) {
      return NextResponse.json({ error: "User email required" }, { status: 400 });
    }

    const normalizedEmail = userEmail.trim().toLowerCase();

    // Get user
    const users = await sql`
      SELECT id, name, email, domain, team_id
      FROM users WHERE email = ${normalizedEmail}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[0];

    if (user.team_id) {
      return NextResponse.json(
        { error: "You are already on a team. Leave your current team first." },
        { status: 409 }
      );
    }

    // Get team and check capacity
    const teams = await sql`
      SELECT t.id, t.name, t.domain,
             COUNT(u.id)::int as member_count
      FROM teams t
      LEFT JOIN users u ON u.team_id = t.id
      WHERE t.id = ${teamId}
      GROUP BY t.id
    `;

    if (teams.length === 0) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const team = teams[0];

    if (team.member_count >= MAX_TEAM_SIZE) {
      return NextResponse.json(
        { error: "Team is full (max 4 members)" },
        { status: 409 }
      );
    }

    // Add user to team
    await sql`
      UPDATE users SET team_id = ${teamId}
      WHERE id = ${user.id}
    `;

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        domain: team.domain,
        member_count: team.member_count + 1,
      },
    });
  } catch (error) {
    console.error("Join team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
