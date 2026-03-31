import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabaseUser = await createSupabaseServerClient();
    
    // Auth check
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const sessionId = formData.get("sessionId") as string;

    if (!file || !sessionId) {
      return NextResponse.json({ error: "Missing file or sessionId" }, { status: 400 });
    }

    // Determine kind based on mime type
    const mimeType = file.type;
    const isImage = mimeType.startsWith("image/") || mimeType.startsWith("video/");
    const kind = isImage ? "media" : "doc";
    
    // Upload path
    const fileName = file.name;
    const uniqueId = crypto.randomUUID();
    const filePath = `${sessionId}/${uniqueId}/${fileName}`;

    // Admin client to bypass RLS
    const supabaseAdmin = createSupabaseAdminClient();
    
    // Ensure bucket exists (best effort)
    try {
      await supabaseAdmin.storage.createBucket("message-assets", {
        public: true, // Make public for simple CDN-like access
      });
    } catch {
      // Ignore if it already exists
    }

    const { error } = await supabaseAdmin.storage
      .from("message-assets")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("message-assets")
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      kind,
      name: fileName,
      mimeType,
      fileSize: file.size,
    });
  } catch (err) {
    console.error("Internal upload error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
