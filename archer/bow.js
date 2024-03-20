const canvas = document.getElementById('game-canvas')
const arrowImage = document.getElementById('arrow-img') // 26x286
const bowImage = document.getElementById('bow-img') //380x75

const ctx = canvas.getContext('2d')
canvas.setAttribute('width', innerWidth);
canvas.setAttribute('height', innerHeight);

canvas.midX = canvas.width / 2
canvas.midY = canvas.height / 2
const mouse = {
    x: 0,
    y: 0
}
const ARROW_SPEED = 20
const colors = ["#5E1675", "#EE4266", "#FFD23F", "#337357"];
let balloonColors = generateBeautifulColors(10);

class Bow {

    constructor() {
        this.width = bowImage.width / 2
        this.height = bowImage.height / 2
        this.x = canvas.midX
        this.y = canvas.height - arrow.height
    }

    reset() {
        this.width = bowImage.width / 2
        this.height = bowImage.height / 2
        this.x = canvas.midX
        this.y = canvas.height - arrow.height
        // this.angle = -Math.PI / 2
    }

    update() {
        // drawArc(this.x, this.y, 'green')
        ctx.save()
        const isArrowShot = emitEvent('get arrow isShot');
        const arrowX = emitEvent('get arrow x');
        const arrowY = emitEvent('get arrow y');
        const arrowMidY = emitEvent('get arrow midY');
        const arrowDrawLength = emitEvent('get arrow drawLength');
        let angle = isArrowShot ? emitEvent('get arrow shootAngle') : emitEvent('get arrow aimAngle');
        ctx.translate(this.x, this.y)
        ctx.rotate(angle + Math.PI / 2)
        ctx.translate(-this.x, -this.y)
        if (!isArrowShot) {
            ctx.strokeStyle = 'white';
            ctx.beginPath();
            ctx.moveTo(this.x - this.width / 2, this.y + this.height);
            ctx.lineTo(this.x, this.y + arrowMidY + arrowDrawLength);
            ctx.moveTo(this.x, this.y + arrowMidY + arrowDrawLength);
            ctx.lineTo(this.x + this.width / 2, this.y + this.height);
            ctx.stroke();
            ctx.closePath();
        }
        this.draw()
        ctx.restore()
    }

    draw() {
        ctx.drawImage(bowImage, this.x - this.width / 2, this.y, this.width, this.height)
    }
}

class Arrow {

    constructor() {
        this.width = arrowImage.width / 2
        this.height = arrowImage.height / 2
        this.midX = this.width / 2
        this.midY = this.height / 2
        this.x = canvas.midX
        this.y = canvas.height - this.height
        this.isShot = false
        this.shootAngle = -Math.PI / 2
        this.aimAngle = -Math.PI / 2
        this.drawLength = -30
        this.velocity = {
            x: 0,
            y: 0
        }
    }

    reset() {
        this.x = canvas.midX
        this.y = canvas.height - this.height
        this.isShot = false
        this.drawLength = -30
        this.velocity = {
            x: 0,
            y: 0
        }
    }

    update() {
        // drawArc(this.x, this.y, 'blue')
        ctx.save()
        // let angle = this.aimAngle;
        let angle = this.isShot ? this.shootAngle : this.aimAngle;
        this.x += this.velocity.x * mapValue(this.drawLength)
        this.y += this.velocity.y * mapValue(this.drawLength)
        ctx.translate(this.x, this.y)
        ctx.rotate(angle + Math.PI / 2)
        ctx.translate(-this.x, -this.y)
        this.draw()

        ctx.restore()


        if ((this.x + this.midY) < 0 ||
            (this.x - this.midY) > canvas.width ||
            (this.y + this.midY) < 0 ||
            (this.y - this.midY) > canvas.height) {
            this.reset()
            emitEvent('reset bow')
            // emitEvent('reset balloon')
        }
    }

    draw() {
        ctx.drawImage(arrowImage, this.x - this.midX, this.y - this.midY + this.drawLength, this.width, this.height)
        // ctx.drawImage(arrowImage, 0, 0, arrowImage.width, arrowImage.height,
        //     this.x - this.width / 2, this.y - this.height / 2, this.width, this.height)
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

class Particle {
    constructor(x, y, radius, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.velocity = velocity
        this.opacity = 1
        this.color = randomColor()
    }
    update() {
        this.draw()
        this.velocity.y += 0.2
        this.x += this.velocity.x
        this.y += this.velocity.y
        this.y += 1
        this.opacity -= 0.01
    }
    draw() {
        ctx.save()
        ctx.beginPath()
        ctx.globalAlpha = this.opacity
        ctx.fillStyle = this.color
        ctx.arc(this.x, this.y, this.radius, degToRad(0), degToRad(360))
        ctx.fill()
        ctx.restore()
    }
}


const arrow = new Arrow()
const bow = new Bow()
const balloons = []
const particles = [];

for (let i = 1; i < 10; i++) {
    const balloon = new Balloon(i * canvas.width / 10, 50, 30, balloonColors[i])
    balloons.push(balloon)
}


function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    requestAnimationFrame(animate)
    // setTimeout(animate, 1000)
    drawBackground()
    bow.update()
    arrow.update()
    balloons.forEach((balloon, index) => {
        balloon.update()
        let pX = arrow.x + Math.sin(arrow.aimAngle + Math.PI / 2) * (arrow.midY - arrow.drawLength)
        let pY = arrow.y + Math.cos(arrow.aimAngle - Math.PI / 2)* (arrow.midY - arrow.drawLength)
        let dist = Math.hypot(
            balloon.x - pX,
            balloon.y - pY
        )
        if (dist <= balloon.radius) {
            setTimeout(() => {
                generateParticals(balloon.x, balloon.y)
                balloons.splice(index, 1)
            }, 0)
        }
    })
    particles.forEach((particle, index) => {
        particle.update();
        if (particle.opacity < 0) {
            particles.splice(index, 1)
        }
    });
}

animate()

function drawBackground() {
    ctx.save()
    ctx.fillStyle = '#222'
    ctx.rect(0, 0, canvas.width, canvas.height)
    ctx.fill()
    ctx.restore()
}

// addEventListener('mousemove', (e) => {
//     if (!arrow.isShot) {
//         mouse.x = e.x
//         mouse.y = e.y
//         arrow.aimAngle = Math.atan2(mouse.y - arrow.y, mouse.x - arrow.x)
//     }
// })

// addEventListener('click', (e) => {
//     if (
//         mapValue(arrow.drawLength) &&
//         !arrow.isShot) {
//         let angle = Math.atan2(mouse.y - arrow.y, mouse.x - arrow.x);
//         arrow.velocity.x = Math.cos(angle)
//         arrow.velocity.y = Math.sin(angle)
//         arrow.isShot = true
//         arrow.shootAngle = angle
//     }
// })


addEventListener('keypress', (e) => {
    switch (e.key) {
        case 'a':
            arrow.aimAngle -= 0.09
            break;
        case 'd':
            arrow.aimAngle += 0.09
            break;
        case 'w':
            if (arrow.drawLength > -35) {
                arrow.drawLength -= 5
            }
            break;
        case 's':
            if (arrow.drawLength < 50) {
                arrow.drawLength += 5
            }
            break;
        case ' ':
            if (
                mapValue(arrow.drawLength) &&
                !arrow.isShot) {
                arrow.velocity.x = Math.cos(arrow.aimAngle)
                arrow.velocity.y = Math.sin(arrow.aimAngle)
                arrow.isShot = true
                arrow.shootAngle = arrow.aimAngle
            }
            break
    }
})

// Event Handlers

function emitEvent(e) {
    switch (e) {
        case 'reset bow':
            bow.reset()
            break
        case 'get arrow isShot':
            return arrow.isShot
        case 'get arrow shootAngle':
            return arrow.shootAngle
        case 'get arrow aimAngle':
            return arrow.aimAngle
        case 'get arrow x':
            return arrow.x
        case 'get arrow y':
            return arrow.y
        case 'get arrow midX':
            return arrow.midX
        case 'get arrow midY':
            return arrow.midY
        case 'get arrow drawLength':
            return arrow.drawLength

    }
}


function drawArc(x, y, color) {
    ctx.save()
    ctx.beginPath()
    ctx.fillStyle = color
    ctx.arc(x, y, 5, degToRad(0), degToRad(360))
    ctx.fill()
    ctx.restore()
}


function generateParticals(x, y) {
    for (let i = 0; i < 40; i++) {
        const particle = new Particle(x, y,
            randomBetween(3, 6), {
            x: Math.cos(randomAngle()) * 5,
            y: Math.sin(randomAngle()) * 6
        });
        particles.push(particle);
    }
}


// HELPERS
function degToRad(deg) {
    return deg * Math.PI / 180
}
function radToDeg(rad) {
    return (rad * 180) / Math.PI
}
function mapValue(value, minInput = -35, maxInput = 50, minOutput = 0, maxOutput = 50) {
    value = Math.max(minInput, Math.min(value, maxInput));
    const normalizedValue = (value - minInput) / (maxInput - minInput);
    const mappedValue = normalizedValue * (maxOutput - minOutput) + minOutput;
    return mappedValue;
}
function randomAngle() {
    const minAngle = -Math.PI / 2;
    const maxAngle = Math.PI / 2;
    const random = Math.random() * 2 - 1;
    const angleRange = maxAngle - minAngle;
    const angle = minAngle + random * angleRange;
    return angle;
}
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}
function randomColor() {
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
}
function generateBeautifulColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = Math.floor(Math.random() * 360); // Random hue between 0 and 360
        const saturation = Math.floor(Math.random() * 50) + 50; // Random saturation between 50 and 100
        const lightness = Math.floor(Math.random() * 30) + 50; // Random lightness between 50 and 80
        const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        colors.push(color);
    }
    return colors;
}


