const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 8000;
// Middleware
app.use(cors());
app.use(express.json());

// DB Connection
mongoose.connect(MONGO_URI)
.then(() => console.log('MongoDB connected!'))
.catch((err) => console.error('MongoDB error:', err));

// Routes placeholder
app.get('/', (req, res) => res.send('Clinic Backend Running...'));

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
