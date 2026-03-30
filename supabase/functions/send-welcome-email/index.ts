import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  recipientEmail: z.string().email(),
  recipientName: z.string().optional().default(""),
  password: z.string().min(1),
  appUrl: z.string().url(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate body
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { recipientEmail, recipientName, password, appUrl } = parsed.data;

    // Fetch editable template from screen_texts
    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: templateData, error: templateError } = await serviceClient
      .from("screen_texts")
      .select("content, title")
      .eq("screen_key", "email_bienvenida")
      .single();

    if (templateError || !templateData?.content) {
      return new Response(
        JSON.stringify({ error: "No se encontró la plantilla de email" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Replace placeholders in template
    let emailBody = templateData.content
      .replace(/\{\{nombre\}\}/g, recipientName || "Paciente")
      .replace(/\{\{email\}\}/g, recipientEmail)
      .replace(/\{\{password\}\}/g, password)
      .replace(/\{\{app_url\}\}/g, appUrl);

    // Convert line breaks to HTML
    const htmlBody = emailBody
      .split("\n")
      .map((line: string) => (line.trim() === "" ? "<br/>" : `<p style="margin:0 0 8px;color:#2d3b2e;font-family:'DM Sans',Arial,sans-serif;font-size:15px;line-height:1.6;">${line}</p>`))
      .join("");

    const fullHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background-color:#f5faf6;padding:40px 20px;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 4px 24px -4px rgba(45,59,46,0.08);">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="color:#3a8a6a;font-family:'Outfit','DM Sans',Arial,sans-serif;font-size:24px;margin:0;">Programa ANE</h1>
    </div>
    ${htmlBody}
    <div style="margin-top:24px;text-align:center;">
      <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#3a8a6a,#4a9a7a);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-family:'DM Sans',Arial,sans-serif;font-weight:600;font-size:15px;">Acceder a la aplicación</a>
    </div>
  </div>
</body>
</html>`;

    // Send via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Programa ANE <info@nutridegirolami.com>",
        to: [recipientEmail],
        subject: templateData.title || "Bienvenido/a al Programa ANE",
        html: fullHtml,
      }),
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendResult);
      return new Response(
        JSON.stringify({
          error: `Error enviando email: ${JSON.stringify(resendResult)}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: resendResult.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
