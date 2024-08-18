const mongoose = require('mongoose');
const { model } = require('./schema');
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

const app = express();
app.use(express.json());
app.use(cors());

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

app.post('/post', async (req, res) => {
    try {
        const date = new Date();
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata' // Ensure correct time zone
        };
        const formattedTime = date.toLocaleString('en-US', options);

        const { name, registerNo, gender, graduate, hsc, myambition, dept, dob, arr } = req.body;

        // Ensure `arr` is an array, even if it's a string
        const arrArray = Array.isArray(arr) ? arr : arr.split(',').map(item => item.trim());

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
            arr: arrArray, // Store the array
            lastUpdated: Date.now()
        });

        await response.save();
        res.status(201).send(response);
    } catch (error) {
        res.status(500).send({ error: 'Failed to store data' });
    }
});


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

app.get('/get', async (req, res) => {
    try {
        const response = await model.find({});
        res.json({ response });
    } catch (err) {
        res.status(500).send({ message: 'Error retrieving documents', error: err.message });
    }
});

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

app.post('/deleteAll', async (req, res) => {
    try {
        // Delete all documents in the collection
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

const scheduleJob = async () => {
    try {
        const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000); // 1 minute ago

        // Find and delete documents with empty arrays and older than 1 minute
        const result = await model.deleteMany({
            arr: { $size: 0 },
            lastUpdated: { $lt: oneMinuteAgo }
        });

        console.log(`Deleted ${result.deletedCount} documents`);
    } catch (err) {
        console.error('Error running scheduled job:', err);
    }
};

// Schedule the job to run every minute
cron.schedule('* * * * *', scheduleJob);

mongooseConnect();

app.listen(5000 || process.env.PORT, () => console.log('Port connected'));
