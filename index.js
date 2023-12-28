const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
var jwt = require('jsonwebtoken');
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


      //JWT RELATED API
    app.post('/jwt',async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'});
      res.send({token});
  });
  //MIDDLEWARE
  const verifyToken =(req,res,next)=>{
      // console.log('inside varified token',req.headers.authorization);
      if(!req.headers.authorization){
      return res.status(401).send({message:'unauthorized access'});
    }
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
      if(err){
        return res.status(401).send({message: 'unauthorized access'})
      }
      req.decoded=decoded;
      next();
    })
  }


  // use verify admin after verify token
  const verifyAdmin = async(req,res, next)=>{
    const email = req.decoded.email;
    const query = {email:email}
    const user = await userCollection.findOne(query);
    const isAdmin = user?.role === 'admin'
    if(!isAdmin){
      return res.status(403).send({message : ' forbidden access'});
    }
    next();
  }




    
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
    app.post('/products',verifyToken,async(req,res)=>{
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
  app.delete('/products/:id',verifyToken, async(req,res)=>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await productsCollection.deleteOne(query);
    res.send(result);
  });
  app.patch('/products/:id', async(req,res)=>{
    const product = req.body;
    const id = req.params.id;
    const filter = {_id : new ObjectId(id)}
    const updatedDoc={
      $set:{
        image1 : product.image1,
        image2 : product.image2,
        image3 : product.image3,
        image4 : product.image4,
        name : product.name,
        age : product.age,
        date : product.date,
        category : product.category,
        shortDescription : product.shortDescription,
        longDescription : product.longDescription,
        price : product.price,
        uploaderPhone : product.uploaderPhone,
        uploaderLocation : product.uploaderLocation
      }
    }
    const result = await productsCollection.updateOne(filter,updatedDoc); //name, age, date, category, shortDescription, longDescription, price, uploaderPhone, uploaderLocation
    res.send(result);
  })




  // USER relate API
  app.get('/users/admin/:email',verifyToken, async(req,res)=>{
    const email = req.params.email;
    if(email !== req.decoded.email){
      return res.status(403).send({message : "forbidden access"})
    }
    const query = {email:email}
    const user = await usersCollection.findOne(query);
    let admin = false;
    if(user){
      admin= user?.role === 'admin';
    }
    res.send({admin});
  });
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
    app.get('/users',verifyToken, async(req,res)=>{
    const result = await usersCollection.find().toArray();
    res.send(result);
   });
   app.delete('/users/:id',verifyToken,async(req,res)=>{
    const id = req.params.id;
    const query = {_id : new ObjectId(id)};
    const result = await usersCollection.deleteOne(query);
    res.send(result);
   });
   app.patch('/users/admin/:id',verifyToken,verifyAdmin, async(req,res)=>{
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)};
    const updatedDoc = {
      $set :{
        role : 'admin'
      }
    }
    const result = await usersCollection.updateOne(filter,updatedDoc);
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