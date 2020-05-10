var byId = (id) => document.getElementById(id)
document.addEventListener("DOMContentLoaded", () => {
    const socket = io()
    let user = null
    let checkingTyping = false

    // const typingAnnouncer = {
    //     busy: false,
    //     next: null,
    //     announce(user) {
    //         function setFeed(user) {
    //             byId("activity-feed").innerText = `user#${user.id} is typing`
    //         }
    //         function clearFeed() {
    //             byId("activity-feed").innerText = ""
    //         }
    //         if (this.busy) {
    //             this.next = user
    //             return
    //         }
    //         setFeed(user)
    //         this.busy = true
    //         function checkNext(announcer) {
    //             if (announcer.next === null) {
    //                 clearFeed()
    //                 announcer.busy = false
    //                 return
    //             }
    //             setFeed(announcer.next)
    //             announcer.next = null
    //             setTimeout(() => checkNext(announcer), 2000)
    //         }
    //         setTimeout(() => checkNext(this), 2000)

    //     }
    // }
    const typingAnnouncer = {
        busy: false,
        next: new Map(), //{user: keep}
        announce(user) {
            function setFeed(user) {
                byId("activity-feed").innerText = `user#${user.id} is typing`
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
        user = userPayload
        byId("message-input").removeAttribute("disabled")
        byId("message-input").setAttribute("placeholder", "Type a message")
        byId("btn-submit").removeAttribute("disabled")
        byId("header-user-id").innerText = `user#${user.id}`
    })

    socket.on("server message", msg => {
        const li = document.createElement("li")
        const strong = document.createElement("strong")
        strong.innerText = `user#${msg.user.id}:`
        li.innerHTML = `${strong.outerHTML} ${msg.text}`
        byId("messages").append(li)
    })

    socket.on("server typing", userPayload => {
        console.log("server typing")
        typingAnnouncer.announce(userPayload)
    })
})
