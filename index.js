const mongoose =require("mongoose");
mongoose.connect("mongodb://localhost:27017/user");


const express = require("express");
const app=express();

//for user
const userRoute=require('./routes/userRoute');
app.use('/',userRoute);

//for admin
const adminRoute=require('./routes/adminRoute');
app.use('/admin',adminRoute);


app.listen(3000,function(){
    console.log("Server is running...");
}); 
