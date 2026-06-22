import pool from "./db";

let isInitialized = false;

export async function initDb() {
  if (isInitialized) return;

  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not set. Database initialization skipped.");
    return;
  }

  const client = await pool.connect();
  try {
    // Check if fields table exists
    const res = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'fields'
      );
    `);

    const exists = res.rows[0]?.exists;
    if (exists) {
      isInitialized = true;
      return;
    }

    console.log("Initializing database schema and seeding data...");

    // Run the migration SQL script
    await client.query(`
      -- Enable UUID extension if not enabled
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Enums
      DO $$ BEGIN
          CREATE TYPE public.gender_enum AS ENUM ('male', 'female', 'other');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
          CREATE TYPE public.blood_group_enum AS ENUM ('A+','A-','B+','B-','O+','O-','AB+','AB-','Unknown');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
          CREATE TYPE public.field_status AS ENUM ('active','pending_review');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
          CREATE TYPE public.expert_status AS ENUM ('pending','approved','rejected');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
          CREATE TYPE public.question_status AS ENUM ('new','in_review','answered','closed');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      -- Fields
      CREATE TABLE IF NOT EXISTS public.fields (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        status public.field_status NOT NULL DEFAULT 'active',
        created_by_expert_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      -- Experts
      CREATE TABLE IF NOT EXISTS public.experts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        age INT NOT NULL CHECK (age > 0 AND age < 130),
        gender public.gender_enum NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        blood_group public.blood_group_enum,
        education TEXT,
        occupation TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        what_i_can_offer TEXT,
        what_i_expect TEXT,
        hobbies_interests TEXT,
        digital_identity TEXT,
        special_notes TEXT,
        status public.expert_status NOT NULL DEFAULT 'approved',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      -- Public-safe view
      CREATE OR REPLACE VIEW public.experts_public AS
      SELECT id, name, age, gender, blood_group, education, occupation, city, state,
             what_i_can_offer, what_i_expect, hobbies_interests, digital_identity, special_notes,
             address, created_at
      FROM public.experts
      WHERE status = 'approved';

      -- Expert <-> Field join
      CREATE TABLE IF NOT EXISTS public.expert_fields (
        expert_id UUID NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
        field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
        PRIMARY KEY (expert_id, field_id)
      );

      -- Questions
      CREATE TABLE IF NOT EXISTS public.questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        query_text TEXT NOT NULL CHECK (char_length(query_text) <= 2000 AND char_length(query_text) > 0),
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        status public.question_status NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      -- Question <-> Field join
      CREATE TABLE IF NOT EXISTS public.question_fields (
        question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
        field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
        PRIMARY KEY (question_id, field_id)
      );

      -- updated_at trigger
      CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = now(); RETURN NEW; END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_experts_updated_at ON public.experts;
      CREATE TRIGGER trg_experts_updated_at BEFORE UPDATE ON public.experts
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

      -- Seed fields
      INSERT INTO public.fields (name)
      SELECT name FROM (VALUES
        ('Medicine'),('Law'),('Engineering'),('Finance / CA'),('Education / Teaching'),
        ('IT / Software'),('Government Jobs'),('Arts & Culture'),('Spirituality / Rituals'),
        ('Business / Entrepreneurship'),('Healthcare / Nursing'),('Real Estate'),
        ('Agriculture'),('Marketing'),('Design')
      ) AS v(name)
      WHERE NOT EXISTS (SELECT 1 FROM public.fields);
    `);

    console.log("Database initialized successfully!");
    isInitialized = true;
  } catch (err) {
    console.error("Database initialization failed:", err);
    throw err;
  } finally {
    client.release();
  }
}
