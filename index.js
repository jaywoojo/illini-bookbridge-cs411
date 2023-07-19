require('dotenv').config()

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const connection = require('./database');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');


app.get('/', (req, res) => {
    res.render('home');
});


app.get('/profile', (req, res) => {
    const userEmail = 'aakasterld@illinois.edu';

    connection.query('SELECT illiniEmail, firstName, lastName, gender, introduction FROM User WHERE illiniEmail = ?', [userEmail], (error, results) => {
        if (error) {
            console.error('Error retrieving user information:', error);
            // Handle the error appropriately, e.g., show an error page or redirect
            return;
        }

        const user = results[0]; // Assuming you expect a single user as the result
        res.render('profile', { user });
    });
});

app.get('/awards', (req, res) => {
    connection.query(
        "SELECT * FROM `Award`",
        (error, results, fields) => {
            if (error) throw error;
            res.json(results);
        }
    );
});

app.get('/users', (req, res) => {
    connection.query(
        "SELECT * FROM `User`",
        (error, results, fields) => {
            if (error) throw error;
            res.json(results);
        }
    );
});

// Use port 8080 by default, unless configured differently in Google Cloud
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`App is running at: http://localhost:${port}`);
});