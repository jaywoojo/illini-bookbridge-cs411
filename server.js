////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////
/** APP CONFIGURATION */
////////////////////////

//needed for log in, flash messages, and password hashing
const session = require('express-session');
const flash = require('express-flash');
const bcrypt = require('bcrypt');

require('dotenv').config()
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const connection = require('./database');

// set up ejs view engine 
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true }));

///////////////////
/** LOG IN STUFF */
///////////////////
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}));
app.use(flash());

// Custom middleware to make 'user' available in all EJS templates
app.use((req, res, next) => {
    // Make the 'user' variable available to all EJS templates
    res.locals.user = req.session.user || null; // Set 'user' to null if not authenticated
  
    next();
});
  

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
//const userEmail = 'jrjo2@illinois.edu';


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////
/** Signup/Login Stuff */
////////////////////////

app.get('/test', (req,res) => {
    console.log(req.session.user);
});

app.get('/logout', (req, res) => {
    // logout = destroy the current user session 
    req.session.destroy(err => {
      if (err) throw err;
      res.redirect('/login');
    });
});

app.get('/signup', (req, res) => {
    res.render('signup', { messages: req.flash('error') });
  });



app.get('/login', (req, res) => {
    res.render('login', { messages: req.flash('error') });
});

app.get('/profile2', (req, res) => {
    var user = req.session.user; //hm.....

    //if user is not logged in, redirect to log in page
    if (!user) {
      req.flash('error', 'Please log in first.');
      return res.redirect('/login');
    }

    res.render('profile2');
});   

app.post('/signup', (req, res) => {
    const { email, password } = req.body;
  
    //password hashing
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) throw err;

        const newUser = {
            illiniEmail: email,
            password: hashedPassword,
        };

        try {
            connection.query('INSERT INTO User SET ?', newUser, (err, result) => {
                if (err && err.code === 'ER_SIGNAL_EXCEPTION') {
                    const triggerErrorMessage = err.message;
                    //catching trigger error for email not ending in @illinos.edu
                    if (triggerErrorMessage.includes('Email does not end in @illinois.edu')) {
                        req.flash('error', 'Email does not end in @illinois.edu');
                    //catching trigger error for user already exists
                    } else if (triggerErrorMessage.includes('User with this email already exists')) {
                        req.flash('error', 'User with this email already exists');
                    } //else { req.flash('error', 'Failed to sign up.'); }
                    return res.redirect('/signup');
                }

                //if (err) throw err;
                
                req.session.user = newUser;
                req.flash('success', 'Sign up success!');
                res.redirect('/profile2');
            });
            } catch (err) {
            // sql database errors
                console.error('SQL Insert Error:', err);
                //req.flash('error', 'Failed to sign up. Please try again.');
                res.redirect('/signup');
            }

    });
});

app.post('/login', (req, res) => {
    //const user = req.session.user;
    const { email, password } = req.body;
  
    connection.query('SELECT * FROM User WHERE illiniEmail = ?', [email], (err, results) => {
      if (err) throw err;
  
      if (results.length === 0) {
        req.flash('error', 'User not found. Please sign up first.');
        return res.redirect('/signup');
      }
  
      const user = results[0];

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) throw err;
  
        if (!isMatch) {
          req.flash('error', 'Incorrect password. Please try again.');
          return res.redirect('/login');
        }
  
        // set req.session if login success
        req.session.user = user;
        req.flash('success', 'Login success! Edit your profile here.');
        res.redirect('/profile2');
      });
    });
});

app.post('/profile2', (req, res) => {
    //const userEmail = 'aakasterld@illinois.edu';
    const user = req.session.user;

    const { firstName, lastName, gender, introduction } = req.body;

    //update user details in mysql database
    connection.query(
        'UPDATE User SET firstName=?, lastName=?, gender=?, introduction=? WHERE illiniEmail=?',
        [firstName, lastName, gender, introduction, user.illiniEmail],
        (error, results) => {
            if (error) {
                console.error('Error updating user information:', error);
                //redirect?
                return;
            }
            // redirect back to profile page after updating
            console.log("updated user info");
            res.render('/profile2');
        }
    );
});


app.post('/updateProfile', (req, res) => {
    const { firstName, lastName, gender, introduction } = req.body;
    const user = req.session.user;

    //update user with new data
    user.firstName = firstName;
    user.lastName = lastName;
    user.gender = gender;
    user.introduction = introduction;

    //update user in sql database
    connection.query(
        'UPDATE User SET firstName = ?, lastName = ?, gender = ?, introduction = ? WHERE illiniEmail = ?',
        [firstName, lastName, gender, introduction, user.illiniEmail],
        (err, results) => {
            if (err) throw err;

            //redirect back to profile
            req.flash('success', 'Profile updated successfully!');
            res.redirect('/profile2');
        }
    );
});

////////////////////////////////////////////////////////
/** Connections and /view-profile module pop up stuff */
////////////////////////////////////////////////////////

app.get('/connections', (req, res) => {

    var user = req.session.user; //hm.....

    //if user is not logged in, redirect to log in page
    if (!user) {
      req.flash('error', 'You need to log in first before favoriting a book.');
      return res.redirect('/login');
    }

    connection.query('CALL UserMatching(?)', [user.illiniEmail], (error, results) => {
        if (error) {
            console.error('Error calling stored procedure:', error);
            return;
        }
        const users = results[0];
        res.render('connections', { users });
    });
});

app.post('/view-profile', (req, res) => {
    var user = req.session.user;

    const illiniEmail = req.body.illiniEmail;
    //if user is not logged in, redirect to log in page
    if (!user) {
        req.flash('error', 'Please log in first.');
        return res.redirect('/login');
    }
  

    //get user details from mysql
    const query = 'SELECT * FROM User WHERE illiniEmail = ?';
    connection.query(query, [illiniEmail], (error, results) => {
        if (error) {
            console.error('Error fetching user details:', error);
            //res.status(500).json({ error: 'Error fetching user details' });
        } else if (results.length === 0) {
            //res.status(404).json({ error: 'User not found' });
        } else {
            const user = results[0];
            res.json(user); // return the user's details as a JSON response
        }
    });
});



///////////////////
/** GET Requests */
///////////////////
//home
app.get('/', (req, res) => {
    res.render('home');
});

// //book-result
// app.get('/book-result', (req, res) => {
//     res.render("book-result");
// });

//book-search
app.get('/book-search', (req, res) => {
    res.render("book-search");
});

//favorite-books
app.get('/favorite-books', (req, res) => {

    var user = req.session.user; //hm.....

    //if user is not logged in, redirect to log in page
    if (!user) {
      req.flash('error', 'You need to log in first before viewing your favorite books.');
      return res.redirect('/login');
    }

    connection.query(`SELECT * FROM likes JOIN (SELECT title, bookId FROM Book) AS Book2 ON (likes.bookID = Book2.bookId) WHERE email = "${user.illiniEmail}"`, (error, results) => { //outputs bookID, email, title, bookId
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

//best books authors
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
//book-search-form
app.post('/book-search-form', function(req, res) {
    //res.render("book-result", {book_title: req.body.book_title, book_author: req.body.book_author});

    var title = req.body.book_title;
    var author = req.body.book_author;

    //book information query
    connection.query(`SELECT * FROM Book NATURAL JOIN writtenBy NATURAL JOIN Statistics WHERE authorName = "${author}" AND title = "${title}" ORDER BY bbeScore DESC LIMIT 1`, (error, results) => {
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

app.post('/favorite-button', (req, res) => {
// Get the title and authorName from the POST request body
    const { bookId } = req.body;
    //console.log('bookId:', bookId);
    //var email = "jrjo2@illinois.edu";
    //var email = userEmail;


    var user = req.session.user; //hm.....

    //Test if user is logged in. If not, redirect back to log in.
    if (!user) {
      req.flash('error', 'You need to log in first before favoriting a book.');
      return res.redirect('/login');
    }

    //var sql = `INSERT INTO likes (email, bookID) VALUES('${email}','${bookId}')`;
    var sql = `INSERT INTO likes (email, bookID) VALUES('${user.illiniEmail}','${bookId}')`;

    console.log(sql);
    connection.query(sql, function(err, result) {
      if (err) {
        res.send(err)
        return;
      }
      //req.flash('success', 'Added to likes shelf!');
      //not working bc of redirecting issues from book-search-form -> book-result.   res.redirect('/book-result');
      //res.json({ success: true, message: 'Added to likes shelf!' });
      res.redirect('favorite-books');
    });
});

app.delete("/deleteBook/:bookID", (req, res) => {
    const bookID = req.params.bookID;
    //var email = "jrjo2@illinois.edu";
    //var email = userEmail;
    var user = req.session.user;
    email = user.illiniEmail;

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


/////////////////////////////////////////
/** Old Alan's profile stuff no longer using */
/////////////////////////////////////////
/** 
profile. no longer using.
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

profile. no longer using.
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
*/