const express = require('express');
const cors = require('cors')
const app= express();
const port=process.env.PORT  || 5000;
require('dotenv').config()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
const res = require('express/lib/response');

app.use(cors())
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sq3pw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifJWT(req,res,next) {
    const authHeader=req.headers.authorization;
    
    if(!authHeader){
        return res.status(401).send({message: 'UnAuthorized Access'})
    }
    const token=authHeader.split('')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function(err,decoded){
        if(err){
            return res.status(403).send({message: 'fobidden'})
        }
        req.decoded=decoded;
        next();
    })
}

async function run() {
    try {
        await client.connect();
        console.log(' db connected');
        // const productCollection = client.db('assignment-eleven-db').collection('products');
        const userCollectoin = client.db('assignment-12-db').collection('user');
        const partsCollectoin = client.db('assignment-12-db').collection('parts');
        const orderCollectoin = client.db('assignment-12-db').collection('order');

        app.put('/user/:email', async(req,res)=>{
            const email=req.params.email;
            const user=req.body;
            const filter={email:email};
            const options={ upsert: true };
            const updateDoc={
                $set: user,
            };
            const result=await userCollectoin.updateOne(filter,updateDoc,options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN ,{expiresIn:'1h'} );
            res.send({result,token})
        });
        app.put('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const requester=req.decoded.email;
            const requesterAccount=await userCollectoin.findOne({email:requester})
            if(requesterAccount.role==='admin'){
                const filter={email:email};
                const updateDoc={
                    $set:{role: 'admin'},
                };
                const result = await userCollectoin.updateOne(filter, updateDoc, options);

                res.send(result)
            }else{
            res.status(403).send({message:'forbidden'})
            }
        });


       

  
        app.get('/admin/:email', async (req, res)=>{
            const email = req.params.email;
            const user = await userCollectoin.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        });
    

        app.get('/user', async (req,res)=>{
            const users= await userCollectoin.find().toArray();
            res.send(users)
        });

        app.get('/patrs', async (req,res)=>{
            const parts = await partsCollectoin.find().toArray();
            res.send(parts)
        });


        app.post('/addpart', async (req, res) => {
          const  newParts = req.body;
            console.log('add new product', newParts);
            const result = await partsCollectoin.insertOne(newParts);
            res.send(result);
        });
         app.post('/order', async (req, res) => {
          const  newOrder = req.body;
             const query = { custName: newOrder.custName, totalPrice
                 : newOrder.totalPrice, email
                     : newOrder.email, phone: newOrder.phone, orderData: newOrder.orderData } ;
                    //  const exists= await orderCollectoin.findOne(query);
                    //  if(exists){
                    //      return res.send({success:false,newOrder:exists})
                    //  }
            const result = await orderCollectoin.insertOne(newOrder);
            res.send( {success: true ,result});
        });

        app.get('/order',  async (req, res) => {
            const custName =req.query.email;
            
            const query = { custName: custName
};
            const order = await orderCollectoin.find(query).toArray();
            res.send(order)
        });

      app.get('/order/:id', async (req,res)=>{
          const id=req.path.id;
          const query={_id:ObjectId(id)};
          const booking=await orderCollectoin.findOne(query);
          res.send(booking);
      });  

        
    } finally {
        // Ensures that the client will close when you finish/error
        
    }
}
run().catch(console.dir);

app.get('/',(req,res)=>{
    res.send('i am backend')
})


app.listen(port,()=>{
    console.log(`server is  running on port ${port}`);
})