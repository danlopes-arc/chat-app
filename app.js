class User {
    constructor(id) {
        this.id = id
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

const fs = require("fs")
const app = require("express")()
const http = require("http").createServer(app)

const io = require("socket.io")(http)
var host = process.env.HOST_ADDRESS
if (!host) {
    host = "http://localhost"
}
const port = 8080

const users = []
const messages = []

app.set("views", "./views")
app.set("view engine", "pug")

app.get("/", (req, res) => {
    // res.sendFile(__dirname + "/static/index.html")
    res.render("index", {title: "Opa", message: "Hello There!"})
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
    const user = new User(users.length)
    users.push(user)
    console.log(`Connected: ${user.id}`)

    socket.emit("connection accepted", user)

    socket.on("disconnect", () => {
        console.log(`Disconnected: ${user.id}`)
    })

    socket.on("client message", msg => {
        console.log(`From ${msg.user.id}: ${msg.text}`)
        io.emit("server message", msg)
        // socket.emit("sent mine", msg)
    })

    socket.on("client typing", userPayload => {
        console.log(`${userPayload.id} is typing`)
        socket.broadcast.emit("server typing", userPayload)
        // socket.emit("sent mine", msg)
    })
})

http.listen(port, () => {
    console.log(`Listening to: ${host}:${port}`)
})