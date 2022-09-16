const express=require('express')
const userRoutes=express.Router()
const validator=require('validator')
const models=require('../models')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
require('dotenv').config()
const authentification=require('../midleware/authentification')

///////////////////////////////////////////////////
///////// CREER UN COMPTE
///////////////////////////////////////////////////
userRoutes.post('/user/register', (req,res)=>{

    if(req.body.email==undefined || req.body.username==undefined || req.body.password==undefined)
    {return res.status(403).json("Les champs ne peuvent pas être indéfinis")}

    //Verifier les INPUT
    if(validator.isEmpty(req.body.email)){return res.status(403).json("L'Email ne peut pas être vide")}
    if(validator.isEmpty(req.body.username)){return res.status(403).json("L'Username ne peut pas être vide")}
    if(validator.isEmpty(req.body.password)){return res.status(403).json("Le Mot de passe ne peut pas être vide")}
    if(!validator.isEmail(req.body.email)){return res.status(403).json("L'Email est invalide")}
    if(!validator.isLength(req.body.email,{min:5, max:30})){return res.status(403).json("L'Email doit avoir entre 5 à 30 carractères")}
    if(!validator.isLength(req.body.username,{min:5, max:30})){return res.status(403).json("L'Username doit avoir entre 5 à 30 carractères")}
    if(!validator.isLength(req.body.password,{min:5, max:30})){return res.status(403).json("Le Mot de passe doit avoir entre 5 à 30 carractères")}

    // vérifier si l'adresse email est déjà utilisé
    models.User.findOne({attributes:['id'], where : {email:req.body.email}})
    .then((data)=>{
        if(data){return res.status(403).json("Adresse email déjà utilisée")}
        else{
            // vérifier si l'username est déjà utilisé
            models.User.findOne({attributes:['id'], where:{username:req.body.username}})
            .then((dataUsername)=>{
                if(dataUsername){return res.status(403).json("Username déjà utilisé")}
                else{
                    // créer le compte
                    createAccount(req.body.email, req.body.username ,req.body.password)
                }
            })
            .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
        }
    })
    .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

    // fonction créer un compte
    function createAccount(myEMAIL,myUSERNAME,myPASSWORD){
        models.User.create({
            email:myEMAIL,
            username:myUSERNAME,
            password:bcrypt.hashSync(myPASSWORD, 5)
        })
        .then(()=>{showMyId()})
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
    }

    // fonction afficher l'ID du nouveau utilisateur
    function showMyId(){
        models.User.findOne({attributes:['id','username'], where:{username:req.body.username}})
        .then((dataXX)=>{
            const token = jwt.sign({
                id:dataXX.id,
                username:dataXX.username,
                isAdmin:false,
                isProfil:false
            },process.env.SECTOKEN ,{expiresIn:'48h'})
            return res.status(200).json({
                'token':token,
                'id':dataXX.id,
                'username':dataXX.username,
                'isAdmin':false,
                'isProfil':false
            })
        })
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
    }
})

///////////////////////////////////////////////////
///////// SE CONNECTER
///////////////////////////////////////////////////
userRoutes.post('/user/login', (req,res)=>{

    if(req.body.email==undefined || req.body.password==undefined)
    {return res.status(403).json("Les champs ne peuvent pas être indéfinis")}

    //Verifier les INPUT
    if(validator.isEmpty(req.body.email)){return res.status(403).json("L'Email ne peut pas être vide")}
    if(validator.isEmpty(req.body.password)){return res.status(403).json("Le Mot de passe ne peut pas être vide")}
    if(!validator.isEmail(req.body.email)){return res.status(403).json("L'Email est invalide")}
    if(!validator.isLength(req.body.email,{min:5, max:30})){return res.status(403).json("L'Email doit avoir entre 5 à 30 carractères")}
    if(!validator.isLength(req.body.password,{min:5, max:30})){return res.status(403).json("Le Mot de passe doit avoir entre 5 à 30 carractères")}

    models.User.findOne({attributes:['id','username','password','isAdmin','isProfil'], where:{email:req.body.email}})
    .then((data)=>{
        if(data){
            resultat = bcrypt.compareSync(req.body.password, data.password)
            if(resultat){
                const token = jwt.sign({
                    id:data.id,
                    username:data.username,
                    isAdmin:data.isAdmin,
                    isProfil:data.isProfil
                },process.env.SECTOKEN ,{expiresIn:'48h'})
                return res.status(200).json({
                    'token':token,
                    'id':data.id,
                    'username':data.username,
                    'isAdmin':data.isAdmin,
                    'isProfil':data.isProfil
                })
            }
            else{return res.status(403).json("Mot de passe incorrect")}
        }
        else{return res.status(403).json("Compte introuvable")}
    })
    .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

})

///////////////////////////////////////////////////
///////// CHANGE PASSWORD
///////////////////////////////////////////////////
userRoutes.post('/user/password', authentification, (req,res)=>{

    if(req.body.password==undefined || req.body.newpassword==undefined)
    {return res.status(403).json("Les champs ne peuvent pas être indéfinis")}

    if(validator.isEmpty(req.body.password)){return res.status(403).json("L'ancien mot de passe ne peut pas être vide")}
    if(validator.isEmpty(req.body.newpassword)){return res.status(403).json("Le nouveau mot de passe ne peut pas être vide")}

    if(!validator.isLength(req.body.password, {min:5, max:30})){return res.status(403).json("L'ancien mot de passe contient entre 5 à 30 carractères")}
    if(!validator.isLength(req.body.newpassword, {min:5, max:30})){return res.status(403).json("Le nouveau mot de passe doit contenir entre 5 à 30 carractères")}

    const token = req.headers.authorization.split(' ')[1]
    const tokenDecoded=jwt.decode(token)
    const idUser=tokenDecoded.id

    models.User.findOne({attributes:['password'], where:{id:idUser}})
    .then((data)=>{
        if(data){
            // vérifier que l'ancien mot de passe est correct
            const resultat = bcrypt.compareSync(req.body.password, data.password)
            if(resultat){
                // changer le mot de passe
                changePassword(req.body.newpassword,idUser)}
            else{return res.status(403).json("MDR INCORRECT")}
        }
        else{return res.status(403).json("Le compte n'existe pas.")}
    })
    .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

    // fonction changer le MDP
    function changePassword(myNewPassword, myID){
        models.User.update({password:bcrypt.hashSync(myNewPassword,5)},{where:{id:myID}})
        .then(()=>{return res.status(200).json("Mot de passe changé avec succès")})
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
    }
    
})

///////////////////////////////////////////////////
///////// DELETE ACCOUNT
///////////////////////////////////////////////////
userRoutes.post('/user/delete',authentification, (req,res)=>{

    if(req.body.password==undefined)
    {return res.status(403).json("Le mot de passe ne peut pas être indéfini")}

    if(validator.isEmpty(req.body.password)){return res.status(403).json("Le mot de passe ne peut pas être vide")}
    if(!validator.isLength(req.body.password, {min:5, max:30})){return res.status(403).json("Le mot de passe contient entre 5 à 30 carractères")}

    const token = req.headers.authorization.split(' ')[1]
    const tokenDecoded=jwt.decode(token)
    const idUser=tokenDecoded.id

    models.User.findOne({attributes:['password'], where:{id:idUser}})
    .then((data)=>{
        if(data){
            // vérifier que l'ancien mot de passe est correct
            const resultat = bcrypt.compareSync(req.body.password, data.password)
            if(resultat){
                // supprimer le compte
                deleteAccount(idUser)}
            else{return res.status(403).json("Mot de passe incorrect")}
        }
        else{return res.status(403).json("Le compte n'existe pas.")}
    })
    .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

    // fonction changer le MDP
    function deleteAccount(myID){
        models.User.destroy({where:{id:myID}})
        .then(()=>{return res.status(200).json("Compte supprimé avec succès")})
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
    }
})

module.exports=userRoutes