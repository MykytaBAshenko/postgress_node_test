const express = require("express")
const app = express()
const cors = require("cors")
app.use(cors())
app.use(express.json())
const pgp = require('pg-promise')()
const cn = {
  user: "postgres",
  password: "password",
  host: "localhost",
  port: 5432,
  database: "postgresnodetest"
}
const db = pgp(cn)

app.post("/users/add", async (req, res) => {  
  if(req?.body?.username)
  db.one('INSERT INTO "User" (username) VALUES($1) RETURNING id',[req.body.username]).then(data => 
    res.status(200).json({
      new_user_id:data.id
    })
    ).catch(err=>
      res.status(400).json({error:err.detail})
    )
  else
    res.status(400).json({error:"'username' is empty"})
});

let findDuplicates = arr => arr.filter((item, index) => arr.indexOf(item) != index)

app.post("/chats/add", async (req, res) => {  
  if(req?.body?.name && req?.body?.users){
    for(let gg = 0; gg < req?.body?.users.length;gg++)
      if(Number.isInteger(Number(req?.body?.users[gg])))
          req.body.users[gg] = Number.parseInt(req.body.users[gg])
      else 
        return  res.status(400).json({error:"Bad User ID"})
    if(findDuplicates(req.body.users).length)
      return  res.status(400).json({error:"User id has a not unique value"})
    else {
        db.any(`SELECT * FROM "User" WHERE id IN (${req.body.users.map((a,i)=>{
        if(i === 0)
          return "$1"
        else 
          return `$${i+1}`
      })});`,req.body.users).then(data=>{
        if(req.body.users.length > data.length)
          return res.status(400).json({error: "user/users from the list does not exist"})
        else 
        db.one('INSERT INTO "Chat" (name,users) VALUES($1,$2) RETURNING id',[req?.body?.name,req?.body?.users]).then(data =>
          res.status(200).json(data)
        ).catch(
          err => res.status(400).json({error:err.detail})
        )
      })
    }}
  else
    res.status(400).json({error:"Empty values"})
})

app.post("/messages/add", async (req, res) => {  
  if(req?.body?.chat && req?.body?.author && req?.body?.text) {
    if(!Number.isInteger(Number(req?.body?.chat)))
      return res.status(400).json({error:"Bad chat ID"})
    if(!Number.isInteger(Number(req?.body?.author)))
      return  res.status(400).json({error:"Bad author ID"})
    db.one('SELECT * FROM "User" WHERE id IN ($1)',[Number.parseInt(req?.body?.author)]).then(data =>
      db.one(`SELECT * FROM "Chat" WHERE id IN ($1)`,[Number.parseInt(req?.body?.chat)]).then(data =>{
        if (data.users.indexOf(Number.parseInt(req?.body?.author)) != -1)
          db.one(`INSERT INTO "Message" (chat,author,text) VALUES($1,$2,$3) RETURNING id`,[req?.body?.chat, req?.body?.author,req?.body?.text]).then(data => 
            res.status(200).send(data)
            ).catch(
              err => res.status(400).send({error: "Something broken"})
            )
        else
          return res.status(400).send({error:"Author does not exist in chat"})
      }).catch(
        err=> res.status(400).json({error:"Chat does not exist"})
      )
    ).catch(
      err=> res.status(400).json({error:"User does not exist"})
    )
  }
  else 
  res.status(400).json({error:"Empty values"})
});

app.post("/messages/get", async (req, res) => {  
  if(req?.body?.chat){
    db.one(`SELECT * FROM "Chat" WHERE id IN ($1)`,[Number.parseInt(req?.body?.chat)]).then(data =>{
    db.any(`SELECT * FROM "Message" WHERE chat = $1 ORDER BY created_at DESC`,[req?.body?.chat]).then(data => 
      res.status(200).json(data)
      ).catch (err=> res.status(400).json({error:err}))
    }).catch(err => res.status(400).json({
      error: "Chat whit this id does not exist"
    }));
    }
  else
    res.status(400).json({error: "Value of 'chat' is empty"});
});

app.post("/chats/get", async (req, res) => {  
  if (req?.body?.user){
    if(Number.isInteger(Number(req?.body?.user))){
  db.one('SELECT * FROM "User" WHERE id IN ($1)',[req?.body?.user]).then(data =>
    db.any(`SELECT * FROM "Chat" WHERE "users" && '{$1}'::int[] ORDER BY created_at ASC`,Number.parseInt(req?.body?.user)).then(data =>{
      let ids_of_chats_that_can_be = []
      for(let l = 0; l < data.length;l++)
        ids_of_chats_that_can_be.push(data[l].id)
      if(ids_of_chats_that_can_be.length){
      db.any(`SELECT * FROM "Message" WHERE chat IN (${
        ids_of_chats_that_can_be.map((v,i) => {
          if(i == 0)
            return v
          else
            return `${v}`
        })
      }) ORDER BY created_at ASC`).then(messages=>{
        let array_of_sorted_mess = []
        for(let k = messages.length-1; k> 0;k--)
          if(array_of_sorted_mess.indexOf(messages[k].chat) === -1)
            array_of_sorted_mess.push(messages[k].chat)
        array_of_sorted_mess.reverse()
        let special_array = []
        for(let o = 0; o < array_of_sorted_mess.length;o++)
          for(let p = 0; p < data.length; p++)
            if(data[p].id === array_of_sorted_mess[o])
              special_array.push(data[p])
        for(let zq = 0; zq < data.length;zq++)
          if(array_of_sorted_mess.indexOf(data[zq].id) === -1)
            special_array.push(data[zq])
        return res.status(200).json(special_array)
      })
      .catch(e=>res.status(500).json(e))
      }
      else{
        res.status(200).json(data)
      }
    }).catch(err=> console.log(err)))
    .catch(
      err=> res.status(400).json({error:"User does not exist"})
    )}
  else
    res.status(400).json({error:"Value of 'user' isn`t number"})
  }
  else
    res.status(400).json({error:"Value of 'user' does not exist"})
})

app.listen(9000, () => {
  console.log("server has started on port 9000")
});

