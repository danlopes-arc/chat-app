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