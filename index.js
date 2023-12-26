const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const User = require('./UserModel'); 
const Image = require('./ImageModel');
const UserSignup = require('./usersignup'); 
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('./mongos').connect();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extname = path.extname(file.originalname).toLowerCase();
    cb(null, 'mypic_' + uniqueSuffix + extname);
  },
});

const maxSize = 2 * 1000 * 100;

const upload = multer({
  storage: storage,
  limits: {
    fileSize: maxSize,
  },
  fileFilter: function (req, file, cb) {
    let filetypes = /jpeg|jpg/;
    let mintype = filetypes.test(file.mimetype);
    let extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mintype && extname) {
      return cb(null, true);
    }
    cb('error: file upload only following type' + filetypes);
  },
}).single('mypic');

app.use(express.static('uploads'));

app.get('/', (req, res) => {
  res.render('signup');
});

app.get("/home", (req, res) => {
  res.render("homepage");
});

app.get('/images', async (req, res) => {
  try {
    const images = await Image.find();
    res.render(path.join(__dirname, 'images'), { images });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.send('Error fetching images.');
  }
});

app.post('/upload', (req, res, next) => {
  upload(req, res, async function (err) {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).send('Error: File size is too large. Maximum size allowed is 200 KB.');
      } else {
        res.send(err);
      }
    } else {
      const newImage = new Image({
        uploadfiles: req.file.filename,
        filePath: req.file.path,
      });

      try {
        const savedImage = await newImage.save();
        console.log('Image information saved:', savedImage);
        res.send('Success. Image uploaded and information saved.');
      } catch (error) {
        console.error('Error saving image information:', error);
        res.send('Error saving image information.');
      }
    }
  });
});

app.post('/home', async (req, res) => {
  try {
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      password: req.body.password,
    });
    const savedUser = await newUser.save();
    console.log('User information saved:', savedUser);
    res.json({ success: true, message: 'User information saved successfully.', user: savedUser });
  } catch (error) {
    console.error('Error saving user information:', error);
    res.status(500).json({ success: false, message: 'Error saving user information.' });
  }
});
app.post('/signup', async (req, res) => {
  try {
    const newUser = new UserSignup({
      name: req.body.name,
      password: req.body.password,
    });

    const savedUser = await newUser.save();
    console.log('User information saved:', savedUser);
    res.json({ success: true, message: 'User information saved successfully.', user: savedUser });
  } catch (error) {
    console.error('Error saving user information:', error);
    res.status(500).json({ success: false, message: 'Error saving user information.' });
  }
});
app.post('/adminhome', async (req, res) => {
  try {
    const enteredName = req.body.name;
    const enteredPassword = req.body.password;

    const existingUser = await UserSignup.findOne({ name: enteredName, password: enteredPassword });

    if (existingUser) {
      
      const token = jwt.sign({ userId: existingUser._id, name: existingUser.name }, 'your_secret_key', {
        expiresIn: '1h', 
      });

      res.json({ success: true, message: 'Login successful.', user: existingUser, token });
    } else {
      res.status(401).json({ success: false, message: 'Invalid name or password.' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'Error during login.' });
  }
});



app.put('/userDetails/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, req.body, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: 'User updated successfully.', user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Error updating user.' });
  }
});

app.delete('/userDetails/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    await User.findByIdAndDelete(userId);
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Error deleting user.' });
  }
});

app.get('/userDetails', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "internal server error" });
  }
});

app.listen(8080, () => {
  console.log('Server is running on port 8080');
});
