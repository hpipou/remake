const jwt = require('jsonwebtoken')
const validator = require('validator')
require('dotenv').config()

const authentification = (req, res, next)=>{

    if(req.headers.authorization==undefined){return res.status(403).json("Le token est indéfini")}
    else{
        if(validator.isEmpty(req.headers.authorization)){return res.status(403).json("Le token ne peut pas être vide")}
        else{
            try{
                const resultat = jwt.verify(req.headers.authorization.split(' ')[1], process.env.SECTOKEN)
                if(resultat){next()}
                else{return res.status(403).json("Le token est invalide")}
            }
            catch{
                return res.status(403).json("Le token est invalide")
            }
        }
    }

}

module.exports=authentification