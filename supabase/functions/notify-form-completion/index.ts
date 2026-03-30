import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  patientName: z.string(),
  patientEmail: z.string().email(),
  formTitle: z.string(),
  completedAt: z.string(),
  totalScore: z.number().nullable().optional(),
  resultTitle: z.string().nullable().optional(),
  resultText: z.string().nullable().optional(),
});

const ADMIN_EMAIL = "degirolami@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { patientName, patientEmail, formTitle, completedAt, totalScore, resultTitle, resultText } = parsed.data;

    const scoreHtml = totalScore !== null && totalScore !== undefined
      ? `<tr><td style="padding:8px 12px;color:#6b7280;font-size:14px;">Puntaje</td><td style="padding:8px 12px;font-size:14px;font-weight:600;color:#3a8a6a;">${totalScore}</td></tr>`
      : "";

    const resultHtml = resultTitle
      ? `<tr style="background:#f9fafb;"><td style="padding:8px 12px;color:#6b7280;font-size:14px;">Resultado</td><td style="padding:8px 12px;font-size:14px;font-weight:600;color:#2d3b2e;">${resultTitle}</td></tr>`
        + (resultText ? `<tr><td colspan="2" style="padding:12px;color:#4b5563;font-size:13px;line-height:1.5;border-top:1px solid #e5e7eb;">${resultText}</td></tr>` : '')
      : "";

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background-color:#f5faf6;padding:40px 20px;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 4px 24px -4px rgba(45,59,46,0.08);">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="color:#3a8a6a;font-family:'Outfit','DM Sans',Arial,sans-serif;font-size:22px;margin:0;">Nueva evaluación completada</h1>
    </div>
    <p style="margin:0 0 16px;color:#2d3b2e;font-family:'DM Sans',Arial,sans-serif;font-size:15px;line-height:1.6;">
      Un paciente ha completado una evaluación en el Programa ANE.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr style="background:#f9fafb;"><td style="padding:8px 12px;color:#6b7280;font-size:14px;">Paciente</td><td style="padding:8px 12px;font-size:14px;font-weight:600;color:#2d3b2e;">${patientName || "Sin nombre"}</td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280;font-size:14px;">Email</td><td style="padding:8px 12px;font-size:14px;color:#2d3b2e;">${patientEmail}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:8px 12px;color:#6b7280;font-size:14px;">Evaluación</td><td style="padding:8px 12px;font-size:14px;font-weight:600;color:#2d3b2e;">${formTitle}</td></tr>
      ${scoreHtml}
      <tr><td style="padding:8px 12px;color:#6b7280;font-size:14px;">Fecha</td><td style="padding:8px 12px;font-size:14px;color:#2d3b2e;">${completedAt}</td></tr>
    </table>
  </div>
</body>
</html>`;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        to: [ADMIN_EMAIL],
        subject: `${patientName || "Paciente"} completó: ${formTitle}`,
        html: htmlBody,
      }),
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendResult);
      return new Response(
        JSON.stringify({ error: `Error enviando email: ${JSON.stringify(resendResult)}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: resendResult.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
