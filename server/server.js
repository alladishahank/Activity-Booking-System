import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { query } from './db/db.js';
import crypto from 'crypto';
import session from 'express-session';

const app = express();
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const templatesPath = path.join(__dirname, '../templates');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const generateSecretKey = () => {
  const secret = crypto.randomBytes(32).toString('hex');
  return secret;
};
const secretKey = generateSecretKey();

app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: true
}));

app.get('/register', function (req, res) {
  res.sendFile(path.join(templatesPath, 'register.html'));
});

app.post('/register', async function (req, res) {
  try {
    const { email, username, password, confirmpassword } = req.body;

    if (email === '' || username === '' || password === '' || confirmpassword === '') {
      res.render("register", { errorMsg: "Do not leave the input fields empty" });
      return;
    }

    if (password !== confirmpassword) {
      res.render("register", { errorMsg: "Passwords do not match" });
      return;
    }

    const checkUserQuery = 'SELECT * FROM users WHERE email = $1';
    const checkUserValues = [email];

    const existingUser = await query(checkUserQuery, checkUserValues);
    if (existingUser.rows.length > 0) {
      res.render("register", { errorMsg: "Email already exists" });
      return;
    }

    const newUserQuery = 'INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id';
    const newUserValues = [email, username, password];

    const result = await query(newUserQuery, newUserValues);
    const userId = result.rows[0].id;

    req.session.userId = userId; 

    console.log('Registration successful');
    res.redirect('/index.html');
  } 
  catch (err) {
    console.error('Error executing query:', err);
    res.render("alert", { errorMsg: "Error registering user" });
  }
});

app.get('/login', function (req, res) {
  res.sendFile(path.join(templatesPath, 'login.html'));
});

app.post('/login', async function (req, res) {
  const { email, password } = req.body;
  if (email === '' || password === '') {
    res.render("login", { errorMsg: "Do not leave the input fields empty" });
    return;
  }

  const userQuery = 'SELECT * FROM users WHERE email = $1';
  const values = [email];

  try {
    const result = await query(userQuery, values);
    if (result.rows.length > 0) {
      const stored_password = result.rows[0].password;
      const username = result.rows[0].username;
      const userId = result.rows[0].id;

      if (stored_password !== password) {
        res.render("login", { errorMsg: "Incorrect Password" });
      } 
      else {
        req.session.userId = userId; 

        res.redirect('/index.html');
      }
    } 
    else {
      res.render("login", { errorMsg: "Email doesn't exist" });
    }
  } 
  catch (err) {
    console.error('Error executing query:', err);
    res.status(500).send("Error logging in");
  }
});

app.get('/index.html', async function (req, res) {
  try {
    const userId = req.session.userId; 
    if (!userId) {
      res.redirect('/login'); 
      return;
    }

    const getUserDetails = "SELECT * FROM users WHERE id = $1";
    const values = [userId];

    const currentUser = await query(getUserDetails, values);
    if (currentUser.rows.length > 0) {
      const username = currentUser.rows[0].username;

      const getUserBookings = "select * from bookings where uid = $1";
      const bookingValues = [userId];

      const userBookings = await query(getUserBookings, bookingValues);
      const facilities = [];
      const activities = [];
      for (var i = 0; i < userBookings.rows.length; i++) {
        const facility = await query("select name from facilities where fid = $1", [userBookings.rows[i].fid]);
        const activity = await query("select name from activities where aid = $1", [userBookings.rows[i].aid]);
      
        facilities.push(facility.rows[0].name); 
        activities.push(activity.rows[0].name); 
      }
      res.render("index", { name: username, userBookings: userBookings.rows, facilities: facilities, activities: activities});
    } 
    else {
      res.render("alertLogin", { errorMsg: "User not found" });
    }
  } catch (error) {
    console.error("Error executing query:", error);
    res.render("alertLogin", { errorMsg: "Error retrieving user bookings" });
  }
});


app.post('/index.html', async function (req, res) {
  
});

app.get('/newbooking.html', async function(req, res) {
  try {
    const result = await query('SELECT * FROM activities');
    const activities = result.rows.map(row => row.name);
    res.render('newbooking', { activities });
  } 
  catch (error) {
    console.error('Error retrieving activities:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/newbooking', async function(req, res) {
});

app.get('/bookingdetails', function(req, res) {
  res.sendFile(path.join(templatesPath, 'booking-details.html'));
});

app.get('/searchResults', async function(req, res) {
  try {
    const activity = req.query.activitySearch;
    const searchForFacilities = `
    SELECT f.name AS facility_name, f.address_line, f.city, f.state, f.country, f.postal_code, f.star_rating
    FROM facilities f
    INNER JOIN facility_activity fa ON f.fid = fa.facility_id
    INNER JOIN activities a ON fa.activity_id = a.aid
    WHERE similarity(a.name, $1) > 0.3
    ORDER BY similarity(a.name, $1) DESC`;
    const values = [activity];

    const facilitiesResult = await query(searchForFacilities, values);
    if(facilitiesResult.rows.length > 0)
    {
      res.render('searchResults', { facilitiesResult:facilitiesResult.rows, activity:activity });
    }
    else
    {
      res.render('searchResultFailed',{ activity:activity });
    }
   
  } catch (error) {
    console.error('Error retrieving facilities:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/searchResults', function(req,res){

});


app.get('/profile', function(req, res) {
  res.sendFile(path.join(templatesPath, 'profile.html'));
});

app.listen(3000, function () {
  console.log('Server is up and running on port 3000');
});
