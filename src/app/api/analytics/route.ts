import { NextResponse } from "next/server";
import { trackPageView } from "@/lib";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const isMobile = body.isMobile === true;

        await trackPageView(isMobile);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Analytics track error:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
