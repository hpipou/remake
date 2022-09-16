const express=require('express')
const likeRoutes=express.Router()
const jwt=require('jsonwebtoken')
const models=require('../models')
const validator=require('validator')
const authentification=require('../midleware/authentification')
const async=require('async')
const fs=require('fs')
const path=require('path')

///////////////////////////////////////////// TEST BABA

likeRoutes.get('/.well-known/pki-validation/5B91C5F3E94FC272B2C69B22977F3A53.txt',(req,res)=>{
    res.sendFile(path.join(__dirname+'/a.html'));
})

///////////////////////////////////////////////////////////////////
////////  CLICK SUR LE BUTTON LIKE
///////////////////////////////////////////////////////////////////

likeRoutes.post('/like',authentification, (req,res)=>{

    if( req.body.idPublication==undefined)
    {return res.status(403).json("ID Publication indéfini")}

    if(!validator.isInt(req.body.idPublication)){return res.status(403).json("L'ID de la publication ne peut pas être un STRING")}

    const idPublication=req.body.idPublication

    const token= req.headers.authorization.split(' ')[1]
    const tokenDecoded=jwt.decode(token)
    const idUser=tokenDecoded.id
    const idProfil=tokenDecoded.idProfil

    models.Publication.findOne({attributes:['id'], where:{id:idPublication}})
    .then((dataPost)=>{
        if(dataPost){
            
            models.Like.findOne({attributes:['id','type'], where:{idUser:idUser, idPublication:idPublication}})
            .then((data)=>{
                if(data){
                    if(data.type=="like"){
                        // La on supprime le Like
                        Deletelike(idUser,idPublication)
                    }else{
                        // là On modifie le "dislike" en "like"
                        Editlike(idUser,idPublication)
                    }

                }else{
                    // Il n'a ni liké, ni disliké ===> Donc on ajoute un like
                    addlike(idUser,idProfil,idPublication)
                }

            })
            .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
        }else{
            return res.status(403).json("La publication n'existe pas")
        }
    })
    .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

    // fonction ajouter un like
    function addlike(myIDUser,myIDProfil,myIDPOST){
        models.Like.create({
            type:"like",
            idUser:myIDUser,
            idProfil:myIDProfil,
            idPublication:myIDPOST
        })
        .then(()=>{addLikeCounter(); return res.status(201).json("Like ajouté avec succès")})
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
    }

    // fonction modifier un like
    function Editlike(myIDUser,myIDPOST){
        models.Like.update({
            type:"like",
        },{where:{idUser:myIDUser, idPublication:myIDPOST}})
        .then(()=>{addLikeCounter(); return res.status(201).json("Like modifié avec succès")})
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
    }

    // fonction modifier un like
    function Deletelike(myIDUser,myIDPOST){
        models.Like.destroy({where:{idUser:myIDUser, idPublication:myIDPOST}})
        .then(()=>{addLikeCounter(); return res.status(201).json("Like supprimé avec succès")})
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
    }

    /// IMPORTANT : AJOUTER LE COUNTER LIKE
    function addLikeCounter(){
        async.waterfall([
            function(callback){
                models.Like.count({where:{type:"like", idPublication:idPublication}})
                .then((data)=>{callback(null,data)})
                .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

            },function(arg1,callback){
                models.Like.count({where:{type:"dislike", idPublication:idPublication}})
                .then((data)=>{callback(null,arg1, data)})
                .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

            },function(arg1, arg2, callback){
                models.Publication.update({
                    nbLike: arg1,
                    nbDislike: arg2
                }, {where: {id:idPublication}})
            }

        ], function(err,result){})
    }

})


///////////////////////////////////////////////////////////////////
////////  CLICK SUR LE BUTTON DISLIKE
///////////////////////////////////////////////////////////////////

likeRoutes.post('/dislike',authentification, (req,res)=>{

    if( req.body.idPublication==undefined)
    {return res.status(403).json("ID Publication indéfini")}

    if(!validator.isInt(req.body.idPublication)){return res.status(403).json("L'ID de la publication ne peut pas être un STRING")}

    const idPublication=req.body.idPublication

    const token= req.headers.authorization.split(' ')[1]
    const tokenDecoded=jwt.decode(token)
    const idUser=tokenDecoded.id
    const idProfil=tokenDecoded.idProfil

    models.Publication.findOne({attributes:['id'], where:{id:idPublication}})
    .then((dataPost)=>{
        if(dataPost){
            
            models.Like.findOne({attributes:['id','type'], where:{idUser:idUser, idPublication:idPublication}})
            .then((data)=>{
                if(data){
                    if(data.type=="dislike"){
                        // La on supprime le disLike
                        DeleteDislike(idUser,idPublication)
                    }else{
                        // là On modifie le "like" en "dislike"
                        EditDislike(idUser,idPublication)
                    }

                }else{
                    // Il n'a ni liké, ni disliké ===> Donc on ajoute un like
                    addDislike(idUser,idProfil,idPublication)
                }

            })
            .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
        }else{
            return res.status(403).json("La publication n'existe pas")
        }
    })
    .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

    // fonction ajouter un like
    function addDislike(myIDUser,myIDProfil,myIDPOST){
        models.Like.create({
            type:"dislike",
            idUser:myIDUser,
            idProfil:myIDProfil,
            idPublication:myIDPOST
        })
        .then(()=>{addDislikeCounter(); return res.status(201).json("Dislike ajouté avec succès")})
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
    }

    // fonction modifier un like
    function EditDislike(myIDUser,myIDPOST){
        models.Like.update({
            type:"dislike",
        },{where:{idUser:myIDUser, idPublication:myIDPOST}})
        .then(()=>{addDislikeCounter(); return res.status(201).json("Dislike modifié avec succès")})
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
    }

    // fonction modifier un like
    function DeleteDislike(myIDUser,myIDPOST){
        models.Like.destroy({where:{idUser:myIDUser, idPublication:myIDPOST}})
        .then(()=>{addDislikeCounter(); return res.status(201).json("Dislike supprimé avec succès")})
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
    }

    /// IMPORTANT : AJOUTER LE COUNTER DISLIKE
    function addDislikeCounter(){
        async.waterfall([
            function(callback){
                models.Like.count({where:{type:"like", idPublication:idPublication}})
                .then((data)=>{callback(null,data)})
                .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

            },function(arg1,callback){
                models.Like.count({where:{type:"dislike", idPublication:idPublication}})
                .then((data)=>{callback(null,arg1, data)})
                .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

            },function(arg1, arg2, callback){
                models.Publication.update({
                    nbLike: arg1,
                    nbDislike: arg2
                }, {where: {id:idPublication}})
            }

        ], function(err,result){})
    }

})


module.exports=likeRoutes