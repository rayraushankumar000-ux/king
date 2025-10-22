import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const BOOKS_FILE = path.join(__dirname, 'books.json');
const PORT = process.env.PORT || 3000;

const DEFAULT_BOOKS = [
  { id: 1, title: 'Atomic Habits', author: 'James Clear', available: true },
  { id: 2, title: 'Deep Work', author: 'Cal Newport', available: false }
];

async function readBooksFile() {
  try {
    const data = await fs.readFile(BOOKS_FILE, 'utf8');
    try {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) throw new Error('books.json content is not an array');
      return parsed;
    } catch (err) {
      console.warn('books.json is corrupted or invalid JSON. Reinitializing with default data.');
      await writeBooksFile(DEFAULT_BOOKS);
      return DEFAULT_BOOKS;
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File doesn't exist — create it with defaults
      await writeBooksFile(DEFAULT_BOOKS);
      return DEFAULT_BOOKS;
    }
    throw err;
  }
}

async function writeBooksFile(books) {
  if (!Array.isArray(books)) throw new Error('books must be an array');
  const data = JSON.stringify(books, null, 2);
  await fs.writeFile(BOOKS_FILE, data, 'utf8');
}

function validateBookPayload(payload, forUpdate = false) {
  const { title, author, available } = payload || {};
  if (!forUpdate) {
    if (typeof title !== 'string' || title.trim() === '') return 'title is required and must be a non-empty string';
    if (typeof author !== 'string' || author.trim() === '') return 'author is required and must be a non-empty string';
    if (typeof available !== 'boolean') return 'available is required and must be a boolean';
  } else {
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) return 'title must be a non-empty string';
    if (author !== undefined && (typeof author !== 'string' || author.trim() === '')) return 'author must be a non-empty string';
    if (available !== undefined && typeof available !== 'boolean') return 'available must be a boolean';
  }
  return null;
}

// GET /books -> return all books
app.get('/books', async (req, res) => {
  try {
    const books = await readBooksFile();
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read books file' });
  }
});

// GET /books/available -> return only available books
app.get('/books/available', async (req, res) => {
  try {
    const books = await readBooksFile();
    const available = books.filter(b => b.available === true);
    res.json(available);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read books file' });
  }
});

// POST /books -> add a new book
app.post('/books', async (req, res) => {
  try {
    const error = validateBookPayload(req.body, false);
    if (error) return res.status(400).json({ error });

    const books = await readBooksFile();
    const maxId = books.reduce((max, b) => Math.max(max, b.id || 0), 0);
    const newBook = {
      id: maxId + 1,
      title: req.body.title.trim(),
      author: req.body.author.trim(),
      available: req.body.available
    };

    books.push(newBook);
    await writeBooksFile(books);

    res.status(201).json(newBook);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add book' });
  }
});

// PUT /books/:id -> update a book
app.put('/books/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

  try {
    const error = validateBookPayload(req.body, true);
    if (error) return res.status(400).json({ error });

    const books = await readBooksFile();
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Book not found' });

    const book = books[idx];
    if (req.body.title !== undefined) book.title = req.body.title.trim();
    if (req.body.author !== undefined) book.author = req.body.author.trim();
    if (req.body.available !== undefined) book.available = req.body.available;

    books[idx] = book;
    await writeBooksFile(books);

    res.json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// DELETE /books/:id -> delete a book
app.delete('/books/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

  try {
    const books = await readBooksFile();
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Book not found' });

    books.splice(idx, 1);
    await writeBooksFile(books);

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

app.get('/', (req, res) => res.send('Books API (ES Module) is running'));

module.exports = app;
