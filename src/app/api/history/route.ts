import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const history = await prisma.business.findMany({
      select: {
        username: true,
        business_name: true,
        industry: true,
        updated_at: true,
      },
      orderBy: {
        updated_at: "desc",
      },
      take: 10,
    });
    return NextResponse.json({ history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
