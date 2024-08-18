const mongoose = require('mongoose');
const cron = require('node-cron');
const express = require('express');
const cors = require('cors');

// Define your Mongoose schema and model
const Schema = mongoose.Schema;

const dataSchema = new Schema({
    name: String,
    registerNo: String,
    gender: String,
    graduate: Boolean,
    hsc: String,
    myambition: String,
    dept: String,
    dob: Date,
    date: String,
    arr: [String],
    lastUpdated: Date
});

const DataModel = mongoose.model('Data', dataSchema);

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
const mongooseConnect = async () => {
    try {
        await mongoose.connect('mongodb+srv://<username>:<password>@cluster0.altz4n8.mongodb.net/user?retryWrites=true&w=majority', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Db connected');
    } catch (err) {
        console.error('Database connection error:', err);
    }
};

// Define your routes
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
        timeZone: 'Asia/Kolkata' // Adjust as needed
    };

    const formattedTime = date.toLocaleString('en-US', options);
    
    const { name, registerNo, gender, graduate, hsc, myambition, dept, dob, arr } = req.body;

    const response = new DataModel({ 
        name, 
        registerNo, 
        gender, 
        graduate, 
        hsc, 
        myambition, 
        dept, 
        dob, 
        date: formattedTime, 
        arr, 
        lastUpdated: Date.now() 
    });

    try {
        await response.save();
        res.status(201).json({ message: 'Data saved successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

app.put('/update/:id', async (req, res) => {
    const id = req.params.id;
    const { arr } = req.body;

    try {
        const response = await DataModel.updateOne(
            { _id: id },
            { arr: arr, lastUpdated: Date.now() }
        );
        res.send('updated');
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

app.get('/get', async (req, res) => {
    try {
        const response = await DataModel.find({});
        res.json({ response });
    } catch (err) {
        res.status(500).send({ message: 'Error retrieving documents', error: err.message });
    }
});

app.post('/score', async (req, res) => {
    const { title, score } = req.body;
    try {
        const ScoreModel = mongoose.model('Score', new Schema({ title: String, score: Number }));
        const response = new ScoreModel({ title, score });
        await response.save();
        res.send('score saved');
    } catch (err) {
        res.status(400).send({ message: 'Error saving score', error: err.message });
    }
});

app.post('/deleteAll', async (req, res) => {
    try {
        // Delete all documents in the collection
        const result = await DataModel.deleteMany({});

        if (result.deletedCount > 0) {
            res.status(200).send({ message: 'All documents deleted successfully', data: result });
        } else {
            res.status(404).send({ message: 'No documents found to delete' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Error deleting documents', error: error.message });
    }
});

// Schedule the job
const scheduleJob = async () => {
    try {
        const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
        console.log('One hour ago:', oneHourAgo.toISOString());

        // Find and delete documents with empty arrays and older than 1 hour
        const result = await DataModel.deleteMany({
            arr: { $size: 0 },
            lastUpdated: { $lt: oneHourAgo }
        });

        console.log(`Deleted ${result.deletedCount} documents`);
    } catch (err) {
        console.error('Error running scheduled job:', err);
    }
};

// Schedule the job to run every hour
cron.schedule('0 * * * *', scheduleJob);

// Start the server
mongooseConnect().then(() => {
    app.listen(5000, () => console.log('Server running on port 5000'));
});
