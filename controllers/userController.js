const User = require('../models/userModel');
const bcrypt = require('bcrypt');

const nodemailer = require("nodemailer");

const randormstring = require("randomstring");

const config = require("../config/config");

const securePassword = async(password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return (passwordHash);


    } catch (error) {
        console.log(error.message);
    }

}

const loadRegister = async (req, res) => {
    try {
        res.render('registration');

    } catch (error) {
        console.log(error.message)
    }
}

const verifyMail = async (req,res) =>{
    try {
        const updateInfo = await User.updateOne({_id:req.query.id},{$set:{is_verified:1}});
        console.log(updateInfo);
        res.render("email-verified");

    } catch (error) {
        console.log(error.message);

    }

}





//mail


const sendVerifyMail = async (name, email,user_id) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.emailPassword
            }
        });
        const mailOptions = {
            from:config.emailUser,
            to: email,
            subject: 'For verification Mail',
            html: '<p> ' + name + ',please click here to <a href = "http://127.0.0.1:3000/verify?id='+user_id+'">Verify </a> your mail.</p>'

        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log("Email has been sent:-", info.response);
            }

        })

    } catch (error) {
        console.log(error.message);

    }

}
const insertUser = async (req,res) => {
    try {
        const spassword = await securePassword(req.body.password);
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mno,
            image: req.file.filename,
            password: spassword,
            is_admin: 0
        });
        const userData = await user.save();
        if (userData) {
            sendVerifyMail(req.body.name, req.body.email,userData._id);
            res.render('registration', { message: 'You have been registered Successfully.Please verify Your mail.' });
        }

        else {
            res.render('registration', { message: 'Something went wrong' });
        }



    } catch (error) {
        console.log(error.message)
    }

}

//user login

const loginLoad = async (req,res) => {
    try {
        res.render('login');
        return;

    } catch (error) {
        console.log(error.message);

    }

}

const verifyLogin = async (req,res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({email:email});

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                if (userData.is_verified === 0) {
                    res.render('login', { message: "Please verify you mail" });
                }
                else {
                    req.session.user_id = userData._id;
                    res.redirect('/home');
                }
            }
            else {
                res.render('login', { message: "Email and Password are incorrect" });
            }
        }
        else {
            res.render('login', { message: "Email and Password are incorrect" });
        }



        
    } catch (error) {
        console.log(error.message)

    }
}

const loadHome = async (req, res) => {
    try {
        const userData  = await User.findById({ _id:req.session.user_id });
        res.render('home',{ user:userData});

    } catch (error) {
        console.log(error.message);

    }
}

//logout

const userLogout = async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/');
        
    } catch (error) {
        console.log(error.message);
        
    }
}

// forget password

const forgetLoad = async(req,res)=>{
    try {
        res.render('forget');
        
    } catch (error) {
        console.log(error.message);
        
    }
}

const forgetVerify = async(req,res)=>{
    try {
        const email=req.body.email;
          const userData=  await User.findOne({email: email});
          if(userData){
            if(userData.is_verified === 0){
                res.render('forget',{message:"Please verify you mail."});

            }
            else{
                const randomstring = randormstring.generate();
                const updatedData = await User.updateOne({email:email},{$set:{token:randomstring}});
                sendResetPasswordMail(userData.name,userData.email,randomstring);
                res.render('forget',{message:"Please check your mail to reset your password."});



            }


          }
          else{
            res.render('forget',{message:"User Email is incorrect."});
          }
    } catch (error) {
        console.log(error.message);
    }
}

// reset pass mail

const sendResetPasswordMail = async (name, email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.emailPassword
            }
        });
        const mailOptions = {
            from: config.emailUser,
            to: email,
            subject: 'For Reset password',
            html: '<p> ' + name + ',please click here to <a href = "http://127.0.0.1:3000/forget-password?token=' +token+ '"> Reset </a> your password.</p>'

        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log("Email has been sent:-", info.response);
            }

        })

    } catch (error) {
        console.log(error.message);

    }

}

const forgetPasswordLoad = async(req,res)=>{
    try {
        const token = req.query.token;
        const tokenData= await User.findOne({token:token});
        if(tokenData){
            res.render('forget-password',{user_id:tokenData._id});
        }
        else{
            res.render('404',{message:"Page not found"});
        }
        
    } catch (error) {
        console.log(error.message);
        
    }
}

const resetPassword = async(req,res)=>{
    try {
        const password = req.body.password;
        const user_id = req.body.user_id;
        const secure_password = await securePassword(password);
        const udupatedData = await User.findByIdAndUpdate({_id:user_id},{$set:{password : secure_password, token:''}});
        res.redirect("/");
        
    } catch (error) {
        console.log(error.message);
        
    }

}

// verification link

const verificationLoad = async(req,res)=>{
    try {
        res.render('verification')
        
    } catch (error) {
        console.log(error.message);
        
    }
}


const sentVerificationLink = async(req,res)=>{
    try {
        const email=req.body.email;
        const userData = await User.findOne({ email: email});
        if(userData){
            sendVerifyMail(userData.name,userData.email,userData._id);
            res.render('verification',{message: 'Reset verification mail sent to your mail id , please check'})
            

        }
        else{
            res.render('verification',{message:"This Email do not exit"});

        }

        
    } catch (error) {
        console.log(error.message);
        
    }
}


//Edit user

const editLoad = async(req,res)=>{
    try {
        const id = req.query.id;
        const userData = await User.findById({_id:id});
        if(userData){
            res.render('edit',{user:userData});

        }
        else{
            res.redirect('/home')
            
        }
        
    } catch (error) {
        console.log(error.message);
        
    }
}

const updateProfile = async(req,res)=>{
    try {
        if (req.file) {
            // const userData =  await User.findByIdAndUpdate({_id:req.body.user_id},{$set:{name:req.body.name,email:req.body.email,mobile:req.body.mno,image:req.file.filename}});
            const userData =  await User.findByIdAndUpdate({_id:req.body.user_id},{$set:{name:req.body.name,email:req.body.email,mobile:req.body.mno}});

        } 
        else {
            const userData =  await User.findByIdAndUpdate({_id:req.body.user_id},{$set:{name:req.body.name,email:req.body.email,mobile:req.body.mno}});            
        }

        res.redirect('/home');
        
    } catch (error) {
        console.log(error.message);
        
    }
}







module.exports = {
    loadRegister,
    insertUser,
    verifyMail,
    loginLoad,
    verifyLogin,
    loadHome,
    userLogout,
    forgetLoad,
    forgetVerify,
    forgetPasswordLoad,
    resetPassword,
    verificationLoad,
    sentVerificationLink,
    editLoad,
    updateProfile,
    
}