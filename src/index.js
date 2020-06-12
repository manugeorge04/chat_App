const path = require('path')    
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = new express()
const server =  http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))

let count = 0

io.on('connection', (socket) => {   //socket is the connection value of the particular client
  console.log("New WebSocket connection initialized")  
  
  socket.on('join', ({ username, room }, callback) => {    
    const {user, error} = addUser({id: socket.id, username, room})
    if(error){
      return callback(error)
    }

    socket.join(user.room)
    
    socket.emit('message', generateMessage('Admin', 'Welcome!'))
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))    
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback()
    // socket.emit, io.emit, socket.broadcast.emit
    // io.to.emit, socket.broadcast.to.emit
})

  socket.on('sendMessage', (text, acknowledgement) => {
    const user = getUser(socket.id)    
    filter = new Filter()
    if(filter.isProfane(text)){
      return acknowledgement('Profanity not allowed')
    }
    io.to(user.room).emit('message', generateMessage(user.username, text))  //io.emit emits to all sockets
    acknowledgement()
  })

  socket.on('sendLocation', ({latitude, longitude}, acknowledgement) => {
    const user = getUser(socket.id)    
    //io.emit('message', ("Location "+latitude+", "+longitude)) io.emit('message', (`Location ${latitude}, ${longitude}`))
    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${latitude},${longitude}`))
    acknowledgement('Location shared!')
  })

  socket.on('disconnect', () => {  //disconnect and connection are handled by the socket.io library; so we dont have to handle it explicitly
    const user = removeUser(socket.id)
    if (user) {
      io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`)) //we dont use bradcast here as it isn't neccessary; this user is anyway disconnected so he wont get the message
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }    
  })
})

server.listen(port, () => {
    console.log(`server is up on port ${port}`)
})
