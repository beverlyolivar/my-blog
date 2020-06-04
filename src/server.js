import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/build')));

const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useUnifiedTopology: true });
        const db = client.db('my-blog');

        await operations(db);

        client.close();
    } catch(error) {
        res.status(500).json({ message: 'Error connecting to db', error});
    };
}


// Helper function that connects to DB
app.get('/api/articles/:name', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        const articlesInfo = await db.collection('articles').findOne({ name: articleName});
        res.status(200).json(articlesInfo);
    }, res);
})

// This is a post request that upvotes our articles post(pathParams, return(req,res))
app.post('/api/articles/:name/upvote', async (req,res) => {
    
    withDB(async (db) => {
        const articleName = req.params.name;

        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName },
           {
               '$set': {
                upvotes: articleInfo.upvotes + 1,
                },
           });
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(articleInfo);
    }, res);

});

// Post request to add comments
app.post('/api/articles/:name/add-comment', (req, res) => {
    const { username, text } = req.body;        // Recall here we are using destructuring to get the props we want from the req body
    const articleName = req.params.name;

    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({ name: articleName});
        await db.collection('articles').updateOne({ name: articleName },
            {
                '$set': {
                    comments: articleInfo.comments.concat({ username, text}),
                },
            });
            const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });

            res.status(200).json(updatedArticleInfo);
    }, res);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(8000, () => console.log('Listening on port 8000'));