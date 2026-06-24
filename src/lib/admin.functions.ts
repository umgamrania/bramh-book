"use server";

import pool from "./db";
import { cookies } from "next/headers";
import { verifySession } from "./auth";

export async function checkAdminAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session || !(await verifySession(session))) {
    throw new Error("Unauthorized. Please log in first.");
  }
}

// ---------------- Dashboard Stats ----------------
export async function getDashboardStatsAdmin() {
  await checkAdminAuth();
  const client = await pool.connect();
  try {
    const { rows: expertsRes } = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved
      FROM public.experts
    `);

    const { rows: questionsRes } = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new,
        COUNT(CASE WHEN status = 'in_review' THEN 1 END) as in_review
      FROM public.questions
    `);

    const { rows: fieldsRes } = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending
      FROM public.fields
    `);

    return {
      experts: {
        total: parseInt(expertsRes[0].total, 10) || 0,
        pending: parseInt(expertsRes[0].pending, 10) || 0,
        approved: parseInt(expertsRes[0].approved, 10) || 0,
      },
      questions: {
        total: parseInt(questionsRes[0].total, 10) || 0,
        new: parseInt(questionsRes[0].new, 10) || 0,
        in_review: parseInt(questionsRes[0].in_review, 10) || 0,
      },
      fields: {
        total: parseInt(fieldsRes[0].total, 10) || 0,
        pending: parseInt(fieldsRes[0].pending, 10) || 0,
      },
    };
  } catch (error) {
    console.error("Error in getDashboardStatsAdmin:", error);
    throw new Error("Failed to load dashboard statistics.");
  } finally {
    client.release();
  }
}

// ---------------- Experts Management ----------------
export async function listAllExpertsAdmin() {
  await checkAdminAuth();
  const client = await pool.connect();
  try {
    const { rows: experts } = await client.query(`
      SELECT id, name, age, gender, phone, email, blood_group, education, occupation, 
             address, city, state, what_i_can_offer, what_i_expect, hobbies_interests, 
             digital_identity, special_notes, status, created_at
      FROM public.experts 
      ORDER BY created_at DESC
    `);

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

    return experts.map((e) => ({
      ...e,
      fields: fieldsByExpert[e.id] ?? [],
    }));
  } catch (error) {
    console.error("Error in listAllExpertsAdmin:", error);
    throw new Error("Failed to load experts list.");
  } finally {
    client.release();
  }
}

export async function updateExpertAdmin({ id, data }: { id: string; data: any }) {
  await checkAdminAuth();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE public.experts 
       SET name = $1, age = $2, gender = $3, phone = $4, email = $5, blood_group = $6, 
           education = $7, occupation = $8, address = $9, city = $10, state = $11, 
           what_i_can_offer = $12, what_i_expect = $13, hobbies_interests = $14, 
           digital_identity = $15, special_notes = $16, status = $17
       WHERE id = $18`,
      [
        data.name,
        data.age,
        data.gender,
        data.phone,
        data.email,
        data.blood_group || null,
        data.education || null,
        data.occupation || null,
        data.address || null,
        data.city || null,
        data.state || null,
        data.what_i_can_offer || null,
        data.what_i_expect || null,
        data.hobbies_interests || null,
        data.digital_identity || null,
        data.special_notes || null,
        data.status,
        id,
      ],
    );

    // Update expert fields join table
    await client.query(`DELETE FROM public.expert_fields WHERE expert_id = $1`, [id]);

    if (data.fieldIds && data.fieldIds.length > 0) {
      for (const fId of data.fieldIds) {
        await client.query(
          `INSERT INTO public.expert_fields (expert_id, field_id) VALUES ($1, $2)`,
          [id, fId],
        );
      }
    }

    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in updateExpertAdmin:", error);
    throw new Error("Failed to update expert.");
  } finally {
    client.release();
  }
}

export async function deleteExpertAdmin({ id }: { id: string }) {
  await checkAdminAuth();
  const client = await pool.connect();
  try {
    // Cascades automatically to expert_fields
    await client.query(`DELETE FROM public.experts WHERE id = $1`, [id]);
    return { success: true };
  } catch (error) {
    console.error("Error in deleteExpertAdmin:", error);
    throw new Error("Failed to delete expert.");
  } finally {
    client.release();
  }
}

// ---------------- Questions Management ----------------
export async function listAllQuestionsAdmin() {
  await checkAdminAuth();
  const client = await pool.connect();
  try {
    const { rows: questions } = await client.query(`
      SELECT id, query_text, name, phone, email, status, created_at 
      FROM public.questions 
      ORDER BY created_at DESC
    `);

    const qIds = questions.map((q) => q.id).filter(Boolean);
    const fieldsByQuestion: Record<string, { id: string; name: string }[]> = {};

    if (qIds.length > 0) {
      const { rows: qfRows } = await client.query(
        `SELECT qf.question_id, qf.field_id, f.name 
         FROM public.question_fields qf
         JOIN public.fields f ON qf.field_id = f.id
         WHERE qf.question_id = ANY($1::uuid[])`,
        [qIds],
      );

      for (const row of qfRows) {
        if (!fieldsByQuestion[row.question_id]) {
          fieldsByQuestion[row.question_id] = [];
        }
        fieldsByQuestion[row.question_id].push({ id: row.field_id, name: row.name });
      }
    }

    return questions.map((q) => ({
      ...q,
      fields: fieldsByQuestion[q.id] ?? [],
    }));
  } catch (error) {
    console.error("Error in listAllQuestionsAdmin:", error);
    throw new Error("Failed to load questions list.");
  } finally {
    client.release();
  }
}

export async function updateQuestionAdmin({ id, data }: { id: string; data: any }) {
  await checkAdminAuth();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE public.questions 
       SET query_text = $1, name = $2, phone = $3, email = $4, status = $5
       WHERE id = $6`,
      [data.query_text, data.name, data.phone, data.email, data.status, id],
    );

    // Update question fields join table
    await client.query(`DELETE FROM public.question_fields WHERE question_id = $1`, [id]);

    if (data.fieldIds && data.fieldIds.length > 0) {
      for (const fId of data.fieldIds) {
        await client.query(
          `INSERT INTO public.question_fields (question_id, field_id) VALUES ($1, $2)`,
          [id, fId],
        );
      }
    }

    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in updateQuestionAdmin:", error);
    throw new Error("Failed to update question.");
  } finally {
    client.release();
  }
}

export async function deleteQuestionAdmin({ id }: { id: string }) {
  await checkAdminAuth();
  const client = await pool.connect();
  try {
    // Cascades automatically to question_fields
    await client.query(`DELETE FROM public.questions WHERE id = $1`, [id]);
    return { success: true };
  } catch (error) {
    console.error("Error in deleteQuestionAdmin:", error);
    throw new Error("Failed to delete question.");
  } finally {
    client.release();
  }
}

// ---------------- Fields Management ----------------
export async function listAllFieldsAdmin() {
  await checkAdminAuth();
  const client = await pool.connect();
  try {
    const { rows: fields } = await client.query(`
      SELECT id, name, status, created_at 
      FROM public.fields 
      ORDER BY status DESC, name ASC
    `);
    return fields;
  } catch (error) {
    console.error("Error in listAllFieldsAdmin:", error);
    throw new Error("Failed to load fields.");
  } finally {
    client.release();
  }
}

export async function updateFieldAdmin({ id, data }: { id: string; data: any }) {
  await checkAdminAuth();
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE public.fields 
       SET name = $1, status = $2
       WHERE id = $3`,
      [data.name, data.status, id],
    );
    return { success: true };
  } catch (error) {
    console.error("Error in updateFieldAdmin:", error);
    throw new Error("Failed to update field.");
  } finally {
    client.release();
  }
}

export async function deleteFieldAdmin({ id }: { id: string }) {
  await checkAdminAuth();
  const client = await pool.connect();
  try {
    // Cascades automatically to expert_fields and question_fields
    await client.query(`DELETE FROM public.fields WHERE id = $1`, [id]);
    return { success: true };
  } catch (error) {
    console.error("Error in deleteFieldAdmin:", error);
    throw new Error("Failed to delete field.");
  } finally {
    client.release();
  }
}
