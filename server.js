const express = require('express');
const mongoose = require('mongoose');

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", 'https://quotterr.netlify.app');
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Api-Key, X-Requested-With, Content-Type, Accept, Authorization")
  next();
})

// Create a Quote schema
const quoteSchema = mongoose.Schema({
  quote: String,
  author: String,
  likes: Number,
  userName: String,
  email: String,
  date: String,
  likedBy: [{ type: String, unique: true }],
});

// Create a Quote model
const Quote = mongoose.model('Quote', quoteSchema);

// Get all quotes
app.get('/api/quotes', async (req, res) => {
  try {
    const quotes = await Quote.find();
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Add a new quote
app.post('/api/quotes', async (req, res) => {
  const { quote, author, likes, userName, email } = req.body;

  const userQuoteCount = await Quote.countDocuments({ email: email });
  const maxQuotesAllowed = 3;

  if (userQuoteCount >= maxQuotesAllowed) {
    return res.status(400).json({ error: 'You have reached the maximum limit of quotes allowed.' });
  }

  try {
    // Set the date to the current date
    const currentDate = new Date();
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Istanbul',
    };
    const formattedDate = currentDate.toLocaleDateString('en-GB', options);

    const newQuote = new Quote({ quote, author, likes, userName, email, date: formattedDate });
    await newQuote.save();
    res.status(201).json(newQuote);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Like the quote
app.post('/api/quotes/like', async (req, res) => {
  const { quoteId, userEmail } = req.body;

  try {
    const quote = await Quote.findById(quoteId);

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Check if the user has already liked the quote
    if (quote.likedBy.includes(userEmail)) {
      return res.status(400).json({ error: 'You have already liked this quote' });
    }

    // Update the likes and likedBy fields
    quote.likes += 1;
    quote.likedBy.push(userEmail);

    // Save the updated quote
    await quote.save();

    res.status(200).json({ message: 'Quote liked successfully', likes: quote.likes });
  } catch (error) {
    console.error('Error liking quote:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;

// MongoDB connection
const uri = "mongodb+srv://eaygun178:eAQloZfTR2zF8xMf@cluster0.4czqwrj.mongodb.net/quotter?retryWrites=true&w=majority";
mongoose.set("strictQuery", false)
mongoose.connect(uri)
.then(() => {
    console.log('connected to MongoDB')
    app.listen(PORT, ()=> {
        console.log(`Node API app is running on port 3000`)
    });
}).catch((error) => {
    console.log(error)
})