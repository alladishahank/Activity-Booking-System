import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { query } from './db/db.js';

const app = express();
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const templatesPath = path.join(__dirname, '../templates');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine","ejs");

app.get('/index.html', function(req, res) {
  res.sendFile(path.join(templatesPath, 'index.html'));
});

app.get('/register', function(req, res) {
  res.sendFile(path.join(templatesPath, 'register.html'));
});

app.post('/register', async function(req, res) {
  console.log("Post request received");
  const result = await query('SELECT current_database()');
  console.log('Connected to database:', result.rows[0].current_database);
  const { email, username, password, confirmpassword } = req.body;

  if (email === '' || username === '' || password === '' || confirmpassword === '') {
    res.render("alert",{errorMsg: "Do not leave the input fields empty"})
    return;
  }

  if (password !== confirmpassword) {
    res.render("alert",{errorMsg: "Passwords do not match"})
    return;
  }  

  const checkUserQuery = 'SELECT * FROM users WHERE email = $1';
  const checkUserValues = [email];

  try {
    const existingUser = await query(checkUserQuery, checkUserValues);
    if (existingUser.rows.length > 0) {
      res.render("alert",{errorMsg:"Email already exists"});
      return;
    }

    const newUserQuery = 'INSERT INTO users (email, username, password) VALUES ($1, $2, $3)';
    const newUserValues = [email, username, password];

    await query(newUserQuery, newUserValues);
    console.log('Registration successful');
    res.render('index',{name: username});
  } catch (err) {
    console.error('Error executing query:', err);
    res.render("alert",{errorMsg: "Error registering user"});
  }
});

app.get('/login', function(req, res) {
  res.sendFile(path.join(templatesPath, 'login.html'));
});

app.post('/login', async function(req, res) {
  const { email, password } = req.body;
  if (email === '' || password === '') {
    res.render("alertLogin",{errorMsg: "Do not leave the input fields empty"});
    return;
  }

  const userQuery = 'SELECT * FROM users WHERE email = $1';
  const values = [email];

  try {
    const result = await query(userQuery, values);
    if(result.rows.length > 0)
    {
      const stored_password = result.rows[0].password;
      const username = result.rows[0].username;
      if(stored_password !== password)
      {
        res.render("alertLogin",{errorMsg: "Incorrect Password"});
      }
      else
      {
        res.render('index',{name: username});
      }
    }
    else
    {
      res.render("alertLogin",{errorMsg: "Email doesn't exist"});
    }
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).send("Error logging in");
  }
});

app.listen(3000, function() {
  console.log('Server is up and running on port 3000');
});
