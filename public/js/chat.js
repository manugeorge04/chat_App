const socket = io() //you get the socket

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('#message')
const $messageFormButton = $messageForm.querySelector('#sendMessageBtn')
const $sendLocationButton = document.querySelector('#locationBtn')
const $messages = document.querySelector("#messages")

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const urlTemplate = document.querySelector('#url-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (msg) => {    
    const html = Mustache.render(messageTemplate, {
        userName: msg.username,
        message:msg.text,
        createdAt:moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (locationMessage) => {
    console.log(locationMessage)    
    const html = Mustache.render(urlTemplate, {
        userName: locationMessage.username,
        url: locationMessage.url, 
        linkText: "This is my location",
        createdAt:moment(locationMessage.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled') //disables form

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')     //enable the form; 
        $messageFormInput.value = ''                     
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (ackMessage) => {
            $sendLocationButton.removeAttribute('disabled')  //enable only after sending the location
            console.log(ackMessage)                          //hence we put it under the ack
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if (error){
        alert(error)
        location.href = '/'
    }    
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })    
    document.querySelector('#sidebar').innerHTML = html
})
// document.querySelector('#sendMessageBtn').addEventListener('click', () => {    
//     text = document.querySelector('#message').value
//     socket.emit('sendMessage', text, (ackMessage) => { //the last function is the acknwlegment
//                                                        //it is called by cooresponding 'on' to signify successfull delivery  
//         if (ackMessage){
//             console.log(ackMessage)
//         }else {
//             console.log("Message Delivered")
//         }        
//     })
// })//if using forms you can directly use e.target.elements.<nameIsMessage>.value  //section 156 min 15:07

// document.querySelector('#locationBtn').addEventListener('click', () => {
//     if(!navigator.geolocation){
//        return alert('Your browser does not support location sharing')
//     }
//     navigator.geolocation.getCurrentPosition((position) => {
//         socket.emit('sendLocation', {latitude: position.coords.latitude,longitude: position.coords.longitude}, (ackMessage) => {
//             console.log(ackMessage)
//         })
//     })
// })