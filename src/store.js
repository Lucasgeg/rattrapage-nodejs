import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'data', 'books.json');

// Le catalogue est charge une seule fois puis garde en memoire (cache applicatif).
let cache = null;

/**
 * Charge le catalogue depuis le disque.
 * @returns {Promise<Array>} la liste des livres
 */
export async function loadBooks() {
  if (cache === null) {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    cache = JSON.parse(raw);
  }

  return cache;
}

/**
 * Persiste le catalogue sur le disque.
 * @param {Array} books
 */
export async function saveBooks(books) {
  cache = books;
  await fs.writeFile(DATA_FILE, `${JSON.stringify(books, null, 2)}\n`, 'utf8');
}
