import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import Surreal from 'surrealdb';

import { SURREAL_NS, SURREAL_DB, SURREAL_USERNAME, SURREAL_PASSWORD, SURREAL_URL, OLLAMA_URL } from "$env/static/private";


export const GET: RequestHandler = async ({ request }) => {
  const db = new Surreal();

  try {

    await db.connect(SURREAL_URL + '/rpc', {
      namespace: SURREAL_NS,
      database: SURREAL_DB,
      auth: {
        username: SURREAL_USERNAME,
        password: SURREAL_PASSWORD,
        namespace: SURREAL_NS
      }
    });

    const result = await db.query("SELECT * FROM work");


    return json({ works: result[0] });
  } catch (e) {
    console.error(e);
    return new Response('An error occurred', { status: 500 });
  }



}
