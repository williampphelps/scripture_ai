import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { getDb } from "$lib/server/surreal";
import { RecordId } from "surrealdb";

import { OLLAMA_URL } from "$env/static/private";

export const POST: RequestHandler = async ({ request }) => {
  const db = await getDb();

  const { query, num_results, selected_works } = await request.json();

  // ensure query is not empty
  if (!query) {
    return new Response('Query cannot be empty', { status: 400 });
  }


  // ensure num_results is an integer and is greater than 0 and less than 1000
  if (!Number.isInteger(num_results) || num_results <= 0 || num_results > 1000) {
    return new Response('Invalid num_results', { status: 400 });
  }

  // sanitize query
  const sanitizedQuery = query.replace(/[^a-zA-Z0-9\s]/g, '');



  const embedQuery = "search_query: " + sanitizedQuery;


  try {
    const embeddingsResponse = await fetch(OLLAMA_URL + "/api/embed", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "nomic-embed-text",
        input: embedQuery
      })
    });
    const embeddingsData = await embeddingsResponse.json();

    const workRecords = selected_works.map((w: string) => new RecordId(w.split(':')[0], w.split(':')[1]));

    // loop through selected works
    const results = await db.query("SELECT id, chapter.name as chapterName, chapter.book.name as bookName, chapter.summary as chapterSummary, chapter, content, number, chapter.slug as chapterSlug, chapter.book.slug as bookSlug, chapter.book.work.slug as workSlug FROM verse WHERE work IN $work_records AND embeddings.nomicEmbedTextPrefix <|" + num_results + "|> $query_embeddings;", {
      query_embeddings: embeddingsData.embeddings[0],
      work_records: workRecords,
    });


    return json({ verses: results[0] });
  } catch (e) {
    console.error(e);
    return new Response('An error occurred', { status: 500 });
  }



}
