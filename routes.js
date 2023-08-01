// routes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('./db');

// Register route
router.post('/register', (req, res) => {
  const { username, password } = req.body;

  // Hash the password
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;

    const user = {
      username: username,
      password: hash,
    };

    // Save user to the database
    db.query('INSERT INTO users SET ?', user, (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Error registering user' });
      } else {
        res.status(200).json({ message: 'User registered successfully' });
      }
    });
  });
});

// Login route
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Check if user exists
  db.query('SELECT * FROM users WHERE username = ?', username, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error finding user' });
    } else {
      if (results.length === 0) {
        res.status(401).json({ error: 'User not found' });
      } else {
        // Compare passwords
        bcrypt.compare(password, results[0].password, (err, match) => {
          if (err) throw err;
          if (match) {
            req.session.user = username;
            res.status(200).json({ message: 'Login successful' });
          } else {
            res.status(401).json({ error: 'Invalid password' });
          }
        });
      }
    }
  });
});