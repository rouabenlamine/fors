import pool from '@/lib/db';
import { upsertToChroma } from '@/lib/chroma';

/**
 * Sync SQL validated incidents to ChromaDB for semantic search
 */
export async function syncIncidentsToChroma() {
  console.log('[Sync] Starting validated incidents sync to ChromaDB...');
  
  try {
    const [rows] = await pool.execute(`
      SELECT 
        v.id,
        v.incident_number,
        v.incident_description,
        v.final_solution,
        a.root_cause,
        a.resolution_steps
      FROM validated_incidents v
      LEFT JOIN ai_analysis a ON a.id = v.analysis_id
    `) as any;

    const items = (rows as any[]).map(row => ({
      id: `incident_${row.id}`,
      content: `Problem: ${row.incident_description}\nRoot Cause: ${row.root_cause}\nSolution: ${row.final_solution}\nSteps: ${row.resolution_steps}`,
      metadata: {
        number: row.incident_number,
        type: 'validated_incident',
        db_id: row.id
      }
    }));

    if (items.length > 0) {
      await upsertToChroma('validated_incidents', items);
      console.log(`[Sync] Successfully indexed ${items.length} incidents.`);
    } else {
      console.log('[Sync] No incidents found to index.');
    }
  } catch (err) {
    console.error('[Sync] Error syncing incidents:', err);
  }
}

/**
 * Sync predefined queries
 */
export async function syncQueriesToChroma() {
  try {
    const [rows] = await pool.execute(`
      SELECT id, name, description, category, \`sql\`
      FROM predefined_queries
      WHERE isActive = 1
    `) as any;

    const items = (rows as any[]).map(row => ({
      id: `query_${row.id}`,
      content: `Query Name: ${row.name}\nDescription: ${row.description}\nCategory: ${row.category}\nSQL: ${row.sql}`,
      metadata: {
        type: 'predefined_query',
        category: row.category,
        db_id: row.id
      }
    }));

    if (items.length > 0) {
      await upsertToChroma('predefined_queries', items);
      console.log(`[Sync] Successfully indexed ${items.length} predefined queries.`);
    }
  } catch (err) {
    console.error('[Sync] Error syncing queries:', err);
  }
}
