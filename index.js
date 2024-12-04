const express = require('express');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory storage
let articles = [];
let index = {
    keywords: {}, // keyword -> [article IDs]
    tags: {},     // tag -> [article IDs]
};

// Helper function to update the index
const updateIndex = (article, articleId) => {
    const { title, content, tags } = article;
    const keywords = [...new Set([...title.split(' '), ...content.split(' ')])];

    keywords.forEach((keyword) => {
        if (!index.keywords[keyword]) index.keywords[keyword] = [];
        index.keywords[keyword].push(articleId);
    });

    tags.forEach((tag) => {
        if (!index.tags[tag]) index.tags[tag] = [];
        index.tags[tag].push(articleId);
    });
};

// Add Article Endpoint
app.post('/articles', (req, res) => {
    const { title, content, tags } = req.body;
    const article = {
        id: articles.length + 1,
        title,
        content,
        tags,
        date: new Date(),
    };

    articles.push(article);
    updateIndex(article, article.id);

    res.status(201).json({ message: 'Article added!', article });
});

// Search Articles Endpoint
app.get('/articles/search', (req, res) => {
    const { keyword, tag, sortBy } = req.query;
    let results = [];

    if (keyword) {
        results = (index.keywords[keyword] || []).map((id) =>
            articles.find((a) => a.id === id)
        );
    } else if (tag) {
        results = (index.tags[tag] || []).map((id) =>
            articles.find((a) => a.id === id)
        );
    }

    if (sortBy === 'relevance' && keyword) {
        results.sort(
            (a, b) =>
                (b.title.split(keyword).length - 1 +
                    b.content.split(keyword).length - 1) -
                (a.title.split(keyword).length - 1 +
                    a.content.split(keyword).length - 1)
        );
    } else if (sortBy === 'date') {
        results.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    res.json(results);
});

// Get Article by ID
app.get('/articles/:id', (req, res) => {
    const { id } = req.params;
    const article = articles.find((a) => a.id === parseInt(id));
    if (!article) return res.status(404).json({ message: 'Article not found!' });
    res.json(article);
});

// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
