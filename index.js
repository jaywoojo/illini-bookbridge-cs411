require('dotenv').config()

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const connection = require('./database');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.render('home');
});

app.get('/profile', (req, res) => {
    const userEmail = 'aakasterld@illinois.edu';
    const editing = req.query.edit === 'true';

    connection.query('SELECT illiniEmail, firstName, lastName, gender, introduction FROM User WHERE illiniEmail = ?', [userEmail], (error, results) => {
        if (error) {
            console.error('Error retrieving user information:', error);
            // Handle the error appropriately, e.g., show an error page or redirect
            return;
        }

        const user = results[0]; // Assuming you expect a single user as the result
        res.render('profile', { user, editing });
    });
});

app.post('/profile', (req, res) => {
    const userEmail = 'aakasterld@illinois.edu';
    const { firstName, lastName, gender, introduction } = req.body;

    // Perform the SQL query to update the user information in the database
    connection.query(
        'UPDATE User SET firstName=?, lastName=?, gender=?, introduction=? WHERE illiniEmail=?',
        [firstName, lastName, gender, introduction, userEmail],
        (error, results) => {
            if (error) {
                console.error('Error updating user information:', error);
                // Handle the error appropriately, e.g., show an error page or redirect
                return;
            }
            // Redirect the user back to the profile page after the update
            res.redirect('/profile');
        }
    );
});


app.get('/best', (req, res) => {
    const topBooksQuery = 'SELECT title, rating, COUNT(awardName) as numAwards FROM Book JOIN Statistics USING(bookId) JOIN won USING(bookId) GROUP BY bookId, rating ORDER BY rating DESC, numAwards DESC LIMIT 15';
    const topAuthorsQuery = 'SELECT authorName, COUNT(awardName) AS numAwards FROM Book JOIN writtenBy USING(bookId) JOIN won USING(bookId) GROUP BY authorName ORDER BY COUNT(awardName) DESC LIMIT 15';

    connection.query(topBooksQuery, (error1, results1) => {
        if (error1) {
            console.error('Error executing query 1:', error1);
            // Handle the error appropriately, e.g., show an error page or redirect
            return;
        }

        connection.query(topAuthorsQuery, (error2, results2) => {
            if (error2) {
                console.error('Error executing query 2:', error2);
                // Handle the error appropriately, e.g., show an error page or redirect
                return;
            }

            const topBooks = results1;
            const topAuthors = results2;

            res.render('best', { topBooks, topAuthors });
        });
    });
});


// Use port 8080 by default, unless configured differently in Google Cloud
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`App is running at: http://localhost:${port}`);
});