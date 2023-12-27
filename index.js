const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s1bw0ez.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();





   
    const productsCollection = client.db("oldenGoodsDB").collection("products");
    const categoryCollection = client.db("oldenGoodsDB").collection("category");
    const reviewsCollection = client.db("oldenGoodsDB").collection("userReview");
    const usersCollection = client.db("oldenGoodsDB").collection("users");
    const buyerProductsCollection = client.db("oldenGoodsDB").collection("buyerProducts");



    
    // Category Get API
    app.get('/category',async(req,res)=>{
      const result = await categoryCollection.find().toArray();
      res.send(result)
    });
   // reviews Get API
   app.get('/userReview',async(req,res)=>{
      const result = await reviewsCollection.find().toArray();
      res.send(result)
   });

   



    // Products related API
    app.post('/products',async(req,res)=>{
      const product = req.body;
      const result =await productsCollection.insertOne(product);
      res.send(result);
  });
  app.get('/products',async(req,res)=>{
    const filter = req.query
    const options ={
        sort :{
            date : 1
        }
    };
    const cursor = productsCollection.find(filter,options);
    const result =await cursor.toArray();
    res.send(result);
});
    app.get('/products/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await productsCollection.findOne(query);
      res.send(result);
  });
   app.get('/products', async (req,res)=>{
     let query = {}
     if(req.query?.email){
        query = {email : req.query.email}
     }
     const result = await productsCollection.find(query).toArray();
     res.send(result);
  });
  app.delete('/products/:id', async(req,res)=>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await productsCollection.deleteOne(query);
    res.send(result);
});




  // USER relate API
    app.post('/users',async(req,res)=>{
    const user = req.body;
    const query ={email: user.email}
    const existingUser = await usersCollection.findOne(query);
    if(existingUser){
      return res.send({message: 'This User already exists', insertedId : null})
    }
    const result = await usersCollection.insertOne(user);
    res.send(result);
  });




    
  // buyerProducts related api or CART relsted
      app.post('/buyerProduct',async(req,res)=>{
      const cartItem = req.body;
      const result = await buyerProductsCollection.insertOne(cartItem);
       res.send(result);
   });
      app.get('/buyerProduct',async(req,res)=>{
      let query = {}
      if(req.query?.email){
      query = {email : req.query.email}
    }
      const result = await buyerProductsCollection.find(query).toArray();
      res.send(result);
   });
   app.delete('/buyerProduct/:id',async(req,res)=>{
     const id = req.params.id;
     const query = {_id : new ObjectId(id)}
     const result = await buyerProductsCollection.deleteOne(query);
     res.send(result)
   });







    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/',(req,res)=>{
    res.send('Olden good website is running');
})
app.listen(port,()=>{
    console.log(`Olden goods website is running on port ${port}`)
})