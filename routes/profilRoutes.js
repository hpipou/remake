const express=require('express')
const profilRoutes=express.Router()
const authentification=require('../midleware/authentification')
const models=require('../models')
const jwt=require('jsonwebtoken')
const validator=require('validator')
const multer=require('../midleware/multer')
const multerErrorCapture=require('../midleware/multerErrorCapture')

///////////////////////////////////////////////////
///////// CREER UN PROFIL
///////////////////////////////////////////////////
profilRoutes.post('/user/profil/edit', authentification,(req,res)=>{

    if(req.body.fname==undefined || req.body.lname==undefined ||  req.body.age==undefined || req.body.workplace==undefined || req.body.city==undefined || req.body.country==undefined )
    {return res.status(403).json("Les champs sont indéfinis")}

    if(validator.isEmpty(req.body.fname)){return res.status(403).json("Le prénom ne peut pas être vide")}
    if(validator.isEmpty(req.body.lname)){return res.status(403).json("Le nom de famille ne peut pas être vide")}
    //if(validator.isEmpty(req.body.age)){return res.status(403).json("L'age ne peut pas être vide")}
    if(validator.isEmpty(req.body.workplace)){return res.status(403).json("Le post de travail ne peut pas être vide")}
    if(validator.isEmpty(req.body.city)){return res.status(403).json("La ville ne peut pas être vide")}
    if(validator.isEmpty(req.body.country)){return res.status(403).json("Le pays ne peut pas être vide")}

    if(!validator.isLength(req.body.fname, {min:3, max:30})){return res.status(403).json("Le prénom doit avoir entre 3 à 30 carractère")}
    if(!validator.isLength(req.body.lname, {min:3, max:30})){return res.status(403).json("Le nom doit avoir entre 3 à 30 carractère")}
    //if(!validator.isInt(req.body.age)){return res.status(403).json("L'age ne peut pas être un string")}
    if(!validator.isLength(req.body.workplace, {min:3, max:30})){return res.status(403).json("Le post de travail doit avoir entre 3 à 30 carractère")}
    if(!validator.isLength(req.body.city, {min:3, max:30})){return res.status(403).json("La ville doit avoir entre 3 à 30 carractère")}
    if(!validator.isLength(req.body.country, {min:3, max:30})){return res.status(403).json("Le pays doit avoir entre 3 à 30 carractère")}

    const token = req.headers.authorization.split(' ')[1]
    const tokenDecoded=jwt.decode(token)
    const idUser=tokenDecoded.id

    models.User.findOne({attributes:['isProfil'], where:{id:idUser}})
    .then((dataUser)=>{
        if(dataUser){
            if(dataUser.isProfil==0){
                // alors on crée le profil
                createProfil(req.body.fname,req.body.lname,req.body.age,req.body.workplace,req.body.city,req.body.country,idUser)
            }else{
                // alors on modifi le profil
                editProfil(req.body.fname,req.body.lname,req.body.age,req.body.workplace,req.body.city,req.body.country,idUser)
            }
        }else{
            return res.status(403).json("Le compte est introuvable")
        }
    })
    .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})

    // fonction creer un profil
    function createProfil(fnam,lnam,myage,mywork,mycity,mycount,myID){
        models.Profil.create({
            fname:fnam,
            lname: lnam,
            age:myage,
            workplace:mywork,
            city:mycity,
            country:mycount,
            imageURL:"img_profil.jpg",
            idUser:myID
        })
        .then(()=>{updateIsProfil(idUser)})
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
    }

    // fonction modifier un profil
    function editProfil(fnam,lnam,myage,mywork,mycity,mycount,myID){
        models.Profil.update({
            fname:fnam,
            lname: lnam,
            age:myage,
            workplace:mywork,
            city:mycity,
            country:mycount
        }, {where:{idUser:myID}})
        .then(()=>{return res.status(201).json("Profil modifié avec succès")})
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
    }

    // fonction isProfil = 1
    function updateIsProfil(myID){
        models.User.update({isProfil:1},{where:{id:myID}})
        .then(()=>{newTokenWithIdProfil()})
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
    }

    // fonction token avec idProfil
    function newTokenWithIdProfil(){
        models.Profil.findOne({attributes:['id'], where:{idUser:idUser}})
        .then((DataProfil)=>{
            
            const tokenFinale = jwt.sign({
                id:tokenDecoded.id,
                username:tokenDecoded.username,
                isAdmin:tokenDecoded.isAdmin,
                isProfil:true,
                idProfil:DataProfil.id
            },process.env.SECTOKEN ,{expiresIn:'48h'})

            return res.status(200).json({
                'statu':'profil crée avec succès',
                'token':tokenFinale,
                'id':tokenDecoded.id,
                'idProfil': DataProfil.id,
                'username':tokenDecoded.username,
                'isAdmin':tokenDecoded.isAdmin,
                'isProfil':true
            })
        })
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")})
    }

})


///////////////////////////////////////////////////
///////// CHANGER LA PHORO DE PROFIL
///////////////////////////////////////////////////
profilRoutes.post('/user/profil/pic',authentification, multer.single('file'), multerErrorCapture ,(req,res)=>{
    
    const token = req.headers.authorization.split(' ')[1]
    const tokenDecoded=jwt.decode(token)
    const idUser=tokenDecoded.id

    if(!req.file){return res.status(403).json("Image introuvable")}
    else{
        models.Profil.update({imageURL:req.file.filename}, {where:{idUser:idUser}})
        .then(()=>{return res.status(201).json("Image mise à jour avec succès")})
        .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")}) 
    }
    
})

///////////////////////////////////////////////////
///////// AFFICHER UN PROFIL & SES PUBLICATIONS
///////////////////////////////////////////////////
profilRoutes.get('/user/profil/view',authentification ,(req,res)=>{

    const token = req.headers.authorization.split(' ')[1]
    const tokenDecoded = jwt.decode(token)
    const idUser=tokenDecoded.id

    models.Profil.findOne({attributes:['id','fname','lname','age','workplace','city','country','imageURL'], where:{idUser:idUser}, 
                            include:[{model:models.User, attributes:['id','username','isAdmin']}]})
    .then((data)=>{
        if(data){

            // Data Publication
            models.Publication.findAll({attributes:['message','imageURL','nbLike','nbDislike','nbCommentaire'],where:{idUser:idUser}})
            .then((dataPublication)=>{return res.status(201).json({'user': data,'Publication':dataPublication})})
            .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")}) 

        }else{
            return res.status(403).json("Utilisateur introuvable")
        }
    })
    .catch(()=>{return res.status(500).json("ERREUR DE CONNEXION AUX BDD")}) 
})

module.exports=profilRoutes