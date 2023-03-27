import 'dotenv/config'
import express from 'express'
import connectDb from './config/dbConnect.js'
import userRouter from './routes/userRoutes.js'
import adminRouter from './routes/adminRoutes.js'
import path from 'path'
import session from 'express-session'
import 'express-handlebars'
import { engine } from 'express-handlebars'
import MongoStore from 'connect-mongo'

import hbs from 'handlebars';
hbs.registerHelper('inc', (value, options) => {
  return parseInt(value) + 1;
});
hbs.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});


const app= express()
app.engine('hbs',engine({extname:'.hbs'}))
app.set('view engine','hbs')

connectDb()
app.use(express.urlencoded({extended:true}))
app.use(express.json())

app.use(express.static(path.resolve()+"/public"))

app.use(session({
    secret:"jhgjygkyj",
    resave:false,
    saveUninitialized:true,
    store: MongoStore.create({ mongoUrl: process.env.DBCONFIG })
}))

app.use(function cachControl(req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
})


app.use('/admin/',adminRouter)
app.use('/',userRouter)

app.all("*", (req, res) => {
    res.render("error") 
  });

app.listen(8000,()=>{
    console.log('http://localhost:8000')
})