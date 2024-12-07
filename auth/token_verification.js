const {verify}=require("jsonwebtoken");

module.exports={
    checkToken: (req,res,next)=>{
        let token=req.get("authorization");
       
        if(token){
            token= token.slice(7);
            verify(token,process.env.JSON_WEB_KEY,(err,decoded)=>{
                if(err)
                {
                    res.json({
                        succes:0,
                        message:"Invalid Token"
                    })
                }else
                {   
                    next();
                    // console.log("Calling next");
                }
                
            });
        }else{
            res.json({
                succes:0,
                message:"Access Denied!  Unauthorized User"
            })
        }
    }
}