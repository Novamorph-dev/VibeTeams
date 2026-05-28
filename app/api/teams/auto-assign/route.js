import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { generateTeamName } from "@/lib/constants";

export const dynamic = "force-dynamic";

const MAX_TEAM_SIZE = 4;

export async function POST(request) {
  try {
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
        { error: "You are already on a team" },
        { status: 409 }
      );
    }

    // Find teams in user's domain with available slots (< MAX_TEAM_SIZE members)
    const availableTeams = await sql`
      SELECT t.id, t.name, t.domain,
             COUNT(u.id)::int as member_count
      FROM teams t
      LEFT JOIN users u ON u.team_id = t.id
      WHERE t.domain = ${user.domain}
      GROUP BY t.id
      HAVING COUNT(u.id) < ${MAX_TEAM_SIZE}
      ORDER BY COUNT(u.id) DESC, t.created_at ASC
      LIMIT 1
    `;

    let teamId;
    let teamName;
    let isNewTeam = false;

    if (availableTeams.length > 0) {
      // Join existing team
      teamId = availableTeams[0].id;
      teamName = availableTeams[0].name;
    } else {
      // Create new team in this domain
      const existingCount = await sql`
        SELECT COUNT(*)::int as count FROM teams WHERE domain = ${user.domain}
      `;
      teamName = generateTeamName(user.domain, existingCount[0].count);

      const newTeam = await sql`
        INSERT INTO teams (name, domain, created_by)
        VALUES (${teamName}, ${user.domain}, ${user.email})
        RETURNING id, name
      `;
      teamId = newTeam[0].id;
      isNewTeam = true;
    }

    // Assign user to team
    await sql`
      UPDATE users SET team_id = ${teamId}
      WHERE id = ${user.id}
    `;

    return NextResponse.json({
      success: true,
      isNewTeam,
      team: {
        id: teamId,
        name: teamName,
        domain: user.domain,
      },
    });
  } catch (error) {
    console.error("Auto-assign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
