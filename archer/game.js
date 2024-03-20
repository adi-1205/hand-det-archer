const canvas = document.getElementById('game-canvas')
const ctx = canvas.getContext('2d')
canvas.height = innerHeight || 480
canvas.width = innerWidth || 680
canvas.midX = canvas.width / 2
canvas.midY = canvas.height / 2
const mouse = {
    x: 0,
    y: 0
}
const ARROW_SPEED = 40

class Bow {

    constructor(x, y, radiusX, radiusY, color) {
        this.x = x
        this.y = y
        this.radiusX = radiusX,
            this.radiusY = radiusY
        this.color = color
        this.rotation = 0
    }

    update() {
        this.draw()
        this.rotation = Math.atan2(bow.y - mouse.y, bow.x - mouse.x) - Math.PI / 2
    }

    draw() {
        ctx.beginPath()
        ctx.strokeStyle = this.color
        ctx.ellipse(this.x, this.y, this.radiusX, this.radiusY, this.rotation, degToRad(-135), degToRad(-45))
        ctx.stroke()
    }
}

class Balloon {
    constructor(x, y, radius, color) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
    }

    update() {
        this.draw()
    }


    draw() {
        ctx.beginPath()
        ctx.fillStyle = this.color
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fill()
    }
}

class Arrow {
    constructor(x, y, color) {
        this.x = x
        this.y = y
        this.height = 100
        this.endX = x
        this.endY = this.y - this.height
        this.color = color
        this.isShot = false
        this.velocity = {
            x: 0,
            y: 0
        }

        this.initialPos = {
            x: x,
            y: y,
            endX: x,
            endY: y - this.height,
            isShot: false,
            velocity: {
                x: 0,
                y: 40
            }
        }
    }

    reset() {
        this.x = this.initialPos.x
        this.y = this.initialPos.y
        this.isShot = false
        this.velocity = {
            x: 0,
            y: 0
        }
        let angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        this.endX = this.x + Math.cos(angle) * this.height
        this.endY = this.y + Math.sin(angle) * this.height
    }

    update() {
        this.draw()

        if (!this.isShot) {
            let angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
            this.endX = this.x + Math.cos(angle) * this.height
            this.endY = this.y + Math.sin(angle) * this.height
        }
        this.x += this.velocity.x * ARROW_SPEED
        this.y += this.velocity.y * ARROW_SPEED
        this.endX += this.velocity.x * ARROW_SPEED
        this.endY += this.velocity.y * ARROW_SPEED

        if (this.x < 80 || this.x > canvas.width ||
            this.y < 80 || this.y > canvas.height) {
            this.reset()
        }
    }

    draw() {
        ctx.beginPath()
        ctx.strokeStyle = this.color
        ctx.moveTo(this.x, this.y)
        ctx.lineTo(this.endX, this.endY)
        ctx.stroke()
    }
}

let bow = new Bow(canvas.midX, canvas.height - 50, 100, 70, 'white')
let arrow = new Arrow(canvas.midX, canvas.height - 50, 'white')
let balloons = []

for (let i = 1; i < 10; i++) {
    balloons.push(
        new Balloon(i * canvas.width / 10, 50, 30, 'mediumseagreen')
    )
}

// let balloon = new Balloon(5 * 68, 50, 30, 'green')

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    requestAnimationFrame(animate)
    drawBackground()
    bow.update()
    arrow.update()
    for (let [index, balloon] of balloons.entries()) {
        balloon.update()
        let dist = Math.hypot(
            balloon.x - arrow.endX,
            balloon.y - arrow.endY
        )
        if (dist <= balloon.radius) {
            balloon.color = 'red'
            setTimeout(() => {
                balloons.splice(index, 1)
            }, 0)
        }
        // console.log(dist);
    }

}

function drawBackground() {
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.9)'
    ctx.rect(0, 0, canvas.width, canvas.height)
    ctx.fill()
    ctx.restore()
}

addEventListener('mousemove', (e) => {
    mouse.x = e.x
    mouse.y = e.y
})
addEventListener('click', (e) => {
    if (!arrow.isShot) {
        let angle = Math.atan2(mouse.y - arrow.y, mouse.x - arrow.x);
        arrow.velocity.x = Math.cos(angle)
        arrow.velocity.y = Math.sin(angle)
    }
    arrow.isShot = true
})

animate()



// HELPERS

function degToRad(deg) {
    return deg * Math.PI / 180
}
