"use server";

import pool from "./db";
import { initDb } from "./db-init";
import { z } from "zod";

// ---------------- Fields ----------------
export async function listFields() {
  await initDb();
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT id, name 
      FROM public.fields 
      WHERE status = 'active' 
      ORDER BY name
    `);
    return rows;
  } catch (error) {
    console.error("Error in listFields:", error);
    throw new Error("Failed to load fields.");
  } finally {
    client.release();
  }
}

// ---------------- Filter options ----------------
export async function listFilterOptions() {
  await initDb();
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT city, state, education 
      FROM public.experts_public
    `);

    const cities = new Set<string>();
    const states = new Set<string>();
    const educations = new Set<string>();

    for (const row of rows) {
      if (row.city) cities.add(row.city);
      if (row.state) states.add(row.state);
      if (row.education) educations.add(row.education);
    }

    return {
      cities: [...cities].sort(),
      states: [...states].sort(),
      educations: [...educations].sort(),
    };
  } catch (error) {
    console.error("Error in listFilterOptions:", error);
    throw new Error("Failed to load filter options.");
  } finally {
    client.release();
  }
}

// ---------------- Experts list ----------------
const ListExpertsInput = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  education: z.string().optional(),
  fieldIds: z.array(z.string().uuid()).optional(),
  search: z.string().optional(),
});

type ListExpertsType = z.infer<typeof ListExpertsInput>;

export async function listExperts({ data }: { data: ListExpertsType }) {
  await initDb();
  const parsed = ListExpertsInput.parse(data);
  const client = await pool.connect();

  try {
    let expertIdsFilter: string[] | null = null;
    if (parsed.fieldIds && parsed.fieldIds.length > 0) {
      const { rows } = await client.query(
        `SELECT expert_id 
         FROM public.expert_fields 
         WHERE field_id = ANY($1::uuid[])`,
        [parsed.fieldIds],
      );

      // Expert must have ALL selected fields
      const counts = new Map<string, number>();
      for (const r of rows) {
        counts.set(r.expert_id, (counts.get(r.expert_id) ?? 0) + 1);
      }
      expertIdsFilter = [...counts.entries()]
        .filter(([, c]) => c >= parsed.fieldIds!.length)
        .map(([id]) => id);

      if (expertIdsFilter.length === 0) return { experts: [] };
    }

    let queryText = `
      SELECT id, name, occupation, city, state, education 
      FROM public.experts_public 
      WHERE 1=1
    `;
    const queryParams: unknown[] = [];

    if (parsed.city) {
      queryParams.push(parsed.city);
      queryText += ` AND city = $${queryParams.length}`;
    }
    if (parsed.state) {
      queryParams.push(parsed.state);
      queryText += ` AND state = $${queryParams.length}`;
    }
    if (parsed.education) {
      queryParams.push(parsed.education);
      queryText += ` AND education = $${queryParams.length}`;
    }
    if (expertIdsFilter) {
      queryParams.push(expertIdsFilter);
      queryText += ` AND id = ANY($${queryParams.length}::uuid[])`;
    }
    if (parsed.search && parsed.search.trim()) {
      queryParams.push(`%${parsed.search.trim()}%`);
      queryText += ` AND (name ILIKE $${queryParams.length} OR occupation ILIKE $${queryParams.length})`;
    }

    queryText += ` ORDER BY created_at DESC LIMIT 200`;

    const { rows: experts } = await client.query(queryText, queryParams);

    // Fetch fields for these experts
    const ids = experts.map((e) => e.id).filter(Boolean);
    const fieldsByExpert: Record<string, { id: string; name: string }[]> = {};

    if (ids.length > 0) {
      const { rows: efRows } = await client.query(
        `SELECT ef.expert_id, ef.field_id, f.name 
         FROM public.expert_fields ef
         JOIN public.fields f ON ef.field_id = f.id
         WHERE ef.expert_id = ANY($1::uuid[])`,
        [ids],
      );

      for (const row of efRows) {
        if (!fieldsByExpert[row.expert_id]) {
          fieldsByExpert[row.expert_id] = [];
        }
        fieldsByExpert[row.expert_id].push({ id: row.field_id, name: row.name });
      }
    }

    return {
      experts: experts.map((e) => ({
        ...e,
        fields: fieldsByExpert[e.id] ?? [],
      })),
    };
  } catch (error) {
    console.error("Error in listExperts:", error);
    throw new Error("Failed to load experts list.");
  } finally {
    client.release();
  }
}

// ---------------- Expert detail ----------------
export async function getExpert({ data }: { data: { id: string } }) {
  await initDb();
  const idParsed = z.object({ id: z.string().uuid() }).parse(data);
  const client = await pool.connect();

  try {
    const { rows: expertRows } = await client.query(
      `SELECT * FROM public.experts_public WHERE id = $1`,
      [idParsed.id],
    );

    const expert = expertRows[0];
    if (!expert) return null;

    const { rows: fieldRows } = await client.query(
      `SELECT f.id, f.name 
       FROM public.expert_fields ef
       JOIN public.fields f ON ef.field_id = f.id
       WHERE ef.expert_id = $1`,
      [idParsed.id],
    );

    return {
      ...expert,
      fields: fieldRows,
    };
  } catch (error) {
    console.error("Error in getExpert:", error);
    throw new Error("Failed to load expert details.");
  } finally {
    client.release();
  }
}

// ---------------- Honeypot/math check ----------------
const antiBot = z.object({
  hp: z.string().max(0, "Bot detected"),
  challenge: z
    .string()
    .refine((v) => v.trim() === "7", "Please solve the simple math question (3 + 4)."),
});

// ---------------- Register expert ----------------
const phoneRegex = /^[+\d][\d\s\-().]{6,19}$/;
const RegisterExpertInput = z
  .object({
    name: z.string().trim().min(2).max(120),
    age: z.number().int().min(1).max(129),
    gender: z.enum(["male", "female", "other"]),
    phone: z.string().trim().regex(phoneRegex, "Invalid phone number"),
    email: z.string().trim().email().max(255),
    blood_group: z
      .enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"])
      .optional()
      .nullable(),
    education: z.string().trim().max(200).optional().nullable(),
    occupation: z.string().trim().max(200).optional().nullable(),
    address: z.string().trim().max(300).optional().nullable(),
    city: z.string().trim().max(100).optional().nullable(),
    state: z.string().trim().max(100).optional().nullable(),
    what_i_can_offer: z.string().trim().max(2000).optional().nullable(),
    what_i_expect: z.string().trim().max(2000).optional().nullable(),
    hobbies_interests: z.string().trim().max(500).optional().nullable(),
    digital_identity: z.string().trim().max(1000).optional().nullable(),
    special_notes: z.string().trim().max(1000).optional().nullable(),
    fieldIds: z.array(z.string().uuid()).optional().default([]),
    newFieldNames: z.array(z.string().trim().min(2).max(80)).optional().default([]),
    hp: z.string().max(0),
    challenge: z.string(),
  })
  .superRefine((v, ctx) => {
    const r = antiBot.safeParse({ hp: v.hp, challenge: v.challenge });
    if (!r.success) {
      for (const i of r.error.issues) ctx.addIssue(i);
    }
    if ((v.fieldIds || []).length === 0 && (v.newFieldNames || []).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pick at least one field of expertise",
        path: ["fieldIds"],
      });
    }
  });

type RegisterExpertType = z.infer<typeof RegisterExpertInput>;

export async function registerExpert({ data }: { data: RegisterExpertType }) {
  await initDb();
  const parsed = RegisterExpertInput.parse(data);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create any brand-new fields (pending_review)
    const newFieldIds: string[] = [];
    for (const name of parsed.newFieldNames ?? []) {
      const trimmed = name.trim();
      if (!trimmed) continue;

      // Check existing
      const { rows: existing } = await client.query(
        "SELECT id FROM public.fields WHERE name ILIKE $1",
        [trimmed],
      );

      if (existing.length > 0) {
        newFieldIds.push(existing[0].id);
        continue;
      }

      // Insert new field
      const { rows: inserted } = await client.query(
        "INSERT INTO public.fields (name, status) VALUES ($1, 'pending_review') RETURNING id",
        [trimmed],
      );
      newFieldIds.push(inserted[0].id);
    }

    const allFieldIds = [...new Set([...(parsed.fieldIds ?? []), ...newFieldIds])];

    // Insert expert (approved by default per existing behavior)
    const { rows: expertRows } = await client.query(
      `INSERT INTO public.experts (
        name, age, gender, phone, email, blood_group, education, occupation,
        address, city, state, what_i_can_offer, what_i_expect, hobbies_interests,
        digital_identity, special_notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'approved') 
      RETURNING id`,
      [
        parsed.name,
        parsed.age,
        parsed.gender,
        parsed.phone,
        parsed.email,
        parsed.blood_group,
        parsed.education,
        parsed.occupation,
        parsed.address,
        parsed.city,
        parsed.state,
        parsed.what_i_can_offer,
        parsed.what_i_expect,
        parsed.hobbies_interests,
        parsed.digital_identity,
        parsed.special_notes,
      ],
    );

    const expertId = expertRows[0].id;

    // Link expert fields
    if (allFieldIds.length > 0) {
      for (const fieldId of allFieldIds) {
        await client.query(
          "INSERT INTO public.expert_fields (expert_id, field_id) VALUES ($1, $2)",
          [expertId, fieldId],
        );
      }
    }

    await client.query("COMMIT");
    return { id: expertId };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in registerExpert:", error);
    throw error instanceof Error ? error : new Error("Registration failed.");
  } finally {
    client.release();
  }
}

// ---------------- Submit question ----------------
const SubmitQuestionInput = z
  .object({
    query_text: z.string().trim().min(10).max(2000),
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().regex(phoneRegex, "Invalid phone number"),
    email: z.string().trim().email().max(255),
    fieldIds: z.array(z.string().uuid()).optional().default([]),
    hp: z.string().max(0),
    challenge: z.string(),
  })
  .superRefine((v, ctx) => {
    const r = antiBot.safeParse({ hp: v.hp, challenge: v.challenge });
    if (!r.success) {
      for (const i of r.error.issues) ctx.addIssue(i);
    }
  });

type SubmitQuestionType = z.infer<typeof SubmitQuestionInput>;

export async function submitQuestion({ data }: { data: SubmitQuestionType }) {
  await initDb();
  const parsed = SubmitQuestionInput.parse(data);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: questionRows } = await client.query(
      `INSERT INTO public.questions (query_text, name, phone, email, status) 
       VALUES ($1, $2, $3, $4, 'new') 
       RETURNING id`,
      [parsed.query_text, parsed.name, parsed.phone, parsed.email],
    );

    const questionId = questionRows[0].id;

    if (parsed.fieldIds && parsed.fieldIds.length > 0) {
      for (const fieldId of parsed.fieldIds) {
        await client.query(
          "INSERT INTO public.question_fields (question_id, field_id) VALUES ($1, $2)",
          [questionId, fieldId],
        );
      }
    }

    await client.query("COMMIT");
    return { id: questionId };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in submitQuestion:", error);
    throw error instanceof Error ? error : new Error("Failed to submit question.");
  } finally {
    client.release();
  }
}

// ---------------- Stats ----------------
export async function getStats() {
  await initDb();
  const client = await pool.connect();
  try {
    const { rows: expertsRes } = await client.query("SELECT COUNT(*) FROM public.experts_public");
    const { rows: fieldsRes } = await client.query(
      "SELECT COUNT(*) FROM public.fields WHERE status = 'active'",
    );

    return {
      experts: parseInt(expertsRes[0].count, 10) || 0,
      fields: parseInt(fieldsRes[0].count, 10) || 0,
    };
  } catch (error) {
    console.error("Error in getStats:", error);
    throw new Error("Failed to load stats.");
  } finally {
    client.release();
  }
}
