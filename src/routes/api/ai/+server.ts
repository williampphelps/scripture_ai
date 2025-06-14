import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import Surreal from 'surrealdb';

import { SURREAL_NS, SURREAL_DB, SURREAL_USERNAME, SURREAL_PASSWORD, SURREAL_URL, OLLAMA_URL } from "$env/static/private";


export const POST: RequestHandler = async ({ request }) => {
  const db = new Surreal();

  const { query, num_results, model } = await request.json();

  const embeddingsResponse = await fetch(OLLAMA_URL + "/api/embeddings", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      prompt: query,
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

  let embeddingParam = "mxbai-embed-large";

  if (model == "mxbai-embed-large") {
    embeddingParam = "embeddings.mxbai";
  } else if (model == "nomic-embed-text") {
    embeddingParam = "embeddings.nomicEmbedText";
  } else if (model == "bge-m3") {
    embeddingParam = "embeddings.bgeM3";
  } else if (model == "snowflake-arctic-embed") {
    embeddingParam = "embeddings.snowflakeArcticEmbed";
  }

  const result = await db.query("SELECT id, chapter.name as chapterName, chapter.book.name as bookName, chapter.summary as chapterSummary, chapter, content, number, vector::similarity::cosine(" + embeddingParam + ", $query_embeddings) as similarity FROM verse ORDER BY similarity DESC LIMIT $num_results;", {
    query_embeddings: embeddingsData.embedding,
    num_results: num_results
  });

  return json({ verses: result[0] });

}
