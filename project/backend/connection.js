// const mongoose = require('mongoose');
// mongoose.connect('mongodb+srv://vgate608:vgate608@cluster0.28pmwtc.mongodb.net/user?retryWrites=true&w=majority&appName=Cluster0')
//   .then(() => console.log('Connected!'))
//   .catch((err)=>console.error("MongoDB connection error:",err))
  

const mongoose = require('mongoose');
require('dotenv').config();

const mongoURL = process.env.MONGO_URL;

// Validate MongoDB URL exists
if (!mongoURL) {
    console.error('Error: MONGO_URL is not defined in environment variables');
    process.exit(1);
}

mongoose.connect(mongoURL)
    .then(() => {
        console.log('Connected to MongoDB successfully!');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Optional: Connection event handlers
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to database');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Mongoose connection closed due to app termination');
    process.exit(0);
});

module.exports = mongoose.connection;
