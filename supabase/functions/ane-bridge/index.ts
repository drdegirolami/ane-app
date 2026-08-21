import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-ane-bridge-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const APP_URL = "https://wellness-cue.lovable.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const expected = Deno.env.get("ANE_BRIDGE_SECRET");
  const provided = req.headers.get("x-ane-bridge-secret");
  if (!expected || !provided || provided !== expected) {
    return json({ error: "unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json().catch(() => ({}));
    const action: string = body.action ?? "patient_summary";

    if (action === "list_patients") {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, status, program_start_date")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return json({ patients: data ?? [] });
    }

    if (action === "list_profiles") {
      const { data, error } = await supabase
        .from("clinical_profiles")
        .select("id, slug, name, description, patient_text, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return json({ profiles: data ?? [] });
    }

    if (action === "upsert_patient") {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!email) return json({ error: "email is required" }, 400);

      const fullName = body.full_name ? String(body.full_name).trim() : null;
      const status = body.status ? String(body.status) : null;
      const programStartDate = body.program_start_date
        ? String(body.program_start_date)
        : null;
      const primarySlug = body.primary_profile_slug
        ? String(body.primary_profile_slug)
        : null;
      const secondarySlug = body.secondary_profile_slug
        ? String(body.secondary_profile_slug)
        : null;

      // Find existing profile by email
      const { data: existing, error: existingError } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("email", email)
        .maybeSingle();
      if (existingError) throw existingError;

      let userId = existing?.user_id as string | undefined;
      let created = false;

      if (!userId) {
        // Create the auth account WITHOUT sending any email
        const tempPassword = `ANE-${crypto.randomUUID()}`;
        const { data: createdUser, error: createError } = await supabase.auth.admin
          .createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: fullName ? { full_name: fullName } : {},
          });
        if (createError) throw createError;
        userId = createdUser.user?.id;
        created = true;
      }

      if (!userId) return json({ error: "could not resolve patient" }, 500);

      const updates: Record<string, unknown> = { email };
      if (fullName) updates.full_name = fullName;
      if (status) updates.status = status;
      if (programStartDate) updates.program_start_date = programStartDate;

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", userId);
      if (updateError) throw updateError;

      // Optional clinical profile assignment (shared basic record)
      if (primarySlug || secondarySlug) {
        const { data: profileRows, error: profilesError } = await supabase
          .from("clinical_profiles")
          .select("id, slug")
          .in("slug", [primarySlug, secondarySlug].filter(Boolean) as string[]);
        if (profilesError) throw profilesError;
        const idBySlug = new Map(
          (profileRows ?? []).map((p: { id: string; slug: string }) => [p.slug, p.id]),
        );
        const { error: assignError } = await supabase
          .from("patient_profile_assignments")
          .insert({
            patient_id: userId,
            primary_profile_id: primarySlug ? idBySlug.get(primarySlug) ?? null : null,
            secondary_profile_id: secondarySlug
              ? idBySlug.get(secondarySlug) ?? null
              : null,
            source: "evaluador",
            notes: body.notes ? String(body.notes) : null,
          });
        if (assignError) throw assignError;
      }

      return json({
        ok: true,
        created,
        patient_id: userId,
        email,
        links: { patients: `${APP_URL}/admin/pacientes` },
      });
    }

    if (action !== "patient_summary") {
      return json({ error: "unknown action" }, 400);
    }


    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email) return json({ error: "email is required" }, 400);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "user_id, full_name, email, status, program_start_date, admin_notes, created_at",
      )
      .ilike("email", email)
      .maybeSingle();
    if (profileError) throw profileError;

    if (!profile) {
      return json({
        found: false,
        email,
        links: { app: APP_URL },
      });
    }

    const patientId = profile.user_id;

    const [
      assignment,
      nextStep,
      checkins,
      responses,
      sessions,
      planning,
    ] = await Promise.all([
      supabase
        .from("patient_profile_assignments")
        .select(
          "assigned_at, source, notes, primary:clinical_profiles!patient_profile_assignments_primary_profile_id_fkey(slug,name,description,patient_text,clinical_attitude,behavioral_tasks,warning_signs,priority_test_slugs), secondary:clinical_profiles!patient_profile_assignments_secondary_profile_id_fkey(slug,name,description,patient_text)",
        )
        .eq("patient_id", patientId)
        .order("assigned_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("patient_next_steps")
        .select("next_step_slug, next_step_title, next_step_url, available, available_from, updated_at")
        .eq("patient_id", patientId)
        .maybeSingle(),
      supabase
        .from("checkins")
        .select("id, created_at, week_rating, anxiety_level, difficult_moment, plan_deviations, adjustments_needed")
        .eq("user_id", patientId)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("form_responses")
        .select("id, submitted_at, total_score, answers_json, template:form_templates(slug, title)")
        .eq("patient_id", patientId)
        .order("submitted_at", { ascending: false })
        .limit(30),
      supabase
        .from("clinical_sessions")
        .select("id, session_date, session_type, program_month, motive, evolution, indications, next_steps, alerts")
        .eq("patient_id", patientId)
        .order("session_date", { ascending: false })
        .limit(10),
      supabase
        .from("patient_planning")
        .select("id, title, description, file_name, uploaded_at")
        .eq("patient_id", patientId)
        .order("uploaded_at", { ascending: false })
        .limit(5),
    ]);

    return json({
      found: true,
      patient: profile,
      clinical_profile: assignment.data ?? null,
      next_step: nextStep.data ?? null,
      checkins: checkins.data ?? [],
      evaluations: (responses.data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id,
        submitted_at: r.submitted_at,
        total_score: r.total_score,
        slug: (r.template as { slug?: string } | null)?.slug ?? null,
        title: (r.template as { title?: string } | null)?.title ?? null,
        answers_json: r.answers_json,
      })),
      clinical_sessions: sessions.data ?? [],
      planning: planning.data ?? [],
      links: {
        app: APP_URL,
        patients: `${APP_URL}/admin/pacientes`,
        evaluations: `${APP_URL}/admin/evaluaciones`,
        planning: `${APP_URL}/admin/planning`,
      },
    });
  } catch (err) {
    console.error("ane-bridge error", err);
    return json({ error: err instanceof Error ? err.message : "unexpected error" }, 500);
  }
});
