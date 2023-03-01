const router = require("express").Router();
const User = require("../models/User");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");

//REGISTER
router.post("/register", async (req, res) => {
  const newUser = new User({
    username: req.body.username,
    email: req.body.email,
    password: CryptoJS.AES.encrypt(
      req.body.password,
      process.env.PASS_SEC
    ).toString(),
  });

  try {
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

//LOGIN

router.post('/login', async (req, res) => {
    let responseSent = false;
  
    try {
      // find the user
      const user = await User.findOne({ username: req.body.username });
      if (!user) {
        // send a response and set the flag to true
        res.status(401).json("Wrong User Name");
        responseSent = true;
      } 
    
  
      // decrypt the password and compare it with the input password
      const hashedPassword = CryptoJS.AES.decrypt(user.password, process.env.PASS_SEC);
      const originalPassword = hashedPassword.toString(CryptoJS.enc.Utf8);
      const inputPassword = req.body.password;
      
      if (originalPassword !== inputPassword) {
        // send a response if one has not already been sent
        if (!responseSent) {
          res.status(401).json("Wrong Password" + req.body.username);
          responseSent = true;
        }
      }
  
      // generate and send the access token if one has not already been sent
      if (!responseSent) {
        const accessToken = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SEC, { expiresIn: "3d" });
        const { password, ...others } = user._doc;
        res.status(200).json({ ...others, accessToken });
      }
    } catch (err) {
      // send an error response if one has not already been sent
      if (!responseSent) {
        res.status(500).json(err);
      }
    }
  });

module.exports = router;