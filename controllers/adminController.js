const User = require('../models/userModel');

const bcrypt = require('bcrypt');

const randomstring = require('randomstring');

const config = require("../config/config");

const nodemailer = require('nodemailer');

// html pdf


const ejs = require('ejs');
const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');

const securePassword = async(password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return (passwordHash);


    } catch (error) {
        console.log(error.message);
    }

}


//reset mail

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
            html: '<p> ' + name + ',please click here to <a href = "http://127.0.0.1:3000/admin/forget-password?token=' +token+ '"> Reset </a> your password.</p>'

        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return;
            }
            else {
                console.log("Email has been sent:-", info.response);
            }

        })

    } catch (error) {
        console.log(error.message);

    }

}

//mail

const addUserMail = async (name, email,password,user_id) => {
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
            subject: 'Admin add you and Verify your mail.',
            html: '<p> ' + name + ',please click here to <a href = "http://127.0.0.1:3000/verify?id='+user_id+'">Verify </a> your mail.</p><br> <b>Email:-</b>'+email+'<br><b>Password:- </b>'+password+''
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


const loadLogin = async(req,res)=>{
    try {
        res.render('login');
        return;
    } catch (error) {
        console.log(error.message);
        
    }
}


const verifyLogin = async(req,res)=>{
    try {
        const email = req.body.email;
        const password= req.body.password;

        const userData = await User.findOne({ email: email});
        if(userData){
            const passwordMatch =  await bcrypt.compare(password,userData.password);

            if(passwordMatch){
                if(userData.is_admin === 0){
                    res.render('login', { message:"Email and password is incorrect"})
                }
                else{
                    req.session.user_id = userData._id;
                    res.redirect("/admin/home");
                }



            }
            else{
                res.render('login', { message:"Email and password is incorrect"})
            }

        }
        else{
            res.render('login', { message:"Email and password is incorrect"})
        }

        
        
    } catch (error) {
        console.log(error.message);
        
    }
}

const loadDashboard = async(req,res)=>{
    try {
        const userData = await User.findById({_id:req.session.user_id});
        res.render('home',{admin:userData});
        return;
        
    } catch (error) {
        console.log(error.message);
        
    }
}

const logout = async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/admin');
        return;
        
    } catch (error) {
        console.log(error.message);
        
    }
}

const forgetLoad = async(req,res)=>{
    try {
        res.render('forget')
        
    } catch (error) {
        console.log(error.message);
        
    }
}


const forgetVerify=async(req,res)=>{
    try {
        const email = req.body.email;
        const userData = await User.findOne({ email: email});
        if (userData) {
            if (userData.is_admin === 0) {
                res.render('forget',{message:"Email is incorrect"});
                return;
            }
             else {
                const randomString= randomstring.generate();
                const updatedData = await User.updateOne({ email:email},{$set:{token:randomString}});
                sendResetPasswordMail(userData.name,userData.email,randomString);
                res.render('forget',{message:"Please check your mail to reset password."});

            }        
        } 
        else {
            res.render('forget',{message:"Email is incorrect"});
            
        }
        
    } catch (error) {
        console.log(error.message);
        
    }
}

const forgetPasswordLoad = async(req,res)=>{
    try {
        const token = req.query.token;

        const tokenData = await User.findOne({token:token});
        if (tokenData) {
            res.render('forget-password',{user_id:tokenData._id});
            
        } else {
            res.render('404',{message:"Invalid"});
            
        }

    } catch (error) {
        console.log(error.message);
    }
    
}

const resetPassword = async(req,res)=>{
    try {
        const password = req.body.password;
        const user_id = req.body.user_id;

        const securePass = await securePassword(password);
        const updatedData = await  User.findByIdAndUpdate({ _id:user_id },{ $set:{password:securePass,token:''}});

        res.redirect('/admin');


    } catch (error) {
        console.log(error.message);
        
    }
}

const adminDashboard = async(req,res)=>{
    try {
        const usersData =await User.find({is_admin:0});
        res.render('dashboard',{users:usersData});
    } catch (error) {
        console.log(error.message);
        
    }
}

//add new user 

const newUserLoad = async(req,res)=>{
    try {
        res.render('new-user');
        
    } catch (error) {
        console.log(error.message);
        
    }

}

const addUser=async(req,res)=>{
    try {
        const name = req.body.name;
        const email = req.body.email;
        const mno = req.body.mno;
        const image = req.file.filename;
        const password = randomstring.generate(8);

        const spassword = await securePassword(password);

       const user = new User({
        name:name,
        email:email,
        mobile:mno,
        image:image,
        password:spassword,
        is_admin:0

        });
        const userData = await user.save();

        

        if (userData) {
            addUserMail(name,email,password,userData._id);
            res.redirect('/admin/dashboard');
            

        } else {
            res.render('new-user',{message:"Something Wrong"})
        }

        
    } catch (error) {
        
        console.log(error.message);
    }
}
// user edit by admin

const editUserLoad = async(req,res)=>{
    try {
        const id = req.query.id;
        const userData = await User.findById({_id:id});
        if (userData) {
            res.render('edit-user',{user:userData});
            
        } else {
            res.redirect('/admin/dashboard ');
            
        }

        res.render('edit-user');
        
    } catch (error) {
        console.log(error.message);
        
    }
}


const updateUsers = async(req,res)=>{
    try {
        const userData = await User.findByIdAndUpdate({_id:req.body.id},{$set:{name:req.body.name,email:req.body.email,mobile:req.body.mno, is_verified:req.body.verify}});
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.log(error.message);
        
    }
}

const deleteUser = async(req,res)=>{
    try {
        const id = req.query.id;
        await User.deleteOne({_id:id});
        res.redirect('/admin/dashboard');
        
    } catch (error) {
        console.log(error.message);
    }
}

//pdf 

const exportUserPdf = async(req,res)=>{
    try {
        const users =await User.find({is_admin:0});
        const data = {
            users:users
        }
        const filePathName =  path.resolve(__dirname,'../views/admin/pdf.ejs');
        const htmlstring =  fs.readFileSync(filePathName).toString();
        let options ={
           
            format:'A3',
            orientation:'portrait',
            border:"10mm"
        }


        const ejsData =  ejs.render(htmlstring,data);

        pdf.create(ejsData,options).toFile('users.pdf',(err,response)=>{
            if (err) {
                console.log(err);               
            }
            const filePath =  path.resolve(__dirname,'../users.pdf');
            

            fs.readFile(filePath,(err,file)=>{
                if(err){
                    console.log(err);
                    return res.status(500).send("File can't be downloaded");
                }
                res.setHeader('Content-type','application/pdf');

                res.setHeader('Content-Disposition','attachment;filename="users.pdf"');

                res.send(file);

                
            });
        });
    } catch (error) {
        console.log(error.message);
        
    }
}

module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    logout,
    forgetLoad,
    forgetVerify,
    forgetPasswordLoad,
    resetPassword,
    adminDashboard,
    newUserLoad,
    addUser,
    editUserLoad,
    updateUsers,
    deleteUser,
    exportUserPdf
}