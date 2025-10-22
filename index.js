const express = require('express');
const app = express();

// Sample data
const BookStore = [
  { id: 1, name: "Harry Potter", author: "J.K Rawling" },
  { id: 2, name: "Rich Dad Poor Dad", author: "Robert Kiyosaki" },
  { id: 3, name: "Physcilogy of Money", author: "N/A" },
  { id: 4, name: "October Junction", author: "Prakash" },
  { id: 5, name: "Musafir Cafe", author: "Prakash" }
];

// Middleware
app.use(express.json());

// Get all books or filter by author
app.get('/book', (req, res) => {
  const { author } = req.query;
  if (author) {
    const book = BookStore.filter(info => info.author === author);
    res.json(book);
  } else {
    res.json(BookStore);
  }
});

// Get a book by ID
app.get("/book/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const book = BookStore.find(info => info.id === id);
  if (book) res.json(book);
  else res.status(404).send("Book not found");
});

// Add a new book
app.post("/book", (req, res) => {
  const exists = BookStore.some(b => b.id === req.body.id);
  if (exists) {
    res.send("Already Available");
  } else {
    BookStore.push(req.body);
    res.send("Data saved Successfully");
  }
});


app.use("/", (req, res)=>{
    res.send("This is BookStore Dashboard. for getting all the Books goto /book.\n if you want specifc book /book/id ( id=1,2,3,4).\n you can add the book also /book route only but you need to use Post method");
})


module.exports = app;
