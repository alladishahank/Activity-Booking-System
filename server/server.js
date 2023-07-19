import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { query } from './db/db.js';
import crypto from 'crypto';
import session from 'express-session';
import { stat } from 'fs/promises';

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
  saveUninitialized: false
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

app.post('/newbooking.html', async function(req, res) {
});

app.get('/bookingdetails', function(req, res) {
  res.sendFile(path.join(templatesPath, 'booking-details.html'));
});

app.get('/searchResults', async function(req, res) {
  try {
    const activity = req.query.activitySearch;

    const searchForActivities = `
      SELECT name FROM activities WHERE similarity(name, $1) > 0.3
      ORDER BY similarity(name, $1) DESC`;
    const activityValues = [activity];
    const activityResult = await query(searchForActivities,activityValues);

    let exactActivity;
    if(activityResult.rows.length > 0){
      exactActivity = activityResult.rows[0].name;
    }
    else{
      exactActivity = activity;
    }

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
      res.render('searchResults', { facilitiesResult:facilitiesResult.rows, activity:activity, exactActivity:exactActivity });
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

app.get('/newBookingSearch', async function(req, res) {
  try {
    const facility = req.query.facilityName;
    const activity = req.query.activityName;
    const getFacilityDetails = 'SELECT address_line, city, state, country, postal_code, star_rating, description, contact_email, contact_phone, opening_hours, closing_hours FROM facilities WHERE name = $1';
    const values = [facility];
    const facilityDetailsResult = await query(getFacilityDetails, values);
    const facilityDetails = facilityDetailsResult.rows[0];

    res.render('newBookingSearch', { facilityDetails, facility, activity });
  } catch (error) {
    console.error('Error retrieving facility details:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/newBookingSearch', async function(req, res) {
  try {
    const userId = req.session.userId;
    console.log(userId);
    const activity = req.body.activity;
    const facility = req.body.facility;
    const date = req.body.date;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const groupSize = parseInt(req.body.group);

    const getActivityId = 'SELECT aid FROM activities WHERE name = $1';
    const activities = [activity];
    const aidResult = await query(getActivityId, activities);
    const aid = aidResult.rows[0].aid;

    const getFacilitiesId = 'SELECT fid FROM facilities WHERE name = $1';
    const facilities = [facility];
    const fidResult = await query(getFacilitiesId, facilities);
    const fid = fidResult.rows[0].fid;

    const getStatus = 'SELECT slots FROM facility_activity WHERE facility_id = $1 AND activity_id = $2';
    const statusValues = [fid, aid];
    const statusResult = await query(getStatus, statusValues);
    const slots = statusResult.rows[0].slots;

    const createNewBooking = 'INSERT INTO bookings (fid, aid, uid, booking_date, start_hour, end_hour, status, group_size) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
    const values = [fid, aid, userId, date, startTime, endTime, slots, groupSize];
    await query(createNewBooking, values);

    res.redirect('/index.html');
  } catch (error) {
    console.error('Error creating new booking:', error);
    res.status(500).send('Error creating new booking');
  }
});


app.get('/profile', function(req, res) {
  res.sendFile(path.join(templatesPath, 'profile.html'));
});

app.listen(3000, function () {
  console.log('Server is up and running on port 3000');
});
