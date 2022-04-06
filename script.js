// USERNAME: mck70
// FULL NAME: Matthew Klaczak

// this makes the browser catch a LOT more runtime errors. leave it here!
"use strict";

// arr.removeItem(obj) finds and removes obj from arr.
Array.prototype.removeItem = function(item) {
	let i = this.indexOf(item);

	if(i > -1) {
		this.splice(i, 1);
		return true;
	}
	return false;
}

// Function that returns a random int in the range min, max.
// min is INCLUSIVE, max EXLUSIVE
function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

// constant variables for the game
const IMG_W = 120;    // width of the mosquito image
const IMG_H = 88;     // height of the mosquito image
const SCREEN_W = 640; // width of the playfield area
const SCREEN_H = 480; // height of the playfield area
const SPEED = 3; // initial speed of mosquitos
const STARTING_AREA = 150; // padding to account for starting area
const SPEED_MULTIPLIER = 1 // each round, the speed increases by 1
const SCORE_MULTIPLIER = 100 // each round, the score per mosquito increases by 100
const SPEED_LADYBUG = 1 // lady bugs move slower
const LADY_BUG_SCORE_VALUE = 300 // lady bugs worth 300pts
const MOSQUITO_SCORE_VALUE = 100 // mosquitos worth 100 pts
const TOTAL_BONUS_POSSIBLE = 1000 // total number of possible bonus
const MOSQUITO_ESCAPE_PENALTY = 250 // for each mosquito they lose this much


// global variables. add more here as you need them.
let gameMessage
let arrayOfLadyBugs = []
let arrayOfMosquitos = []
let gameVars = new GameVariables(1, 10, 0, 0)
let paused = false; // used to help pause spawning mosquitos in between rounds
let numLBSurvived = 0 // number of ladybugs that survive
let numLBSquashed = 0 // number of ladybugs that dont survive
let gameCompleted = false // this keeps track of whether a game has been played.
let usersEndScore = 0

//sound/music variables for the various sound effects
var splatSound = new sound('./resources/splatsound.wav'); // splat sound
var splatLBSound = new sound('./resources/ouch.wav'); // splat sound
var marioPaint = new sound('./resources/mariopaint.mp3'); // background music
var gameOver = new sound('./resources/gameover.mp3'); // background music
var mosquitoLaugh = new sound('./resources/mosquitolaugh.wav'); // when a mosquito escapes

// constructor for sound objects. complete with play and stop methods for playing and pausing
function sound(source) {
  this.sound = document.createElement('audio');
  this.sound.src = source;
  this.sound.style.display = 'none';
  this.play = function(){
    this.sound.play();
  }
  this.stop = function(){
    this.sound.pause();
  }
}

// game variables object
function GameVariables(round, left, misses, score) {
    this.round = round;
    this.mosquitosLeft = left;
    this.misses = misses;
    this.score = score;
}

// the ladybug object. these are beneficial to the player and provide the player points if they
// and detact points if they are killed
// this is very simple to mosquito object and if i had more time I would have probably tried to
// utilize a singular insect class
function LadyBug(initialA, initialB, vecA, vecB) {
    this._a = initialA
    this._b = initialB
    this._va = vecA
    this._vb = vecB
    // assign ladybug pic
    this.pic = document.createElement('img')
    this.pic.src = './resources/ladybug.png'
    document.getElementById('playfield').appendChild(this.pic);
    this.pic.style.position = 'absolute'
    this.pic.style.left = initialA + 'px'
    this.pic.style.top = initialB + 'px'
    this.pic.ladybug = this

    // the code that is executed when the mouse is clicked
    this.pic.onmousedown = function(event) {
        splatLBSound.play() // sound effect
        var sa = document.createElement('img')
        sa.src = './resources/x.png' // red X saying dont squash
        document.getElementById('playfield').appendChild(sa);
        sa.style.position = 'absolute'
        sa.style.left = event.target.ladybug._a + 'px'
        sa.style.top = event.target.ladybug._b + 'px'
        arrayOfLadyBugs.removeItem(event.target.ladybug)
        this.parentNode.removeChild(this)
        numLBSquashed += 1 // increment num squashed
        refreshScoreboard()
        event.stopPropagation()
    }
}

// moves the lady bug according to the same style as mosquito, just with a different speed constant (lady bug is slower)
LadyBug.prototype.updatePos = function() {
    this._a += this._va * (SPEED_LADYBUG + (SPEED_MULTIPLIER * (gameVars.round - 1))); // each round, the speed increases by 1
    this._b += this._vb * (SPEED_LADYBUG + (SPEED_MULTIPLIER * (gameVars.round - 1)));
    this.pic.style.left = this._a + 'px';
    this.pic.style.top = this._b + 'px';
};

// Determines how many lady bugs are left after round, increments counter
function countLadybugs() {
    for(var l of arrayOfLadyBugs) {
        numLBSurvived += 1
    }
    arrayOfLadyBugs = []
}

// Mosquito object. mostly similar to ladybug
function Mosquito(initialX, initialY, vecX, vecY) {
    this._x = initialX
    this._y = initialY
    this._vx = vecX
    this._vy = vecY
    this.pic = document.createElement('img')
    this.pic.src = './resources/mosquito.png'
    document.getElementById('playfield').appendChild(this.pic);
    this.pic.style.position = 'absolute'
    this.pic.style.left = initialX + 'px'
    this.pic.style.top = initialY + 'px'
    this.pic.mosquito = this

    // Again, on mouse down
    this.pic.onmousedown = function(event) {
        splatSound.play() // sound effect
        var sp = document.createElement('img')
        sp.src = './resources/green'+getRandomInt(1, 4)+'.png' // selects from one of the 3 green splatter images
        document.getElementById('playfield').appendChild(sp);
        sp.style.position = 'absolute'
        sp.style.left = event.target.mosquito._x + 'px'
        sp.style.top = event.target.mosquito._y + 'px'
        arrayOfMosquitos.removeItem(event.target.mosquito)
        this.parentNode.removeChild(this)
        gameVars.score += (MOSQUITO_SCORE_VALUE + (SCORE_MULTIPLIER * (gameVars.round - 1))) // score per mosquito increases by 100pts per round. 1 here just means to not take into account the current round
        gameVars.mosquitosLeft -= 1 // decrement remaining                                   // for example, round 1 = 1-1 * 0 = 0
        refreshScoreboard()
        event.stopPropagation()
    }
}

// Moves the mosquitos according to a speed constant
Mosquito.prototype.updatePos = function() {
    this._x += this._vx * (SPEED + (SPEED_MULTIPLIER * (gameVars.round - 1))); // each round, the speed increases by 1
    this._y += this._vy * (SPEED + (SPEED_MULTIPLIER * (gameVars.round - 1)));
    this.pic.style.left = this._x + 'px';
    this.pic.style.top = this._y + 'px';
};

// Checks if mosquito is outside playing area, if so returns true
Mosquito.prototype.outOfBounds = function() {
    if(this._x >= (SCREEN_W + STARTING_AREA) || (this._x <= -STARTING_AREA) || (this._y >= (SCREEN_H + STARTING_AREA)) || (this._y <= -STARTING_AREA)) {
        return (true)
    }
    else {
        return (false)
    }
};

// ran whenever a mosquito runs away. updates misses and refreshes scoreboard
function missedMosquito() {
    mosquitoLaugh.play() // mosquito escapes!
    gameVars.misses += 1
    refreshScoreboard()
}
// -------------------------------------- ONLOAD -----------------------------------------------
window.onload = function() {
	// here is where you put setup code.
    getLocalStorage()
	// this way, we can write gameMessage.innerHTML or whatever in your code.
	gameMessage = document.getElementById('gameMessage')

    gameMessage.addEventListener('click', (event) => {
        gameMessage.style.display = "none";
        startGame();
    })


};
// -------------------------------------- GAME CODE -----------------------------------------------
// initial starting game code - based off Jarett's pseudocode, with permission - Thanks man!
function startGame() {
    gameCompleted = false // game is in progress
    marioPaint.play()
    numLBSquashed = 0
    numLBSurvived = 0
    refreshScoreboard()
    startSpawning()
    requestAnimationFrame(gameLoop);
}
// -------------------------------------- GAME LOOP -----------------------------------------------
// main game loop - based off Jarett's pseudocode, with permission - Thanks man!
function gameLoop() {
    // iterate over array of mosquitos
    for(var m of arrayOfMosquitos) {
        m.updatePos() // move them
        if(m.outOfBounds()) { // check if theyre out of bounds
            m.pic.parentNode.removeChild(m.pic) // remove DOM element
            arrayOfMosquitos.removeItem(m) // remove from array
            missedMosquito() // update scores
        }
    }

    // move lady bugs
    for(var l of arrayOfLadyBugs) {
        l.updatePos() // move them
    }

    // check if victory/loss conditions are met
    if(gameVars.mosquitosLeft <= 0) {
        countLadybugs()
        wonRound()
    }
    else if(gameVars.misses >= 5) {
        countLadybugs()
        lostGame()
    }
    else {
        requestAnimationFrame(gameLoop)
    }
    
}

// begin spawning mosquitos/ladybugs - based off Jarett's pseudocode, with permission - Thanks man!
function startSpawning() {
    
    paused = false // resets pause - we want to start spawning again now
    window.setTimeout(spawnMosquito, 1000) // 1 second spawn rates
}

// determines location and spawns, except for lady bugs
function spawnLadyBug() {
    let [a, b, va, vb] = pickPointAndVector()
    arrayOfLadyBugs.push(new LadyBug(a, b, va, vb));
}

// determines location and spawns - based off Jarett's pseudocode, with permission - Thanks man!
function spawnMosquito() {
    let [x, y, vx, vy] = pickPointAndVector()
    arrayOfMosquitos.push(new Mosquito(x, y, vx, vy));
    
    if(!paused) { // if game is paused (in between rounds), dont keep spawning until startSpawning is called again
        window.setTimeout(spawnMosquito, 1000)
        if(getRandomInt(1, 11) > 9) { // 10% chance of spawning a ladybug whenever a mosquito is spawned
            spawnLadyBug()
        }
    }
}

// this is mostly a HTML refresher function. it updates the HTML with all the game variable values
function refreshScoreboard() {
    var s = document.getElementById('scoreDisplay');
    s.innerHTML = gameVars.score
    var r = document.getElementById('roundDisplay');
    r.innerHTML = gameVars.round
    var m = document.getElementById('missesDisplay');
    m.innerHTML = gameVars.misses
    var q = document.getElementById('mosquitoDisplay');
    q.innerHTML = gameVars.mosquitosLeft
}

// this is ran whenever a player loses a game. mostly bookkeeping stuff
function lostGame() {
    gameCompleted = true // when getLocalStorage is called, we will know to push our score
    paused = true // used for mosquito spawn pausing
    marioPaint.stop() // stop music
    gameOver.play() // play game over music
    clearPlayingField() // remove all the objects from #playingfield DOM
    gameMessage.innerHTML = 'GAME OVER! Round: '+gameVars.round+'<br>Ladybugs alive: '+numLBSurvived+' Ladybugs squashed: '+numLBSquashed+'<br>Ladybug bonus: '+((numLBSurvived-numLBSquashed)*LADY_BUG_SCORE_VALUE)+'<br>Original score: '+gameVars.score+
        '<br>Total score: '+(gameVars.score+((numLBSurvived-numLBSquashed)*LADY_BUG_SCORE_VALUE))+'pts<br>Click on the playfield to start new game...';
    gameMessage.style.display = 'flex';
    // store the username and score
    //window.localStorage.setItem('score_list', JSON.stringify(gameVars.score+((numLBSurvived-numLBSquashed)*LADY_BUG_SCORE_VALUE)))
    usersEndScore = gameVars.score+((numLBSurvived-numLBSquashed)*LADY_BUG_SCORE_VALUE) // store the users score
    getLocalStorage() // retrieves local storage and assigns top 5 high scores
    usersEndScore = 0
    gameVars = new GameVariables(1, 10, 0, 0) // reset game variables in case they play again
}

// Whenever a player wins a round, temporarily pauses the playing and waits for continue
// Also updates the player via on-screen text the games state changes, round increase, round stats, etc
function wonRound() {
    paused = true // stop spawning mosquitos/ladybugs
    var bonus = (TOTAL_BONUS_POSSIBLE - (MOSQUITO_ESCAPE_PENALTY * gameVars.misses))
    var newScore = gameVars.score + (bonus + ((numLBSurvived - numLBSquashed) * LADY_BUG_SCORE_VALUE)) // calculate what new score will be
    gameMessage.innerHTML = 'Round '+gameVars.round+' complete<br>Ladybugs alive: '+numLBSurvived+' Ladybugs squashed: '+numLBSquashed+'<br>Ladybug bonus: '+((numLBSurvived-numLBSquashed)*LADY_BUG_SCORE_VALUE)+'<br>Original score: '+gameVars.score+'<br>Bonus: '+bonus
        + '<br>Total score: '+newScore+'<br><br>Next round speed increase: '
        +(SPEED_MULTIPLIER * gameVars.round)+'<br>Score per mosquito increase: '
        +(SCORE_MULTIPLIER * gameVars.round)+'pts<br>Click on the playfield to continue...';
    gameMessage.style.display = 'flex';
    refreshScoreboard() // update scoreboard
    gameVars.score = newScore
    gameVars.round += 1
    gameVars.misses = 0 // Reset
    gameVars.mosquitosLeft = 10 // Reset
    getLocalStorage()
    clearPlayingField()
    newScore = 0
}

// removes all the remaining insect/splatter img elements from #playfield AND resets the bug global arrays to empty
function clearPlayingField() {
    for(var rem of document.getElementById('playfield').querySelectorAll('img')) {
        rem.parentNode.removeChild(rem)
    }
    arrayOfMosquitos.length = []
    arrayOfLadyBugs.length = []
}

// this reads in the localStorage, puts in a temp array and sorts the storage and populates HTML HighScores portion
function getLocalStorage() {
    let tempArray = window.localStorage.getItem('score_list')
    let loadedScores = []
    if(tempArray === null) {
        loadedScores = []
    }
    else {
        loadedScores = JSON.parse(tempArray)
    }
    
    
    if(gameCompleted) {
        loadedScores.push(usersEndScore)
    }
    // if this is true, we know to push the score of the player
    for(var i = 0; i < loadedScores.length - 1; i++) {
        for(var j = 0; j < loadedScores.length - i - 1; j++) {
            if(loadedScores[j] < loadedScores[j + 1]) {
                var temp = loadedScores[j]
                loadedScores[j] = loadedScores[j + 1]
                loadedScores[j + 1] = temp
            }
        }
    }

        if(loadedScores.length > 5) { // in case score list is too long
        loadedScores.length = 5
    }

    window.localStorage.clear() // empty before putting values back in

    // now, put our scores back into storage and populate the page high scores element
    var hs = document.getElementById('highScores')
    hs.innerHTML = '<ol>'
    for(var k = 0; k < loadedScores.length; k++) {
        hs.innerHTML += '<lo>' + loadedScores[k] + '</lo><br>'
        window.localStorage.setItem("score_list", JSON.stringify(loadedScores))
    }
}

// given a side (0, 1, 2, 3 = T, R, B, L), returns a 2-item array containing the x and y
// coordinates of a point off the edge of the screen on that side.
function randomPointOnSide(side) {
	switch(side) {
		/* top    */ case 0: return [getRandomInt(0, SCREEN_W - IMG_W), -IMG_H];
		/* right  */ case 1: return [SCREEN_W, getRandomInt(0, SCREEN_H - IMG_H)];
		/* bottom */ case 2: return [getRandomInt(0, SCREEN_W - IMG_W), SCREEN_H];
		/* left   */ case 3: return [-IMG_W, getRandomInt(0, SCREEN_H - IMG_H)];
	}
}

// returns a 4-item array containing the x, y, x direction, and y direction of a mosquito.
// use it like:
// let [x, y, vx, vy] = pickPointAndVector()
// then you can multiply vx and vy by some number to change the speed.
function pickPointAndVector() {
	let side = getRandomInt(0, 4);                    // pick a side...
	let [x, y] = randomPointOnSide(side);             // pick where to place it...
	let [tx, ty] = randomPointOnSide((side + 2) % 4); // pick a point on the opposite side...
	let [dx, dy] = [tx - x, ty - y];                  // find the vector to that other point...
	let mag = Math.hypot(dx, dy);                     // and normalize it.
	let [vx, vy] = [(dx / mag), (dy / mag)];
	return [x, y, vx, vy];
}