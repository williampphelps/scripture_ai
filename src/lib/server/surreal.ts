import { SURREAL_URL, SURREAL_USERNAME, SURREAL_PASSWORD, SURREAL_NS, SURREAL_DB } from '$env/static/private';

import Surreal from "surrealdb";

interface DBConfig {
    url: string;
    user: string;
    pass: string;
    namespace: string;
    database: string;
}

const DEFAULT_CONFIG: DBConfig = {
    url: SURREAL_URL,
    user: SURREAL_USERNAME,
    pass: SURREAL_PASSWORD,
    namespace: SURREAL_NS,
    database: SURREAL_DB
}

let db: Surreal | null = null;

export async function getDb(config: DBConfig = DEFAULT_CONFIG): Promise<Surreal> {

    if (db) {
        return db;
    }

    db = new Surreal();

    try {
        await db.connect(config.url, {
            namespace: config.namespace,
            database: config.database,
            auth: {
                username: config.user,
                password: config.pass,
                namespace: config.namespace,
            }
        });
        return db;
    } catch (err) {
        console.error("Failed to connect to SurrealDB:", err);
        await db.close();
        db = null;
        throw err;
    }
}