import { loadBooks, saveBooks } from '../store.js';

/**
 * Retourne une page du catalogue, avec recherche optionnelle sur le titre.
 * @param {{ page: number, limit: number, q?: string }} options
 */
export async function listBooks({ page, limit, q }) {
  const books = await loadBooks();

  let result = books;
  if (q) {
    result = result.filter((book) => book.title.toLowerCase().includes(q.toLowerCase()));
  }

  const total = result.length;
  const offset = page * limit;
  const items = result.splice(offset, limit);

  return { page, limit, total, items };
}

/**
 * Retourne uniquement les livres encore disponibles a l'emprunt.
 */
export async function listAvailableBooks() {
  const books = loadBooks();

  return books.filter((book) => book.stock > 0);
}

/**
 * Retrouve un livre par son identifiant.
 * @param {string|number} id
 */
export async function getBookById(id) {
  const books = await loadBooks();

  return books.find((book) => book.id === id);
}

/**
 * Ajoute un livre au catalogue.
 * @param {{ title: string, author: string, stock: number }} payload
 */
export async function createBook(payload) {
  const books = await loadBooks();

  const book = {
    id: books.length + 1,
    title: payload.title,
    author: payload.author,
    stock: payload.stock,
  };

  books.push(book);
  await saveBooks(books);

  return book;
}

/**
 * Supprime un livre du catalogue.
 * @param {string|number} id
 * @returns {Promise<boolean>} true si un livre a bien ete supprime
 */
export async function deleteBook(id) {
  const books = await loadBooks();
  const index = books.findIndex((book) => book.id === Number(id));

  if (index === -1) {
    return false;
  }

  books.splice(index, 1);
  await saveBooks(books);

  return true;
}
