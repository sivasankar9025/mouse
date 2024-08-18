const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

const app = express();
app.use(express.json());
app.use(cors());

// Mongoose Schema Definition
const MySchema = new mongoose.Schema({
    name: String,
    registerNo: String,
    gender: String,
    graduate: String,
    hsc: String,
    myambition: String,
    dept: String,
    dob: Date,
    date: String,
    arr: [String], // Define `arr` as an array of strings
    lastUpdated: { type: Date, default: Date.now }
});

const model = mongoose.model('MyModel', MySchema);

// Mongoose Connection
const mongooseConnect = async () => {
    try {
        await mongoose.connect('mongodb+srv://pssm9025528322:9025528322@cluster0.altz4n8.mongodb.net/user?retryWrites=true&w=majority&appName=Cluster0', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Db connected');
    } catch (err) {
        console.error('Database connection error:', err);
    }
};

// POST Route to Save Data
app.post('/post', async (req, res) => {
    const date = new Date();
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata' // Change this to your time zone
    };

    const formattedTime = date.toLocaleString('en-US', options);
    const { name, registerNo, gender, graduate, hsc, myambition, dept, dob, arr } = req.body;

    const response = new model({
        name,
        registerNo,
        gender,
        graduate,
        hsc,
        myambition,
        dept,
        dob,
        date: formattedTime,
        arr, // Store array in the document
        lastUpdated: Date.now()
    });

    try {
        await response.save();
        res.status(201).json({ message: 'Data saved successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// PUT Route to Update Data
app.put('/update/:id', async (req, res) => {
    const id = req.params.id;
    const { arr } = req.body;

    try {
        const response = await model.updateOne(
            { _id: id },
            { arr: arr, lastUpdated: Date.now() }
        );
        res.send('updated');
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// GET Route to Retrieve Data
app.get('/get', async (req, res) => {
    try {
        const response = await model.find({});
        res.json({ response });
    } catch (err) {
        res.status(500).send({ message: 'Error retrieving documents', error: err.message });
    }
});

// POST Route to Save Score Data (assuming another schema exists for this)
app.post('/score', async (req, res) => {
    const { title, score } = req.body;
    try {
        const response = new scoremodel({ title, score });
        await response.save();
        res.send('score saved');
    } catch (err) {
        res.status(400).send({ message: 'Error saving score', error: err.message });
    }
});

// POST Route to Delete All Documents
app.post('/deleteAll', async (req, res) => {
    try {
        const result = await model.deleteMany({});

        if (result.deletedCount > 0) {
            res.status(200).send({ message: 'All documents deleted successfully', data: result });
        } else {
            res.status(404).send({ message: 'No documents found to delete' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Error deleting documents', error: error.message });
    }
});

// Scheduled Job to Delete Old Documents
const scheduleJob = async () => {
    try {
        const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago

        const result = await model.deleteMany({
            arr: { $size: 0 },
            lastUpdated: { $lt: oneHourAgo }
        });

        console.log(`Deleted ${result.deletedCount} documents`);
    } catch (err) {
        console.error('Error running scheduled job:', err);
    }
};

// Schedule the job to run every 1 hour
cron.schedule('0 * * * *', scheduleJob);

// Start Mongoose Connection and Express Server
mongooseConnect();

app.listen(5000 || process.env.PORT, () => console.log('Port connected'));
