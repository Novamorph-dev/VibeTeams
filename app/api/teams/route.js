import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { generateTeamName } from "@/lib/constants";

export const dynamic = "force-dynamic";

// GET /api/teams — fetch all teams with their members
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    let teams;
    if (domain) {
      teams = await sql`
        SELECT t.id, t.name, t.domain, t.created_by, t.created_at,
               COUNT(u.id)::int as member_count
        FROM teams t
        LEFT JOIN users u ON u.team_id = t.id
        WHERE t.domain = ${domain}
        GROUP BY t.id
        ORDER BY t.created_at ASC
      `;
    } else {
      teams = await sql`
        SELECT t.id, t.name, t.domain, t.created_by, t.created_at,
               COUNT(u.id)::int as member_count
        FROM teams t
        LEFT JOIN users u ON u.team_id = t.id
        GROUP BY t.id
        ORDER BY t.created_at ASC
      `;
    }

    // Fetch members for each team
    const teamIds = teams.map((t) => t.id);
    let members = [];

    if (teamIds.length > 0) {
      members = await sql`
        SELECT id, name, email, domain, team_id
        FROM users
        WHERE team_id = ANY(${teamIds})
        ORDER BY created_at ASC
      `;
    }

    const teamsWithMembers = teams.map((team) => ({
      ...team,
      members: members.filter((m) => m.team_id === team.id),
    }));

    return NextResponse.json({ teams: teamsWithMembers }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (error) {
    console.error("Get teams error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/teams — create a new team and optionally add a user
export async function POST(request) {
  try {
    const { name, domain, userEmail } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    // Check if user is already on a team
    if (userEmail) {
      const user = await sql`
        SELECT id, team_id FROM users WHERE email = ${userEmail.toLowerCase()}
      `;
      if (user.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      if (user[0].team_id) {
        return NextResponse.json(
          { error: "You are already on a team" },
          { status: 409 }
        );
      }
    }

    // Count existing teams for this domain to generate a name
    const existingCount = await sql`
      SELECT COUNT(*)::int as count FROM teams WHERE domain = ${domain}
    `;
    const teamName = name?.trim() || generateTeamName(domain, existingCount[0].count);

    // Create the team
    const newTeam = await sql`
      INSERT INTO teams (name, domain, created_by)
      VALUES (${teamName}, ${domain}, ${userEmail ? userEmail.toLowerCase() : null})
      RETURNING id, name, domain, created_by, created_at
    `;

    const team = newTeam[0];

    // Add user to team if provided
    if (userEmail) {
      await sql`
        UPDATE users SET team_id = ${team.id}
        WHERE email = ${userEmail.toLowerCase()}
      `;
    }

    return NextResponse.json({ team: { ...team, member_count: userEmail ? 1 : 0, members: [] } }, { status: 201 });
  } catch (error) {
    console.error("Create team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
