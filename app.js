import app from './api/index.js';

const port = process.env.PORT || 3000;

// Removed to be complaint with Vercel deploying - just kept for development target
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Sample app listening at http://localhost:${port}`);
    });
}
