class User {
    constructor(id, username, password) {
        this.id = id
        this.username = username
        this.password = password
    }
}
class Message {
    constructor(user, text, datetime) {
        this.user = user
        this.text = text
        if (datetime) {
            this.datetime = datetime
        }
        else {
            this.datetime = Date()
        }
    }
}
const express = require("express")
const fs = require("fs")
const app = require("express")()
const http = require("http").createServer(app)
const io = require("socket.io")(http)
const bodyParser = require("body-parser")
const multer = require("multer")
const upload = multer()

var host = process.env.HOST_ADDRESS
if (!host) {
    host = "http://localhost"
}
const port = 8080

const users = []
const messages = []

app.set("views", "./views")
app.set("view engine", "pug")
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(upload.array())
app.use(express.static("public"))

app.get("/", (req, res) => {
    // res.sendFile(__dirname + "/static/index.html")
    res.render("index", {title: "Opa", message: "Hello There!"})
})

app.route("/users/:id")
.get((req, res) => {
    const id = parseInt(req.params.id)
    if (id >= 0 && id < users.length) {
        res.send(users[id])
        return
    }
    res.sendStatus(404)
})
app.route("/users")
.post((req, res) => {
    const username = req.body.username
    const password = req.body.password
    let user = users.find(user => user.username === username)
    if (user == null) {
        user = new User(users.length, username, password)
        users.push(user)
        res.send({ id: user.id, username: user.username })
        return
    }
    if (user.password !== password) {
        res.sendStatus(403)
        return
    }
    res.send({ id: user.id, username: user.username })
})

app.route("/messages")
.get((req, res) => {
    let size = req.query.size
    let reference = req.query.reference
    let reqMessages = []
    if (!size) {
        size = 20
    }
    if (!reference) {
        reference = messages.length - 1
    }
    let end = reference + 1
    let start = Math.max(end - size, 0)
    reqMessages = messages.slice(start, end)
    res.send(reqMessages)
})

app.get("/static/*", (req, res) => {
    const path = req.path
    const file = __dirname + path
    if (!fs.existsSync(file)) {
        res.sendStatus(404)
        return
    }
    res.sendFile(file)
})

io.on("connection", socket => {
    socket.emit("connection accepted")

    socket.on("disconnect", () => {
        console.log(`Disconnected`)
    })

    socket.on("client message", msg => {
        console.log(`From ${msg.user.username}: ${msg.text}`)
        user = users.find(user => user.id == msg.user.id)
        console.log(`From ${user.username}: ${msg.text}`)
        if (user == null) return
        const message = new Message(user, msg.text, Date.now())
        messages.push(message)
        io.emit("server message", message)
        // socket.emit("sent mine", msg)
    })

    socket.on("client typing", userPayload => {
        socket.broadcast.emit("server typing", userPayload)
        // socket.emit("sent mine", msg)
    })
})

http.listen(port, () => {
    console.log(`Listening to: ${host}:${port}`)
})