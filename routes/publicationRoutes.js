const express=require('express')
const publicationRoutes=express.Router()
const authentification=require('../midleware/authentification')
const models=require('../models')
const jwt = require('jsonwebtoken')
const validator=require('validator')
const multer=require('../midleware/multer')
const multerCaptureError=require('../midleware/multerErrorCapture')
const async=require('async')

//////////////////////////////////////////////////////////////////
///////////  CREER UNE PUBLICATION
//////////////////////////////////////////////////////////////////
publicationRoutes.post('/publication/new',authentification,multer.single('file'),multerCaptureError, (req,res)=>{

    const token = req.headers.authorization.split(' ')[1]
    const tokenDecoded = jwt.decode(token)
    const idUser=tokenDecoded.id
    const idProfil=tokenDecoded.idProfil

    // les cas de la création d'une publication 
    // AVEC MESSAGE, SANS IMAGE
    // AVEC MESSAGE, AVEC IMAGE
    // SANS MESSAGE, AVEC IMAGE
    // SANS MESSAGE, SANS IMAGE

    img=0
    msg=0

    if(req.file==undefined){img=0}else{img=1}
    if(req.body.message==undefined){msg=0}else{msg=1}

    if(msg==0 && img==0){
        // SANS MESSAGE , SANS IMAGE
        return res.status(403).json("La publication ne peut pas être vide")}

    else if(msg==1 && img==1){
        // AVEC MESSAGE, AVEC IMAGE
        if(validator.isEmpty(req.body.message)){createPost("0",req.file.filename,idUser,idProfil)}
        else{
            if(validator.isLength(req.body.message,{min:1,max:350})){createPost(req.body.message,req.file.filename ,idUser ,idProfil)}
            else{return res.status(403).json("Le message ne doit pas dépasser 350 carractères")}
        }
    }
    else if(msg==1 && img==0){
        // AVEC MESSAGE, SANS IMAGE
        if(validator.isEmpty(req.body.message)){return res.status(403).json("La publication ne peut pas être vide")}
        else{
            if(validator.isLength(req.body.message,{min:1,max:350})){createPost(req.body.message,"0",idUser ,idProfil)}
            else{return res.status(403).json("Le message ne doit pas dépasser 350 carractères")}
        }
    }
    else {
        // SANS MESSAGE, AVEC IMAGE
        createPost("0",req.file.filename,idUser,idProfil)
    }
    
    // fonction créer une publication
    function createPost(myMSG,myIMG,myIdUser,myIdProfil){
        models.Publication.create({
            message:myMSG,
            imageURL:myIMG,
            nbLike:0,
            nbDislike:0,
            nbCommentaire:0,
            idUser:myIdUser,
            idProfil:myIdProfil
        })
        .then(()=>{return res.status(201).json("Publication créee avec succès")})
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
    }
    
})

//////////////////////////////////////////////////////////////////
///////////  MODIFIER UNE PUBLICATION
//////////////////////////////////////////////////////////////////
publicationRoutes.post('/publication/edit',authentification, multer.single('file'), multerCaptureError, (req,res)=>{

    if(req.body.idPublication==undefined){return res.status(403).json("ID Publication indéfini")}
    if(!validator.isInt(req.body.idPublication)){return res.status(403).json("L'ID Publication ne peut pas être un string")}

    const idPublication=req.body.idPublication

    const token = req.headers.authorization.split(' ')[1]
    const tokenDecoded = jwt.decode(token)
    const idUser=tokenDecoded.id

    // les cas de la modification
    // AVEC MESSAGE, SANS IMAGE
    // AVEC MESSAGE, AVEC IMAGE
    // SANS MESSAGE, AVEC IMAGE
    // SANS MESSAGE, SANS IMAGE

    img=0
    msg=0

    if(req.file==undefined){img=0}else{img=1}
    if(req.body.message==undefined){msg=0}else{msg=1}

    models.Publication.findOne({attributes:['idUser','imageURL'], where:{id:idPublication}})
    .then((data)=>{
        if(data){
            // verifier si c'est l'auteur de la publication
            if(data.idUser==idUser){

                ///// DEBUT DES 4 CAS

                if(msg==0 && img==0){
                    // SANS MESSAGE , SANS IMAGE
                    return res.status(403).json("La publication ne peut pas être vide")}
            
                else if(msg==1 && img==1){
                    // AVEC MESSAGE, AVEC IMAGE
                    if(validator.isEmpty(req.body.message)){updatePost("0",req.file.filename,idPublication)}
                    else{
                        if(validator.isLength(req.body.message,{min:1,max:350})){updatePost(req.body.message,req.file.filename , idPublication)}
                        else{return res.status(403).json("Le message ne doit pas dépasser 350 carractères")}
                    }
                }
                else if(msg==1 && img==0){
                    // AVEC MESSAGE, SANS IMAGE
                    if(validator.isEmpty(req.body.message)){return res.status(403).json("La publication ne peut pas être vide")}
                    else{
                        if(validator.isLength(req.body.message,{min:1,max:350})){
                            // Pour ne pas écraser une photo
                            if(data.imageURL=="0"){updatePost(req.body.message,"0",idPublication)}
                            else{updatePost(req.body.message,data.imageURL,idPublication)}
                            }
                        else{return res.status(403).json("Le message ne doit pas dépasser 350 carractères")}
                    }
                }
                else {
                    // SANS MESSAGE, AVEC IMAGE
                    updatePost("0",req.file.filename,idPublication)
                }

                //// FIN DES 4 CAS

            }else{return res.status(403).json("Vous n'êtes pas l'auteur de la publication")}

        }else{return res.status(403).json("La publication est introuvable")}
    })
    .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

    // fonction modifier une publication
    function updatePost(myMSG,myIMG,myIDPUBLICATION){
        models.Publication.update({
            message:myMSG,
            imageURL:myIMG
        },{where:{id:myIDPUBLICATION}})
        .then(()=>{return res.status(201).json("Publication modifiée avec succès")})
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
    }

})

//////////////////////////////////////////////////////////////////
///////////  SUPPRIMER UNE PUBLICATION
//////////////////////////////////////////////////////////////////
publicationRoutes.post('/publication/delete',authentification, (req,res)=>{

    if(req.body.idPublication==undefined){return res.status(403).json("ID Publication indéfini")}
    if(!validator.isInt(req.body.idPublication)){return res.status(403).json("L'ID Publication ne peut pas être un string")}

    const idPublication=req.body.idPublication

    const token = req.headers.authorization.split(' ')[1]
    const tokenDecoded = jwt.decode(token)
    const idUser=tokenDecoded.id

    models.Publication.findOne({attributes:['idUser'], where:{id:idPublication}})
    .then((data)=>{
        if(data){
            // verifier si c'est l'auteur de la publication
            if(data.idUser==idUser){
                deletePost(idPublication)
            }else{
                return res.status(403).json("Vous n'êtes pas l'auteur de la publication")
            }

        }else{
            return res.status(403).json("La publication est introuvable")
        }
    })
    .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

    // fonction supprimer une publication
    function deletePost(myIdPublication){
        models.Publication.destroy({where:{id:myIdPublication}})
        .then(()=>{return res.status(200).json("Publication supprimée avec succès")})
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

    }

})

//////////////////////////////////////////////////////////////////
///////////  AFFICHER UNE PUBLICATION
//////////////////////////////////////////////////////////////////
publicationRoutes.post('/publication/one',authentification, (req,res)=>{

    if(req.body.idPublication==undefined){return res.status(403).json("ID Publication indéfini")}
    if(!validator.isInt(req.body.idPublication)){return res.status(403).json("L'ID Publication ne peut pas être un string")}

    const idPublication=req.body.idPublication

    models.Publication.findOne({attributes:['id', 'message','imageURL','nbLike','nbDislike','nbCommentaire','idUser','idProfil'] , where:{id:idPublication}, include:[{model:models.User, attributes:['username']}, {model:models.Profil, attributes:['fname','lname','city','country','imageURL']}]})
    .then((data)=>{
        if(data){return res.status(200).json(data)
        }else{return res.status(403).json("La publication n'existe pas")}
    })
    .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

})

//////////////////////////////////////////////////////////////////
///////////  AFFICHER TOUTES LES PUBLICATIONS
//////////////////////////////////////////////////////////////////
publicationRoutes.post('/publication/all',authentification, (req,res)=>{
    models.Publication.findAll({attributes:['id', 'message','imageURL','nbLike','nbDislike','nbCommentaire','idUser','idProfil'] , include:[{model:models.User, attributes:['username']}, {model:models.Profil, attributes:['fname','lname','city','country','imageURL']}]})
    .then((data)=>{
        if(data){return res.status(200).json(data)
        }else{return res.status(403).json("Aucune publication")}
    })
    .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
})


//////////////////////////////////////////////////////////////////
///////////  PROFIL STATISTIQUES
//////////////////////////////////////////////////////////////////
publicationRoutes.get('/user/allstats',authentification, (req,res)=>{
    
    const token = req.headers.authorization.split(' ')[1]
    const tokenDecoded = jwt.decode(token)
    const idUser=tokenDecoded.id

    async.waterfall([
        function(callback){
            models.Publication.count({where:{idUser:idUser}})
            .then((data)=>{callback(null, data)})
            .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
        },function(arg1, callback){
            models.Commentaire.count({where:{idUser:idUser}})
            .then((data)=>{callback(null, arg1 , data)})
            .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
        },function(arg1,arg2,callback){
            models.Like.count({where:{ type:"like", idUser:idUser}})
            .then((data)=>{callback(null, arg1 , arg2, data)})
            .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
        },function(arg1,arg2,arg3, callback){
            models.Like.count({where:{ type:"dislike", idUser:idUser}})
            .then((data)=>{
                return res.status(200).json(
                {"publication": arg1,"commentaire": arg2,"like": arg3,"dislike": data,}
                )
                callback(null,'done' )})
            .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
        }
    ],function(err,result){})


})


module.exports=publicationRoutes