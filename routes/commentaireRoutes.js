const express=require('express')
const commentaireRoutes=express.Router()
const authentification=require('../midleware/authentification')
const models=require('../models')
const jwt = require('jsonwebtoken')
const validator=require('validator')
const async=require('async')


////////////////////////////////////////////////////////
////// CREER UN COMMENTAIRE
////////////////////////////////////////////////////////
commentaireRoutes.post('/commentaire/new',authentification, (req,res)=>{

    if(req.body.message==undefined || req.body.idPublication==undefined)
    {return res.status(403).json("ID Publication / Commentaire indéfinis")}

    if(!validator.isInt(req.body.idPublication)){return res.status(403).json("L'ID de la publication ne peut pas être un STRING")}
    if(validator.isEmpty(req.body.message)){return res.status(403).json("Le commentaire ne peut pas être vide")}
    if(!validator.isLength(req.body.message, {min:1, max:150})){return res.status(403).json("Le commentaire ne doit pas dépasser 150 carractères")}

    const idPublication=req.body.idPublication
    const message=req.body.message

    const token= req.headers.authorization.split(' ')[1]
    const tokenDecoded=jwt.decode(token)
    const idUser=tokenDecoded.id
    const idProfil=tokenDecoded.idProfil

    models.Publication.findOne({attributes:['id'], where:{id:idPublication}})
    .then((data)=>{
        if(data){
            addCommentaire(message,idUser,idProfil,idPublication)
        }else{
            return res.status(403).json("La publication n'existe pas")
        }
    })
    .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

    // fonction ajouter un commentaire
    function addCommentaire(myMSG,myIDUser,myIDProfil,myIDPOST){
        models.Commentaire.create({
            message:myMSG,
            idUser:myIDUser,
            idProfil:myIDProfil,
            idPublication:myIDPOST
        })
        .then(()=>{addCommentCounter(); return res.status(201).json("Commentaire ajouté avec succès")})
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
    }

    /// IMPORTANT : COUNTER DE COMMENTAIRES
    function addCommentCounter(){
        async.waterfall([
            function(callback){
                models.Commentaire.count({where:{ idPublication:idPublication}})
                .then((data)=>{callback(null, data)})
            },function(arg1, callback){
                models.Publication.update({nbCommentaire:arg1},{where: {id:idPublication}})
            }

        ], function(err,result){})
    }

})

////////////////////////////////////////////////////////
////// MODIFIER UN COMMENTAIRE
////////////////////////////////////////////////////////
commentaireRoutes.post('/commentaire/edit',authentification, (req,res)=>{

    if(req.body.message==undefined || req.body.idCommentaire==undefined)
    {return res.status(403).json("ID Commentaire / Commentaire indéfinis")}

    if(!validator.isInt(req.body.idCommentaire)){return res.status(403).json("L'ID de la publication ne peut pas être un STRING")}
    if(validator.isEmpty(req.body.message)){return res.status(403).json("Le commentaire ne peut pas être vide")}
    if(!validator.isLength(req.body.message, {min:1, max:150})){return res.status(403).json("Le commentaire ne doit pas dépasser 150 carractères")}

    const idCommentaire=req.body.idCommentaire
    const message=req.body.message

    const token= req.headers.authorization.split(' ')[1]
    const tokenDecoded=jwt.decode(token)
    const idUser=tokenDecoded.id

    models.Commentaire.findOne({attributes:['id', 'idUser'], where:{id:idCommentaire}})
    .then((data)=>{
        if(data){
            // vérifier s'il est le propriétaire du commentaire
            if(data.idUser== idUser){
                editCommentaire(message,idCommentaire)
            }else{
                return res.status(403).json("Vous n'êtes pas l'auteur du commentaire") 
            }
            
        }else{
            return res.status(403).json("Le commentaire est introuvable")
        }
    })
    .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

    // fonction ajouter un commentaire
    function editCommentaire(myMSG, myIDCOM){
        models.Commentaire.update({message:myMSG},{where:{id:myIDCOM}})
        .then(()=>{return res.status(201).json("Commentaire modifié avec succès")})
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
    }

})

////////////////////////////////////////////////////////
////// SUPPRIMER UN COMMENTAIRE
////////////////////////////////////////////////////////
commentaireRoutes.post('/commentaire/delete',authentification, (req,res)=>{

    if(req.body.idCommentaire==undefined)
    {return res.status(403).json("ID Commentaire indéfini")}

    if(!validator.isInt(req.body.idCommentaire)){return res.status(403).json("L'ID de la publication ne peut pas être un STRING")}
    
    const idCommentaire=req.body.idCommentaire

    const token= req.headers.authorization.split(' ')[1]
    const tokenDecoded=jwt.decode(token)
    const idUser=tokenDecoded.id

    models.Commentaire.findOne({attributes:['id', 'idUser','idPublication'], where:{id:idCommentaire}})
    .then((data)=>{
        if(data){
            // vérifier s'il est le propriétaire du commentaire
            if(data.idUser== idUser){
                deleteCommentaire(idCommentaire, data.idPublication)
            }else{
                return res.status(403).json("Vous n'êtes pas l'auteur du commentaire") 
            }
        }else{
            return res.status(403).json("Le commentaire est introuvable")
        }
    })
    .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

    // fonction ajouter un commentaire
    function deleteCommentaire(myIDCOM, myIDPOST){
        models.Commentaire.destroy({where:{id:myIDCOM}})
        .then(()=>{addCommentCounter(myIDPOST); return res.status(201).json("Commentaire supprimé avec succès")})
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
    }

    /// IMPORTANT : COUNTER DE COMMENTAIRES
    function addCommentCounter(myIDPOST){
        async.waterfall([
            function(callback){
                models.Commentaire.count({where:{ idPublication:myIDPOST}})
                .then((data)=>{callback(null, data)})
            },function(arg1, callback){
                models.Publication.update({nbCommentaire:arg1},{where: {id:myIDPOST}})
            }

        ], function(err,result){})
    }
})

////////////////////////////////////////////////////////
////// AFFICHER UN COMMENTAIRE
////////////////////////////////////////////////////////
commentaireRoutes.post('/commentaire/one',authentification, (req,res)=>{

    if(req.body.idCommentaire==undefined)
    {return res.status(403).json("ID Commentaire indéfini")}

    if(!validator.isInt(req.body.idCommentaire)){return res.status(403).json("L'ID de la publication ne peut pas être un STRING")}
    
    const idCommentaire=req.body.idCommentaire

    models.Commentaire.findOne({attributes:['id','message','idUser','idProfil','idPublication'], where:{id:idCommentaire}, include:[{model:models.User, attributes:['username']}, {model:models.Profil, attributes:['fname','lname','city','country','imageURL']}]})
    .then((data)=>{
        if(data){
                return res.status(403).json(data) 
        }else{
            return res.status(403).json("Le commentaire est introuvable")
        }
    })
    .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

})

////////////////////////////////////////////////////////
////// AFFICHER TOUT LES COMMENTAIRE D'UNE PUBLICATION
////////////////////////////////////////////////////////
commentaireRoutes.post('/commentaire/all',authentification, (req,res)=>{
    
    if(req.body.idPublication==undefined)
    {return res.status(403).json("ID Publication indéfini")}

    if(!validator.isInt(req.body.idPublication)){return res.status(403).json("L'ID de la publication ne peut pas être un STRING")}
    
    const idPublication=req.body.idPublication

    models.Commentaire.findAll({attributes:['id','message','idUser','idProfil','idPublication'], where:{idPublication:idPublication}, include:[{model:models.User, attributes:['username']}, {model:models.Profil, attributes:['fname','lname','city','country','imageURL']}]})
    .then((data)=>{
        if(data){
                return res.status(403).json(data) 
        }else{
            return res.status(403).json("Commentaires introuvables")
        }
    })
    .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

})


module.exports=commentaireRoutes