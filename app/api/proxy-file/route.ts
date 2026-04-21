import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const bucketId = url.searchParams.get("bucketId");
    const fileId = url.searchParams.get("fileId");

    if (!bucketId || !fileId) {
        return NextResponse.json({ error: "Missing bucketId or fileId" }, { status: 400 });
    }

    const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

    const target = `${APPWRITE_ENDPOINT}/v1/storage/buckets/${encodeURIComponent(
        bucketId
    )}/files/${encodeURIComponent(fileId)}/view?project=${APPWRITE_PROJECT_ID}`;


    const res = await fetch(target, {
        headers: {
            "X-Appwrite-Project": APPWRITE_PROJECT_ID || "",
        }
    });
    if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch file from Appwrite" }, { status: res.status });
    }
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const body = await res.arrayBuffer();

    return new Response(body, {
        status: 200,
        headers: {
            "Content-Type": contentType,
            "Content-Length": body.byteLength.toString(),   // 🔥 important
            "Cache-Control": "public, max-age=31536000",    // helps loaders
            "Access-Control-Allow-Origin": "*",
        },
    });

}

