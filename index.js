const mongoose =require("mongoose");

 


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
        await mongoose.connect("mongodb+srv://dn2:dn2@mycluster.umnasup.mongodb.net/?retryWrites=true&w=majority");
    } catch (error) {
        console.log(error);
    }
    app.listen(3000,function(){
        console.log("Server is running...");
    });
}
    
start();
