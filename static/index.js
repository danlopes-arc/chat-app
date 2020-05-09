var byId = (id) => document.getElementById(id)
document.addEventListener("DOMContentLoaded", () => {
    const socket = io()
    byId("form").onsubmit = (e) => {
        socket.emit("chat message", byId("m").value)
        byId("m").value = ""
        return false
    }
    socket.on("sent all", msg => {
        const li = document.createElement("li")
        li.innerText = msg
        byId("messages").append(li)
    })
    socket.on("sent others", msg => {
        console.log("sent others")
    })
    socket.on("sent mine", msg => {
        console.log("sent mine")
    })
})