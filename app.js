import app from './api/index.js';

const port = process.env.PORT || 3000;

// app.js run only on development mode, so the if is not needed anymore
//if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Sample app listening at http://localhost:${port}`);
    });
//}
