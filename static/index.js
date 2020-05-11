var byId = (id) => document.getElementById(id)
document.addEventListener("DOMContentLoaded", () => {
    const socket = io()
    let user = null
    let checkingTyping = false
    
    const typingAnnouncer = {
        busy: false,
        next: new Map(), //{user: keep}
        stopped: false,
        stop() {
            this.stopped = true
            this.next.clear()
            this.busy = false
        },
        start() {
            this.stopped = false
        },
        requestAnnounce(user) {
            if (this.stopped) {
                return
            }
            function setFeed(user) {
                byId("activity-feed").innerText = `${user.username} is typing`
            }
            function clearFeed() {
                byId("activity-feed").innerText = ""
            }
            if (this.busy) {
                let found = false
                this.next.forEach((keep, userCheck, map) => {
                    if (!found && userCheck.id === user.id) {
                        map.set(userCheck, true)
                        found = true
                    }
                });
                if (!found) {
                    this.next.set(user, true)
                }
                return
            }
            setFeed(user)
            this.busy = true
            function checkNext(announcer) {
                if (announcer.next.size === 0) {
                    clearFeed()
                    announcer.busy = false
                    return
                }
                announcer.next.forEach((keep, userCheck, map) => {
                    if (keep) {
                        map.set(userCheck, false)
                    } else {
                        map.delete(userCheck)
                    }
                })
                const firstUser = announcer.next.keys().next().value
                setFeed(firstUser)
                announcer.next.delete(firstUser)
                setTimeout(() => checkNext(announcer), 2000)
            }
            setTimeout(() => checkNext(this), 2000)

        }
    }

    byId("form").onsubmit = (e) => {
        const text = byId("message-input").value
        byId("message-input").value = ""
        socket.emit("client message", {user: user, text: text})
        return false
    }

    byId("message-input").oninput = (e) => {
        if (checkingTyping) {
            return
        }
        const input = e.target
        function checkTyping() {
            if (input.value.length === 0) {
                clearInterval(checkTyping)
                checkTyping = false
                return
            }
            socket.emit("client typing", user)
        }
        socket.emit("client typing", user)
        setInterval(checkTyping, 1000);
        checkTyping = true
    }
    
    socket.on("connection accepted", userPayload => {
        // user = userPayload
        requireLogin()
    })

    function messagesToNodes(...msgs) {
        const elms = []
        msgs.forEach(msg => {
            const li = document.createElement("li")
            const strong = document.createElement("strong")
            const datetime = new Date(msg.datetime)
            const datetimeString = `${datetime.getHours().toString().padStart(2, 0)}:${datetime.getMinutes().toString().padStart(2, 0)}:${datetime.getSeconds().toString().padStart(2, 0)}`
            strong.innerText = msg.user.username
            li.innerHTML = `${datetimeString} ${strong.outerHTML} ${msg.text}`
            elms.push(li)
        })
        return elms
    }
    function prependMessages(...msgs) {
        const nodes = messagesToNodes(...msgs)
        byId("messages").prepend(...nodes)
    }
    function appendMessages(...msgs) {
        const nodes = messagesToNodes(...msgs)
        byId("messages").append(...nodes)
    }

    socket.on("server message", msg => appendMessages(msg))

    socket.on("server typing", userPayload => {
        typingAnnouncer.requestAnnounce(userPayload)
    })

    socket.on("disconnect", (reason) => {
        disableMain()
    })

    function disableMain() {
        typingAnnouncer.stop()
        byId("message-input").setAttribute("disabled", "disabled")
        byId("message-input").setAttribute("placeholder", "Connecting...")
        byId("btn-submit").setAttribute("disabled", "disabled")
        byId("connection-text").innerText = "Disconnected"
        byId("header-user-id").innerText = ""
    }
    function loadMain() {
        typingAnnouncer.start()
        byId("message-input").removeAttribute("disabled")
        byId("message-input").setAttribute("placeholder", "Type a message")
        byId("btn-submit").removeAttribute("disabled")
        byId("connection-text").innerText = "Connected as "
        byId("header-user-id").innerText = user.username

        byId("messages").querySelectorAll("li").forEach(el => el.remove())
        const request = new XMLHttpRequest()
            request.open("GET", `/messages`)
            request.onload = () => {
                if (request.status !== 200) {
                    return
                }
                const messages = JSON.parse(request.response)
                console.log(messages)
                appendMessages(...messages)
            }
            request.send()

    }

    function loadLogin() {
        if (byId("login-form")) return
        disableMain()
        const form = document.createElement("form")
        form.id = "login-form"

        const inputUsername = document.createElement("input")
        inputUsername.id = "login-username"
        inputUsername.type = "text"
        inputUsername.autocomplete = "off"
        inputUsername.placeholder = "Username"

        const inputPassword = document.createElement("input")
        inputPassword.id = "login-password"
        inputPassword.type = "password"
        inputPassword.placeholder = "Password"

        const button = document.createElement("button")
        button.id = "login-submit"
        button.innerText = "Login"

        form.append(inputUsername, inputPassword, button)

        document.body.prepend(form)

        form.onsubmit = () => {
            const request = new XMLHttpRequest()
            request.open("POST", `/users`)
            request.onload = () => {
                if (request.status !== 200) {
                    return
                }
                const payload = JSON.parse(request.response)
                user = {
                    id: payload.id,
                    username: payload.username
                }
                window.localStorage.setItem("userId", user.id)
                form.remove()
                loadMain()
            }
            const data = new FormData()
            data.set("username", inputUsername.value)
            data.set("password", inputPassword.value)
            request.send(data)
            return false
        }
    }

    function requireLogin() {
        let userId = localStorage.getItem("userId")
        if (userId === null) {
            loadLogin()
            return
        }
        else {
            const request = new XMLHttpRequest()
            request.open("GET", `/users/${userId}`)
            request.onload = () => {
                if (request.status !== 200) {
                    loadLogin()
                    return
                }
                user = JSON.parse(request.response)
                localStorage.setItem("userId", user.id)
                loadMain()
            }
            request.send()
        }
    }
})
