require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const users = [];

app.post("/api/auth/register",(req,res)=>{users.push(req.body);res.json({msg:"ok"})});
app.post("/api/auth/login",(req,res)=>{
 const user=users.find(u=>u.email===req.body.email);
 if(!user)return res.status(400).send("no user");
 const token=jwt.sign({email:user.email},"secret");
 res.json({token});
});

app.post("/api/tax/paye",(req,res)=>{
 const tax=req.body.income*0.1;
 res.json({tax});
});

app.post("/api/tax/vat",(req,res)=>{
 const vat=req.body.revenue*0.075;
 res.json({vat});
});

app.listen(5000);
