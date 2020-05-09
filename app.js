const fs = require("fs")
const app = require("express")()
const http = require("http").createServer(app)

const io = require("socket.io")(http)
var host = process.env.HOST_ADDRESS
if (!host) {
    host = "http://localhost"
}
const port = 8080

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/static/index.html")
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
    console.log("a user connected")
    socket.on("disconnect", () => {
        console.log("a user disconnected")
    })
    socket.on("chat message", msg => {
        console.log("user message: " + msg)
        socket.broadcast.emit("sent others", msg)
        io.emit("sent all", msg)
        socket.emit("sent mine", msg)
    })
})

http.listen(port, () => {
    console.log(`Listening to: ${host}:${port}`)
})