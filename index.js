const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
//user this or get error in heroku
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// verifyJWT  login token function 
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        console.log('decoded', decoded)
        req.decoded = decoded;
        next();

    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.irqio.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const servicesCollection = client.db("genius-car").collection("services");
        const ordersCollection = client.db("genius-car").collection("orders");

        // AUTH //

        app.post('/login', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            })
            res.send(token)
        })

        /////////////////////////
        // services section API//
        /////////////////////////

        // get all services
        app.get('/service', async (req, res) => {
            const query = {}
            const cursor = servicesCollection.find(query)
            const services = await cursor.toArray();
            res.send(services)
        })

        // get service by id
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const service = await servicesCollection.findOne(query)
            res.send(service);
        })

        //post 
        app.post('/service', async (req, res) => {
            const newService = req.body
            const result = await servicesCollection.insertOne(newService)
            res.send(result)
        })

        //delete service 
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await servicesCollection.deleteOne(query)
            res.send(result)
        })

        ////////////////////////
        //  order section API // 
        ////////////////////////

        //post to  add order
        app.post('/order', async (req, res) => {
            const order = req.body
            const result = await ordersCollection.insertOne(order)
            res.send(result)
        })

        // get orders 
        app.get('/order', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email
            const email = req.query.email
            if (email === decodedEmail) {
                const query = { email: email }
                const cursor = ordersCollection.find(query)
                const result = await cursor.toArray()
                res.send(result)
            }
            else {
                return res.status(403).send({ message: 'Forbidden access' })
            }
        })
    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('running port');
})

app.listen(port, () => {
    console.log('listening to port', port);
})