const express=require('express')
const app=express()
const bodyParser=require('body-parser')
const cors = require('cors')

const userRoutes=require('./routes/userRoutes')
const profilRoutes=require('./routes/profilRoutes')
const likeRoutes=require('./routes/likeRoutes')
const publicationRoutes=require('./routes/publicationRoutes')
const commentaireRoutes=require('./routes/commentaireRoutes')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(cors())


app.use('', userRoutes)
app.use('', profilRoutes)
app.use('', publicationRoutes)
app.use('', commentaireRoutes)
app.use('', likeRoutes)

app.listen(80, ()=>{console.log("SERVER START => ")})