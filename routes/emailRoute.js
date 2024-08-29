const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const mongoose = require('mongoose');
const User = require('../model/user'); // Adjust the path to your User model

const router = express.Router();

// Set up multer for file uploads with memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/send-email', upload.single('file'), async (req, res) => {
  const { username, email, number, address, userId } = req.body;
  const file = req.file; // The uploaded file

  console.log('Received data:', { username, email, number, address });
  console.log('Received file:', file ? file.originalname : 'No file uploaded');

  // Validate the incoming data
  if (!username || !email || !number || !address) {
    console.error('Error: Missing required fields');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Find the user by email and update the selfDeclaration field
  try {
    const user = await User.findOneAndUpdate(
      { userId: userId },
      { selfDeclaration: true },
      { new: true } // Return the updated document
    );

    if (!user) {
      console.error('Error: User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User selfDeclaration updated:', user);

    // Create a transporter object using SMTP
    let transporter = nodemailer.createTransport({
      service: 'gmail', // Use the email service you prefer (e.g., 'gmail')
      auth: {
        user: 'hussainfaizan1379@gmail.com', // Your email address
        pass: 'cjit qnly ytex pfvj' // Your email password (should be stored securely)
      }
    });

    // Define email options
    let mailOptions = {
      from: 'hussainfaizan1379@gmail.com', // Sender address
      to: "hr@fucturicatechnologies.com", // Send the email to the address received in req.body
      subject: `Declaration details of ${username}`, // Subject line
      text: `Hello,

Here are the details submitted by ${username}:

Username: ${username}
Email: ${email}
Number: ${number}
Address: ${address}

Please find the attached document.

Thank you!`,
      attachments: file ? [{
        filename: file.originalname,
        content: file.buffer // Attach the file directly from memory
      }] : [] // Attach the file if it exists
    };

    // Send the email
    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);

    res.status(200).json({ message: 'Email sent successfully and selfDeclaration updated!' });

  } catch (error) {
    console.error('Error sending email or updating user:', error);
    res.status(500).json({ message: 'Error sending email or updating user', error });
  }
});

module.exports = router;
