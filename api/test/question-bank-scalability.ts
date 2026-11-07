import dotenv from 'dotenv';
dotenv.config({ path: 'api/.env' });
import pg from 'pg';
import { performance } from 'node:perf_hooks';
import { normalizeDatabaseConnectionString } from '../src/prisma/prisma.service.js';

const connectionString = normalizeDatabaseConnectionString(process.env.DATABASE_URL!);

async function runScaleTest() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log('Connected to PostgreSQL for Question Bank Scalability Test');

  try {
    // Check if we can create a temporary unlogged table for high-performance scale benchmarking
    await client.query(`
      CREATE UNLOGGED TABLE IF NOT EXISTS benchmark_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        external_id VARCHAR(64) UNIQUE,
        course_subject_id UUID,
        chapter_id UUID,
        type VARCHAR(32) DEFAULT 'SINGLE_CORRECT',
        difficulty VARCHAR(16) DEFAULT 'MEDIUM',
        text_en TEXT,
        text_ta TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Existing baseline indexes matching schema.prisma
    await client.query(`
      CREATE INDEX IF NOT EXISTS bq_subject_chapter_idx ON benchmark_questions (course_subject_id, chapter_id);
      CREATE INDEX IF NOT EXISTS bq_type_diff_active_idx ON benchmark_questions (type, difficulty, is_active);
    `);

    const sampleSubjects = [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444',
    ];
    const sampleChapters = [
      'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    ];
    const difficulties = ['EASY', 'MEDIUM', 'HARD'];

    const testScales = [10_000, 25_000, 50_000];

    for (const scale of testScales) {
      console.log(`\n========================================================`);
      console.log(`SCALING BENCHMARK: Populating dataset to ${scale.toLocaleString()} rows...`);
      console.log(`========================================================`);

      await client.query('TRUNCATE TABLE benchmark_questions;');
      const tPop0 = performance.now();
      await client.query(`
        INSERT INTO benchmark_questions (
          external_id, course_subject_id, chapter_id, difficulty, text_en, text_ta, updated_at
        )
        SELECT 
          'SCALE-Q-' || i,
          ('${sampleSubjects[0]}'::uuid),
          ('${sampleChapters[0]}'::uuid),
          (ARRAY['EASY','MEDIUM','HARD'])[1 + (i % 3)],
          'What is the fundamental law of physics concept question number ' || i || ' involving thermodynamics and kinematics calculations?',
          'இயற்பியல் கேள்வி எண் ' || i || ' வெப்ப இயக்கவியல் மற்றும் இயக்கவியல் கணக்கீடுகள் பற்றியது',
          now() - (i || ' minutes')::interval
        FROM generate_series(1, ${scale}) AS i;
      `);
      console.log(`Populated ${scale.toLocaleString()} questions in ${(performance.now() - tPop0).toFixed(1)} ms`);

      // Run ANALYZE to update PostgreSQL optimizer statistics
      await client.query('ANALYZE benchmark_questions;');

      // 1. Pagination benchmark
      const t0Page = performance.now();
      const p1 = await client.query('EXPLAIN ANALYZE SELECT * FROM benchmark_questions ORDER BY updated_at DESC LIMIT 20 OFFSET 0;');
      const page1Time = performance.now() - t0Page;

      const t0DeepPage = performance.now();
      const pDeep = await client.query('EXPLAIN ANALYZE SELECT * FROM benchmark_questions ORDER BY updated_at DESC LIMIT 20 OFFSET 5000;');
      const deepPageTime = performance.now() - t0DeepPage;

      // 2. Subject filter benchmark
      const t0Subj = performance.now();
      const pSubj = await client.query(`EXPLAIN ANALYZE SELECT * FROM benchmark_questions WHERE course_subject_id = '${sampleSubjects[0]}'::uuid LIMIT 20;`);
      const subjTime = performance.now() - t0Subj;

      // 3. Chapter filter benchmark (only chapter, not leading subject)
      const t0Chap = performance.now();
      const pChap = await client.query(`EXPLAIN ANALYZE SELECT * FROM benchmark_questions WHERE chapter_id = '${sampleChapters[0]}'::uuid LIMIT 20;`);
      const chapTime = performance.now() - t0Chap;

      // 4. Difficulty filter benchmark (only difficulty, not leading type)
      const t0Diff = performance.now();
      const pDiff = await client.query(`EXPLAIN ANALYZE SELECT * FROM benchmark_questions WHERE difficulty = 'HARD' LIMIT 20;`);
      const diffTime = performance.now() - t0Diff;

      // 5. Text search benchmark (ILIKE wildcard)
      const t0Text = performance.now();
      const pText = await client.query(`EXPLAIN ANALYZE SELECT * FROM benchmark_questions WHERE text_en ILIKE '%thermodynamics%' LIMIT 20;`);
      const textTime = performance.now() - t0Text;

      // 6. Question detail retrieval (Primary key / External ID lookup)
      const t0Detail = performance.now();
      const pDetail = await client.query(`EXPLAIN ANALYZE SELECT * FROM benchmark_questions WHERE external_id = 'SCALE-Q-500';`);
      const detailTime = performance.now() - t0Detail;

      console.log(`Results for ${scale.toLocaleString()} questions:`);
      console.log(`  - Page 1 (ORDER BY updated_at DESC LIMIT 20): ${page1Time.toFixed(2)} ms`);
      console.log(`  - Deep Page (OFFSET 5000 LIMIT 20): ${deepPageTime.toFixed(2)} ms`);
      console.log(`  - Subject Filter: ${subjTime.toFixed(2)} ms`);
      console.log(`  - Chapter Filter (lone column): ${chapTime.toFixed(2)} ms`);
      console.log(`  - Difficulty Filter (lone column): ${diffTime.toFixed(2)} ms`);
      console.log(`  - ILIKE Text Search: ${textTime.toFixed(2)} ms`);
      console.log(`  - Detail Retrieval (external_id): ${detailTime.toFixed(2)} ms`);
    }

    // Now test with proposed targeted indexes to measure exact improvements:
    console.log(`\n========================================================`);
    console.log(`TESTING TARGETED INDEXES ON 50,000 QUESTIONS`);
    console.log(`========================================================`);

    console.log('Adding INDEX on updated_at DESC...');
    const tIdxUpdate0 = performance.now();
    await client.query('CREATE INDEX bq_updated_at_idx ON benchmark_questions (updated_at DESC);');
    console.log(`Index created in ${(performance.now() - tIdxUpdate0).toFixed(1)} ms`);

    console.log('Adding standalone INDEX on chapter_id...');
    await client.query('CREATE INDEX bq_chapter_id_idx ON benchmark_questions (chapter_id);');

    console.log('Adding standalone INDEX on difficulty...');
    await client.query('CREATE INDEX bq_difficulty_idx ON benchmark_questions (difficulty);');

    await client.query('ANALYZE benchmark_questions;');

    const t0PageOpt = performance.now();
    await client.query('EXPLAIN ANALYZE SELECT * FROM benchmark_questions ORDER BY updated_at DESC LIMIT 20 OFFSET 0;');
    const pageOptTime = performance.now() - t0PageOpt;

    const t0ChapOpt = performance.now();
    await client.query(`EXPLAIN ANALYZE SELECT * FROM benchmark_questions WHERE chapter_id = '${sampleChapters[0]}'::uuid LIMIT 20;`);
    const chapOptTime = performance.now() - t0ChapOpt;

    const t0DiffOpt = performance.now();
    await client.query(`EXPLAIN ANALYZE SELECT * FROM benchmark_questions WHERE difficulty = 'HARD' LIMIT 20;`);
    const diffOptTime = performance.now() - t0DiffOpt;

    console.log(`Optimized results at 50,000 questions:`);
    console.log(`  - Page 1 with updated_at index: ${pageOptTime.toFixed(2)} ms`);
    console.log(`  - Chapter Filter with chapter_id index: ${chapOptTime.toFixed(2)} ms`);
    console.log(`  - Difficulty Filter with difficulty index: ${diffOptTime.toFixed(2)} ms`);

    // Clean up temporary benchmark table completely
    console.log('\nCleaning up benchmark table...');
    await client.query('DROP TABLE IF EXISTS benchmark_questions CASCADE;');
    console.log('Benchmark table dropped cleanly. Zero residual footprint.');

  } finally {
    await client.end();
  }
}

runScaleTest().catch(console.error);

