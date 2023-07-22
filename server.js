////////////////////////
/** APP CONFIGURATION */
////////////////////////
require('dotenv').config()

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const connection = require('./database');

// set up ejs view engine 
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true }));

//var mysql = require('mysql2');
//var path = require('path');

//parses req and res variables
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + '../public'));

/** SQL Connection 
var connection = mysql.createConnection ({
    host: '34.27.185.4',
    user: 'root',
    password: 'test1234',
    database: 'bookbridge'
});
connection.connect;
*/

/** GLOBAL VARIABLE FOR NOW */
const userEmail = 'jrjo2@illinois.edu';

///////////////////
/** GET Requests */
///////////////////
//home
app.get('/', (req, res) => {
    res.render('home');
});

//book-result
app.get('/book-result', (req, res) => {
    res.render("book-result");
});

//book-search
app.get('/book-search', (req, res) => {
    res.render("book-search");
});

//favorite-books
app.get('/favorite-books', (req, res) => {

    connection.query(`SELECT * FROM likes WHERE email = "${userEmail}"`, (error, results) => {
        if (error) {
            console.error('Error retrieving book information:', error);
            return;
        }
        
        //console.log(results[0]);
        //res.json(results);
        const jsonData = ({ likes: results});
        //res.json(jsonData);
        res.render("favorite-books", {data: jsonData} );
    });

    //res.render("favorite-books");
});

//profile
app.get('/profile', (req, res) => {
    //const userEmail = 'aakasterld@illinois.edu';
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

//book-search-form
app.post('/book-search-form', function(req, res) {
    //res.render("book-result", {book_title: req.body.book_title, book_author: req.body.book_author});

    var title = req.body.book_title;
    var author = req.body.book_author;

    //book information query
    connection.query(`SELECT * FROM Book NATURAL JOIN writtenBy WHERE authorName = "${author}" AND title = "${title}" ORDER BY bbeScore DESC LIMIT 1`, (error, results) => {
        if (error) {
            console.error('Error retrieving book information:', error);
            return;
        }
        const bookResult = results[0]
        const bookId = results[0].bookId; //get bookId from the user search

        //find awards won
        connection.query(`SELECT awardName FROM won WHERE bookId = "${bookId}";`, (error2, results) =>{
            if (error) {
                console.error('Error retrieving book information:', error);
                return;
            }
           const awardResult = results
           //find genres book has
           connection.query(`SELECT genreName FROM hasGenre WHERE bookId = "${bookId}";`, (error3, results) =>{
                if (error) {
                    console.error('Error retrieving book information:', error);
                    return;
                }
                const genreResult = results;
                const jsonData = ({ bookResults: bookResult, awardResult: awardResult, genreResult: genreResult});
                res.render("book-result", {data: jsonData} );

           });    
        });

    });

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

////////////////////
/** POST Requests */
////////////////////
app.post('/favorite-button', (req, res) => {
// Get the title and authorName from the POST request body
    const { bookId } = req.body;
    //console.log('bookId:', bookId);

    //var email = "jrjo2@illinois.edu";
    var email = userEmail;
    bookId2 = "jay-testing-bookId";
    var sql = `INSERT INTO likes (email, bookID) VALUES('${email}','${bookId}')`;

    console.log(sql);
    connection.query(sql, function(err, result) {
      if (err) {
        res.send(err)
        return;
      }
      res.redirect('/success');
    });
});

app.delete("/deleteBook/:bookID", (req, res) => {
    const bookID = req.params.bookID;
    //var email = "jrjo2@illinois.edu";
    var email = userEmail;
    
    var sql = `DELETE FROM likes WHERE email='${email}' AND bookID='${bookID}';`
    console.log(sql);
    connection.query(sql, function(err, result) {
        if (err) {
            res.send(err)
            return res.status(500).json({ error: "Failed to delete the book!!!!!!" });
        }
        
        //res.redirect('/success');
        return res.sendStatus(200);
    });
});


app.post('/profile', (req, res) => {
    //const userEmail = 'aakasterld@illinois.edu';
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


///////////
/** Port */
///////////
/** 
app.listen(80, function () {
    console.log('Node app is running on port 80');
});  */
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`App is running at: http://localhost:${port}`);
});




/** MERGED_BRANCH OLD CONTENT
//GET and render likes page
app.get('/likes', (req, res) => {
    res.render('likes'); //render likes page
});

//GET and render findbook
app.get('/findbook', (req, res) => {
    res.render('findbook');
});

//GET book info from user searching with findbook page
app.get('/bookinfo', (req, res) => {
    var author = req.query.author;
    var title = req.query.title;

    //book information query
    connection.query(`SELECT * FROM Book NATURAL JOIN writtenBy 
    WHERE authorName LIKE "%${author}%" AND title LIKE "%${title}%" 
    LIMIT 1`, (error, results) => {
        if (error) {
            console.error('Error retrieving book information:', error);
            return;
        }
        const bookResult = results[0]
        const bookId = results[0].bookId; //get bookId from the user search

        //find awards won
        connection.query(`SELECT awardName FROM won WHERE bookId = "${bookId}";`, (error2, results) =>{
            if (error) {
                console.error('Error retrieving book information:', error);
                return;
            }
           const awardResult = results
           //find genres book has
           connection.query(`SELECT genreName FROM hasGenre WHERE bookId = "${bookId}";`, (error3, results) =>{
                if (error) {
                    console.error('Error retrieving book information:', error);
                    return;
                }
                const genreResult = results
                //output results for each query
                res.json({ bookResults: bookResult, awardResult: awardResult, genreResult: genreResult});
           });    
        });

    });
});

//executed when a user clicks the like button
app.post('/likeBook', function(req, res) {
  var email = req.body.email;
  var bookid = req.body.bookid;
  var sql = `INSERT INTO likes (email, bookID) VALUES('${email}','${bookid}')`;

  console.log(sql);
  connection.query(sql, function(err, result) {
    if (err) {
      res.send(err)
      return;
    }
    res.redirect('/success');
  });
});


//executed when a user clicks the unlike button
app.post('/unlikeBook', function(req, res) {
  var bookid = req.body.bookid;
  var email = req.body.email;
  var sql = `DELETE FROM likes WHERE email='${email}' AND bookID='${bookid}';`

  console.log(sql);
  connection.query(sql, function(err, result) {
    if (err) {
      res.send(err)
      return;
    }
    res.redirect('/success');
  });
});

//easy way to check likes table was updated
app.get('/checklikes', (req, res) => {
    connection.query('SELECT * FROM likes', (error, results) => {
        if (error) {
            console.error('Error retrieving likes information:', error);
            // Handle the error appropriately, e.g., show an error page or redirect
            return;
        }
        res.json(results);
    });
});


// GET home page, respond by rendering index.ejs 
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

//when table is updated sucessfully
app.get('/success', function(req, res) {
      res.send({'message': 'Likes table updated successfully!'});
});

// Use port 8080 by default, unless configured differently in Google Cloud
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`App is running at: http://localhost:${port}`);
});
*/