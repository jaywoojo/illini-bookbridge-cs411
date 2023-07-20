require('dotenv').config()

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const connection = require('./database');

// set up ejs view engine 
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

//parses req and res variables
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + '../public'));

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


/* GET home page, respond by rendering index.ejs */
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

//when table is updated sucessfully
app.get('/success', function(req, res) {
      res.send({'message': 'Likes table updated successfully!'});
});



// Use port 8080 by default, unless configured differently in Google Cloud
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`App is running at: http://localhost:${port}`);
});