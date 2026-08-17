import { loadBooks, saveBooks } from '../store.js';
import { HttpError } from '../lib/httpError.js';

// Les emprunts ne sont pas persistes : ils vivent le temps du process.
const loans = [];

/**
 * Liste les emprunts en cours.
 */
export function listLoans() {
  return loans;
}

/**
 * Enregistre un emprunt et decremente le stock du livre concerne.
 * @param {{ bookId: string|number, member: string }} payload
 */
export async function createLoan({ bookId, member }) {
  if (!member) {
    throw new HttpError(400, 'member est requis');
  }

  const books = await loadBooks();
  const book = books.find((item) => item.id === Number(bookId));

  if (!book) {
    throw new HttpError(404, `Livre ${bookId} introuvable`);
  }

  if (book.stock <= 0) {
    throw new HttpError(409, `Le livre "${book.title}" n'est plus disponible`);
  }

  book.stock -= 1;
  await saveBooks(books);

  const loan = {
    id: loans.length + 1,
    bookId: book.id,
    member,
    borrowedAt: new Date().toISOString(),
  };

  loans.push(loan);

  return loan;
}
