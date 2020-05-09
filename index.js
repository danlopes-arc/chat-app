const app = require("express")()
const http = require("http").createServer(app)

const io = require("socket.io")(http)
var host = process.env.HOST_ADDRESS
if (!host) {
    host = "http://localhost"
}
const port = 8080

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html")
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