import dotenv from 'dotenv';
dotenv.config({ path: 'api/.env' });
import pg from 'pg';
import { normalizeDatabaseConnectionString } from '../src/prisma/prisma.service.js';

const connectionString = normalizeDatabaseConnectionString(process.env.DATABASE_URL!);

async function main() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log('='.repeat(80));
  console.log('PHASE 4: DATABASE MIGRATION & PROPOSED INDEX AUDIT');
  console.log('='.repeat(80));

  try {
    // 1. Existing indexes audit
    console.log('\n--- 1. CURRENT INDEXES ON TARGET TABLES ---');
    const existing = await client.query(`
      SELECT tablename, indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename IN ('questions', 'institution_memberships')
      ORDER BY tablename, indexname;
    `);
    console.table(existing.rows.map(r => ({
      Table: r.tablename,
      Index: r.indexname,
      Definition: r.indexdef,
    })));

    // 2. Query 1: questions ORDER BY updated_at DESC LIMIT 20
    console.log('\n--- 2. AUDIT: questions_updated_at_desc_idx ---');
    console.log('Query: SELECT id, external_id, updated_at FROM questions ORDER BY updated_at DESC LIMIT 20;');
    
    // Baseline EXPLAIN
    const plan1Base = await client.query(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
      SELECT id, external_id, updated_at FROM questions ORDER BY updated_at DESC LIMIT 20;
    `);
    const json1Base = plan1Base.rows[0]['QUERY PLAN'][0];
    console.log(`Baseline Plan: ${json1Base['Plan']['Node Type']} | Execution Time: ${json1Base['Execution Time']} ms`);

    // In-transaction testing of proposed index
    await client.query('BEGIN;');
    await client.query('CREATE INDEX test_questions_updated_at_desc_idx ON questions (updated_at DESC);');
    const plan1Opt = await client.query(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
      SELECT id, external_id, updated_at FROM questions ORDER BY updated_at DESC LIMIT 20;
    `);
    const json1Opt = plan1Opt.rows[0]['QUERY PLAN'][0];
    console.log(`With Index:    ${json1Opt['Plan']['Node Type']} | Execution Time: ${json1Opt['Execution Time']} ms`);
    await client.query('ROLLBACK;'); // Rollback index creation cleanly!

    // 3. Query 2: questions WHERE chapter_id = $1
    console.log('\n--- 3. AUDIT: questions_chapter_id_idx ---');
    console.log('Existing index is: (course_subject_id, chapter_id) composite');
    console.log('Query: SELECT id, external_id, chapter_id FROM questions WHERE chapter_id = \'00000000-0000-0000-0000-000000000000\'::uuid LIMIT 20;');
    
    const plan2Base = await client.query(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
      SELECT id, external_id, chapter_id FROM questions WHERE chapter_id = '00000000-0000-0000-0000-000000000000'::uuid LIMIT 20;
    `);
    const json2Base = plan2Base.rows[0]['QUERY PLAN'][0];
    console.log(`Baseline Plan: ${json2Base['Plan']['Node Type']} | Execution Time: ${json2Base['Execution Time']} ms`);

    await client.query('BEGIN;');
    await client.query('CREATE INDEX test_questions_chapter_id_idx ON questions (chapter_id);');
    const plan2Opt = await client.query(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
      SELECT id, external_id, chapter_id FROM questions WHERE chapter_id = '00000000-0000-0000-0000-000000000000'::uuid LIMIT 20;
    `);
    const json2Opt = plan2Opt.rows[0]['QUERY PLAN'][0];
    console.log(`With Index:    ${json2Opt['Plan']['Node Type']} | Execution Time: ${json2Opt['Execution Time']} ms`);
    await client.query('ROLLBACK;');

    // 4. Query 3: institution_memberships WHERE status = 'PENDING' ORDER BY updated_at DESC LIMIT 20
    console.log('\n--- 4. AUDIT: institution_memberships_status_updated_idx ---');
    console.log('Existing index is: (status)');
    console.log('Query: SELECT id, status, updated_at FROM institution_memberships WHERE status = \'PENDING\' ORDER BY updated_at DESC LIMIT 20;');
    
    const plan3Base = await client.query(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
      SELECT id, status, updated_at FROM institution_memberships WHERE status = 'PENDING' ORDER BY updated_at DESC LIMIT 20;
    `);
    const json3Base = plan3Base.rows[0]['QUERY PLAN'][0];
    console.log(`Baseline Plan: ${json3Base['Plan']['Node Type']} | Execution Time: ${json3Base['Execution Time']} ms`);

    await client.query('BEGIN;');
    await client.query('CREATE INDEX test_im_status_updated_idx ON institution_memberships (status, updated_at DESC);');
    const plan3Opt = await client.query(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
      SELECT id, status, updated_at FROM institution_memberships WHERE status = 'PENDING' ORDER BY updated_at DESC LIMIT 20;
    `);
    const json3Opt = plan3Opt.rows[0]['QUERY PLAN'][0];
    console.log(`With Index:    ${json3Opt['Plan']['Node Type']} | Execution Time: ${json3Opt['Execution Time']} ms`);
    await client.query('ROLLBACK;');

    console.log('\nAudit complete. All rollback transactions finalized. Zero permanent schema mutations made.');
  } finally {
    await client.end();
  }
}

main().catch(console.error);
