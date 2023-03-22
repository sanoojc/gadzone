export default function verifyLogin(req, res, next){
    console.log(req.session?.user)
    if(req.session.user){
        next();
    }
    else{
        res.render('user/userLogin')
    }
}