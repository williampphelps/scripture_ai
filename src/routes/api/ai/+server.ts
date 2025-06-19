import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import Surreal from 'surrealdb';

import { SURREAL_NS, SURREAL_DB, SURREAL_USERNAME, SURREAL_PASSWORD, SURREAL_URL, OLLAMA_URL } from "$env/static/private";


export const POST: RequestHandler = async ({ request }) => {
  const db = new Surreal();

  const { query, num_results } = await request.json();

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
    const embeddingsResponse = await fetch(OLLAMA_URL + "/api/embeddings", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "nomic-embed-text",
        prompt: embedQuery,
        stream: false
      })
    });
    const embeddingsData = await embeddingsResponse.json();

    await db.connect(SURREAL_URL + '/rpc', {
      namespace: SURREAL_NS,
      database: SURREAL_DB,
      auth: {
        username: SURREAL_USERNAME,
        password: SURREAL_PASSWORD,
        namespace: SURREAL_NS
      }
    });

    const result = await db.query("SELECT id, chapter.name as chapterName, chapter.book.name as bookName, chapter.summary as chapterSummary, chapter, content, number, vector::similarity::cosine(embeddings.nomicEmbedTextPrefix, $query_embeddings) as similarity, chapter.slug as chapterSlug, chapter.book.slug as bookSlug, chapter.book.work.slug as workSlug FROM verse WHERE embeddings.nomicEmbedTextPrefix <|" + num_results + "|> $query_embeddings ORDER BY similarity DESC;", {
      query_embeddings: embeddingsData.embedding
    });

    // console.log(result);

    return json({ verses: result[0] });
  } catch (e) {
    console.error(e);
    return new Response('An error occurred', { status: 500 });
  }



}
