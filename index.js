const mongoose =require("mongoose");

require('dotenv').config()

 

const express = require("express");
const app=express();

//for user
const userRoute=require('./routes/userRoute');
app.use('/',userRoute);

//for admin
const adminRoute=require('./routes/adminRoute');
app.use('/admin',adminRoute);

const start = async () => {
    try {
        mongoose.connect(process.env.MONGODB_URL);
        
    } catch (error) {
        console.log(error);
    }
    app.listen(3000,function(){
        console.log("Server is running...");
    });
}


    
start();
