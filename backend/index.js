const express = require('express');
const bodyParser = require('body-parser');
const { DuckDuckGoSearch } = require('@langchain/community/tools/duckduckgo_search');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: "https://ecoshield-three.vercel.app"
  }));

// app.use(cors())


// Create DuckDuckGo search tool
const duckDuckGoTool = new DuckDuckGoSearch({ maxResults: 5 });

// Search endpoint
app.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const searchResults = await duckDuckGoTool.invoke(query);
    
    return res.json({ results: searchResults });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'An error occurred during the search' });
  }
});

// Simple GET endpoint for testing
app.get('/', (req, res) => {
  res.send('DuckDuckGo Search API is running! Send POST requests to /search');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});