require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Admin Schema
const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const Admin = mongoose.model('Admin', adminSchema);

// Event Schema
const eventSchema = new mongoose.Schema({
    id: Number,
    title: String,
    date: String,
    time: String,
    location: String,
    price: Number,
    image: String,
    description: String,
    capacity: { type: Number, default: 50 },
    bookedCount: { type: Number, default: 0 }
});
const Event = mongoose.model('Event', eventSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
    receiptId: String,
    name: String,
    email: String,
    phone: String,
    eventId: Number, // Reference to event
    eventTitle: String,
    eventDate: String,
    amountDue: Number,
    bookingDate: { type: Date, default: Date.now }
});
const Booking = mongoose.model('Booking', bookingSchema);

// OTP Schema (with 5-minute TTL)
const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, expires: 300, default: Date.now }
});
const Otp = mongoose.model('Otp', otpSchema);

// Nodemailer Transporter Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Initial Data Seeding
const initialEvents = [
    {
        id: 1, title: "Tech Summit 2025", date: "2025-12-15", time: "09:00 AM", location: "Silicon Valley Convention Center", price: 299,
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
        description: "Join the biggest tech conference of the year. Network with industry leaders and discover the latest innovations.",
        capacity: 50, bookedCount: 0
    },
    {
        id: 2, title: "Music & Arts Festival", date: "2025-12-20", time: "04:00 PM", location: "Central Park Arena", price: 150,
        image: "https://binghamprospector.org/wp-content/uploads/2019/05/veld-music-festival-900x600.jpg",
        description: "A magical evening of live music, art installations, and gourmet food trucks under the stars.",
        capacity: 100, bookedCount: 0
    },
    {
        id: 3, title: "Startup Bootcamp", date: "2026-01-10", time: "10:00 AM", location: "Innovation Hub", price: 499,
        image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
        description: "Intensive 3-day workshop for aspiring entrepreneurs. Learn from successful founders and VCs.",
        capacity: 30, bookedCount: 0
    },
    {
        id: 4, title: "AI & Future Tech Expo", date: "2026-02-15", time: "09:00 AM", location: "Metropolis Convention Center", price: 350,
        image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
        description: "Explore the cutting edge of Artificial Intelligence and Robotics.",
        capacity: 200, bookedCount: 0
    },
    {
        id: 5, title: "Global Food Carnival", date: "2026-03-05", time: "11:00 AM", location: "Riverside Park", price: 50,
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
        description: "Taste dishes from around the world at this weekend-long culinary celebration.",
        capacity: 500, bookedCount: 0
    },
    {
        id: 6, title: "Indie Game Developers Meetup", date: "2026-03-20", time: "06:00 PM", location: "The Hive Co-working Space", price: 25,
        image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=800&q=80",
        description: "Connect with fellow developers, showcase your projects, and get feedback.",
        capacity: 40, bookedCount: 0
    }
];

// Seed Database Route (Run this once to populate DB)
app.get('/api/seed', async (req, res) => {
    try {
        await Event.deleteMany({});
        await Event.insertMany(initialEvents);

        await Admin.deleteMany({});
        const hashedPassword = await bcrypt.hash('password123', 10);
        await Admin.create({ username: 'admin', password: hashedPassword });

        // Also clear all bookings and OTPs so it is a true reset
        await Booking.deleteMany({});
        await Otp.deleteMany({});

        res.json({ message: "Database seeded successfully! All data reset." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided.' });

    const bearerToken = token.split(' ')[1];
    jwt.verify(bearerToken, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Failed to authenticate token.' });
        req.adminId = decoded.id;
        next();
    });
};

// Admin Login Route
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await Admin.findOne({ username });
        if (!admin) return res.status(404).json({ error: 'Admin not found.' });

        const passwordIsValid = await bcrypt.compare(password, admin.password);
        if (!passwordIsValid) return res.status(401).json({ error: 'Invalid password.' });

        const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: 86400 }); // 24 hours
        res.status(200).json({ auth: true, token: token });
    } catch (error) {
        res.status(500).json({ error: "Login failed" });
    }
});

// Admin Protected Routes for Events
app.post('/api/admin/events', verifyToken, async (req, res) => {
    try {
        const newEvent = new Event(req.body);
        await newEvent.save();
        res.status(201).json({ message: "Event created", event: newEvent });
    } catch (error) {
        res.status(500).json({ error: "Failed to create event" });
    }
});

app.put('/api/admin/events/:id', verifyToken, async (req, res) => {
    try {
        const updatedEvent = await Event.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json({ message: "Event updated", event: updatedEvent });
    } catch (error) {
        res.status(500).json({ error: "Failed to update event" });
    }
});

app.delete('/api/admin/events/:id', verifyToken, async (req, res) => {
    try {
        await Event.findOneAndDelete({ id: req.params.id });
        res.json({ message: "Event deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete event" });
    }
});

app.get('/api/admin/bookings', verifyToken, async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ bookingDate: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch bookings" });
    }
});

app.delete('/api/admin/bookings/:receiptId', verifyToken, async (req, res) => {
    try {
        const booking = await Booking.findOne({ receiptId: req.params.receiptId });
        if (!booking) return res.status(404).json({ error: "Booking not found" });

        const event = await Event.findOne({ id: booking.eventId });
        if (event && event.bookedCount > 0) {
            event.bookedCount -= 1;
            await event.save();
        }

        await Booking.findOneAndDelete({ receiptId: req.params.receiptId });
        res.json({ message: "Booking deleted and event capacity updated" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete booking" });
    }
});

// API Routes
app.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bookings/:receiptId', async (req, res) => {
    try {
        const booking = await Booking.findOne({ receiptId: req.params.receiptId });
        if (!booking) return res.status(404).json({ error: "Booking not found" });
        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send OTP Route
app.post('/api/otp/send', async (req, res) => {
    let { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    email = email.trim();

    // Generate 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        // Save to DB (overwrites existing OTP for this email if any)
        await Otp.deleteMany({ email });
        const newOtp = new Otp({ email, otp: generatedOtp });
        await newOtp.save();

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Gather&Go Verification Code',
            text: `Your verification code is: ${generatedOtp}. It will expire in 5 minutes.`
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error("OTP Send Error:", error);
        res.status(500).json({ error: "Failed to send OTP. Please check your email credentials." });
    }
});

// Save Booking Route
app.post('/api/bookings', async (req, res) => {
    try {
        const { name, email, phone, eventId, eventTitle, eventDate, amountDue, receiptId, otp } = req.body;

        // Validation
        const cleanEmail = email.trim();
        if (!name || !cleanEmail || !phone || !eventId || !otp) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        // Duplicate Check
        const existingBooking = await Booking.findOne({ email: cleanEmail, eventId });
        if (existingBooking) {
            return res.status(400).json({ error: "You have already registered for this event." });
        }

        // OTP Verification
        const validOtpRecord = await Otp.findOne({ email: cleanEmail, otp });
        if (!validOtpRecord) {
            return res.status(400).json({ error: "Invalid or expired OTP." });
        }

        // Inventory Check
        const event = await Event.findOne({ id: eventId });
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        if (event.bookedCount >= event.capacity) {
            return res.status(400).json({ error: "Event is sold out" });
        }

        const newBooking = new Booking(req.body);
        await newBooking.save();

        // Increment bookedCount
        event.bookedCount += 1;
        await event.save();

        // Clear the used OTP
        await Otp.deleteOne({ email });

        res.status(201).json({ message: "Booking saved successfully!", booking: newBooking });
    } catch (error) {
        res.status(500).json({ error: "Failed to save booking" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
