let words;                  // The user's input array of words for the crossword
let logicArr;               // The array used for behind the scenes logic
let gridCenter;             // The center of logicArr (also just the total word length)
let minX, maxX, minY, maxY  // (minX, minY) = top left corner
let dispArr;                // The array used to display
let logicIndex = 0          // Current position in the logicArr
let notReady = true
let wordsLength
let canvasX = 560
let canvasY = 560
let squareHeight, squareWidth, textValue // drawing sizes used to draw the grid

function main() {
  let input = document.getElementById("myInput").value
  words = input.split(", ")
  words.sort(function(a, b){return b.length - a.length}) //Array of all given words in order of their sizes

  wordsLength = 0 //Determining max grid size as all words together
  for (let i = 0; i < words.length; i++) {
    wordsLength += words[i].length
  }

  minX = wordsLength * 2 - 1;
  maxX = 0;
  minY = wordsLength * 2 - 1;
  maxY = 0;

  logicArr = new Array(wordsLength*2).fill(0).map(() => new Array(wordsLength*2).fill(0)) //Declaring the array used for behind the scenes logic
  gridCenter = wordsLength

  logicIndex = 0;

  addWord(words[0], gridCenter, gridCenter, "across")

  // Make sure all bools are checked to be ready, any false notready = true...otherwise false
  let wordIsOrphaned = false
  for (let i = 1; i < words.length; i++) {
    if (!findHomeForWord(words[i])) {
      wordIsOrphaned = true;
    }
  }

  //alert(minX + "  " + maxX + "  " + minY + "  " + maxY)

  dispArr = new Array(maxX - minX + 1).fill(0).map(() => new Array(maxY - minY + 1).fill(0)) // <-- set up dispArr to be what we draw off of
  for (let i = 0; i <= maxX - minX; i++) { // Populates dispArr with the appropriate values from logicArr
    for (let j = 0; j <= maxY - minY; j++) {
      dispArr[i][j] = logicArr[minX+i][minY+j]
    }
  }

  notReady = false; //wordIsOrphaned;
}

function findHomeForWord(word) { //Determines if a given word can be placed in the logicArr and returns whether it placed the word in logicArr (will if it can)

  for (let i = minX; i <= maxX; i++) { //Checking if any position has valid placement
    for (let j = minY; j <= maxY; j++) {

      if (isValidPosition(word, i, j)) {
        return true;
      }

    }
  }
  alert("Couldnt find a home for " + word)
  return false
}

//TEST THIS HEAVILY
function isValidPosition(word, x, y) { //Returns whether a word can be placed at a coordinate in logicArr

  if (logicArr[x][y] == 0) {
    return false
  } if (!word.includes(logicArr[x][y])) {
    return false
  }

  let letterPositions = [] //Indexes in word that share the letter with logicArr[x,y]
  for (let i = 0; i < word.length; i++) {
    if (word.charAt(i) == logicArr[x][y]) {
      letterPositions.push(i)
    }
  }


  let upLeft, downRight
nextMatch:  for (let i = 0; i < letterPositions.length; i++){
    upLeft = letterPositions[i]                       // how far the word can go up or left
    downRight = word.length - letterPositions[i] - 1  // how far the word can go down or right

    if (logicArr[x-1][y] == 0 && logicArr[x+1][y] == 0) {
      for (let j = 0; j < upLeft; j++) {//Checking if placing the word left is valid
        if (!((logicArr[x-2-j][y] == 0 || (j < upLeft-1 && logicArr[x-2-j][y] == word.charAt(upLeft-2-j))) && (((logicArr[x-1-j][y+1] == 0 && logicArr[x-1-j][y-1] == 0) || logicArr[x-1-j][y] == word.charAt(upLeft-1-j))))) {
          continue nextMatch
        }
      }

      for (let j = 0; j < downRight; j++) {//Checking if placing the word right is valid
        //if (!(logicArr[x+2+j][y] == 0 && logicArr[x+1+j][y+1] == 0 && logicArr[x+1+j][y-1] == 0)) {
        if (!((logicArr[x+2+j][y] == 0 || (j < downRight-1 && logicArr[x+2+j][y] == word.charAt(letterPositions[i]+2+j))) && (((logicArr[x+1+j][y+1] == 0 && logicArr[x+1+j][y-1] == 0) || logicArr[x+1+j][y] == word.charAt(letterPositions[i]+1+j))))) {
          continue nextMatch
        }
      }

      addWord(word, x - upLeft, y, "across")
      return true

    } else if (logicArr[x][y-1] == 0 && logicArr[x][y+1] == 0) {
      for (let j = 0; j < upLeft; j++) {//Checking if placing the word up is valid
        if (!((logicArr[x][y-2-j] == 0 || (j < upLeft-1 && logicArr[x][y-2-j] == word.charAt(upLeft-2-j))) && (((logicArr[x+1][y-1-j] == 0 && logicArr[x-1][y-1-j] == 0) || logicArr[x][y-1-j] == word.charAt(upLeft-1-j))))) {
          continue nextMatch
        }
      }

      for (let j = 0; j < downRight; j++) {//Checking if placing the word down is valid
        if (!((logicArr[x][y+2+j] == 0 || (j < downRight-1 && logicArr[x][y+2+j] == word.charAt(letterPositions[i]+2+j))) && (((logicArr[x+1][y+1+j] == 0 && logicArr[x-1][y+1+j] == 0) || logicArr[x][y+1+j] == word.charAt(letterPositions[i]+1+j))))) {
          continue nextMatch
        }
      }

      addWord(word, x, y - upLeft, "down")
      return true

    }

  }

  return false
}

function addWord(word, x, y, dir) { //Adds word to the LogicArr at x,y going in dir, updates minX maxX minY maxY, increments logicIndex
  let dx, dy; //booleans to indicate across or down
  //alert(word + " is being added into the crossword at " + x + " and " + y)
  if (dir == "across") {
    dx = 1;
    dy = 0;
  } else if (dir == "down") {
    dx = 0;
    dy = 1;
  } else {
    alert("I'm cringing, I'm literally cringing (function addWord() bb)")
    return
  }

  for (let i = 0; i < word.length; i++) { //Adds word to the LogicArr
    logicArr[x + i * dx][y + i * dy] = word.charAt(i)
  }

  if (x < minX) { //These four if statements update max and min used values of the LogicArray dimensions
    minX = x
  }
  if (x + (word.length - 1) * dx > maxX) {
    maxX = x + (word.length - 1) * dx
  }
  if (y < minY) {
    minY = y
  }
  if (y + (word.length - 1) * dy > maxY) {
    maxY = y + (word.length - 1) * dy
  }

  logicIndex++; //Increment through the words array

}

function setup() {
  createCanvas(canvasX + 1, canvasY + 1)
}

function draw() {
  if (notReady) {
    return
  }
  background(0)

  let numCols = maxX - minX + 1
  let numRows = maxY - minY + 1
  squareWidth = canvasX / numCols;
  squareHeight = canvasY / numRows;
  textValue = min(squareWidth, squareHeight)
  textSize(textValue)

  //alert(squareWidth + "  " + squareHeight + "  " + textSize)

  for (let i = 0; i < numCols; i++){ //Creates the grid
    for (let j = 0; j < numRows; j++){
    fill(255)
    rect(squareWidth*i, squareHeight*j, squareWidth, squareHeight)
    }
  }

  fill(0)
  for (i = 0; i < numCols; i++) { //Inputs the values in logicArr into the grid
    for (j = 0; j < numRows; j++) {
      if (dispArr[i][j] != 0) {
        text(dispArr[i][j],i*squareWidth + squareWidth/2 - textValue/4, j*squareHeight + squareHeight/2 + textValue/4)
      }
    }
  }

}
