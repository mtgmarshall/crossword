let words                   // The user's input array of words for the crossword
let gridCenter              // The center of logicArr (also just the total word length)
let storedSols              // stores topFiveSols and worstSol
let topFiveSols = []        // stores the top five solutions based on fitness
let worstSol                // stores the solution with the worst fitness
let solType = 0             // topFive (=0) or worst (=1)
let chosenSolution = 0      // determines which solution to look at
let dispArr                 // The array used to display
let notReady = true
let wordsLength
let canvasX
let canvasY
let graphicX
let graphicY
let resMult = 1
let squareHeight, squareWidth, textValue // drawing sizes used to draw the grid
let numTries = 1000
let sol
let graphic

function main() {

  words = myInput.value.split(" ")

  wordsLength = 0 //Determining max grid size as all words together
  for (let i = 0; i < words.length; i++) {
    wordsLength += words[i].length
  }
  gridCenter = wordsLength

  topFiveSols = [] // sets up topFiveSols and worstSol to the track the 5 best, and 1 worst solutions
  worstSol = new solutionState(0, 0, 0, 0, -1, 0, [], -1)
  worstSol.logicArr = new Array(wordsLength*2).fill(0).map(() => new Array(wordsLength*2).fill(0))
  for (let i = 0; i < 5; i++) {
    topFiveSols.push(new solutionState(0, 0, 0, 0, 100000000, 0, [], -1))
    topFiveSols[i].logicArr = new Array(wordsLength*2).fill(0).map(() => new Array(wordsLength*2).fill(0))
  }

  // Start our loop through random assortments of words[] to try various solutions
  for (let k = 0; k < numTries; k++) {

    shuffleArr(words)

    sol = new solutionState()

    sol.minX = wordsLength * 2 - 1;
    sol.maxX = 0;
    sol.minY = wordsLength * 2 - 1;
    sol.maxY = 0;

    sol.logicArr = new Array(wordsLength*2).fill(0).map(() => new Array(wordsLength*2).fill(0)) //Declaring the array used for behind the scenes logic

    sol.orphans = []

    sol.searchMethod = floor(random() * 5)

    addWord(words[0], gridCenter, gridCenter, "across")

    // Make sure all bools are checked to be ready, any false notready = true...otherwise false
    let orphanCounter = 0 //Counts how many of the words in the array cannot be placed into logicArray
    let numOrphans = 0;
    for (let i = 1; i < words.length; i++) {
      // [xxxxx, test1, orphan1, test2, orphan2] i=  1, oc = 0                0 >= 4 false
      // [xxxxx, xxxxx, orphan1, test2, orphan2] i = 2, oc = 0                0 >= 3 false
      // [xxxxx, xxxxx, test2, orphan2, orphan1] i--, oc++, i = 2; oc = 1     1 >= 3 false
      // [xxxxx, xxxxx, xxxxx, orphan2, orphan1] i = 3, oc = 0                0 >= 2 false
      // [xxxxx, xxxxx, xxxxx, orphan1, orphan2] i--, oc++, i = 3, oc = 1     1 >= 2 false
      // [xxxxx, xxxxx, xxxxx, orphan2, orphan1] i--, oc++, i = 3, oc = 2     2 >= 2 true, so break
      if (!findHomeForWord(words[i])) {
        words.push(words.splice(i,1)[0]) //Pushes word that couldnt be added to the end of the array
        i--
        orphanCounter++
      } else {
        orphanCounter = 0;
      }

      if (orphanCounter >= words.length - 1 - i) {

        for (let j = i+1; j < words.length; j++) {
           sol.orphans.push(words[j])
        }
        numOrphans = orphanCounter
        break;
      }
    }

    sol.fitness = pow(sol.maxX - sol.minX + 1, 2) + pow(sol.maxY - sol.minY + 1, 2) + pow((sol.maxX - sol.minX) - (sol.maxY - sol.minY), 2) * 2 + 10000 * numOrphans

    if (sol.fitness > worstSol.fitness) { // Checks if this solution is worse than the worst solution
      worstSol = sol
    }

    for (let j = 0; j < topFiveSols.length; j++) { // Checks if this solution is better than any of the top 5 solutions
      if (arraysEqual(sol.logicArr, topFiveSols[j].logicArr)) {
        break;
      } else if (sol.fitness < topFiveSols[j].fitness) {
        topFiveSols.splice(j, 0, sol)
        topFiveSols.pop()
        break;
      }
    }
  } // end of numTries loop

  storedSols = [topFiveSols, [worstSol]]

  // our solution has been chosen:

  updateDispArr(storedSols[solType][chosenSolution]) //Updates dispArr and starts drawing
}

function findHomeForWord(word) { //Determines if a given word can be placed in the logicArr and returns whether it placed the word in logicArr (will if it can)

  switch (sol.searchMethod) {
    case 0: // Starts in the top left corner to find valid points
      for (let i = sol.minX; i <= sol.maxX; i++) { //Checking if any position has valid placement
        for (let j = sol.minY; j <= sol.maxY; j++) {

          if (isValidPosition(word, i, j)) {
            return true;
          }

        }
      }
      break;
    case 1: // Starts in the top right corner to find valid points
      for (let i = sol.maxX; i >= sol.minX; i--) { //Checking if any position has valid placement
        for (let j = sol.minY; j <= sol.maxY; j++) {

          if (isValidPosition(word, i, j)) {
            return true;
          }

        }
      }
      break;
    case 2: // Starts in the bottom left corner to find valid points
      for (let i = sol.minX; i <= sol.maxX; i++) { //Checking if any position has valid placement
        for (let j = sol.maxY; j >= sol.minY; j--) {

          if (isValidPosition(word, i, j)) {
            return true;
          }

        }
      }

      break;
    case 3: // Starts in the bottom right corner to find valid points
      for (let i = sol.maxX; i >= sol.minX; i--) { //Checking if any position has valid placement
        for (let j = sol.maxY; j >= sol.minY; j--) {

          if (isValidPosition(word, i, j)) {
            return true;
          }

        }
      }
      break;
    case 4: // Spirals out from the center to find valid points

      let size = max(sol.maxX - sol.minX + 1, sol.maxY - sol.minY + 1)
      if (size % 2 == 0) {
        size++
      }
      let xIndex = sol.minX + floor((size - 1) / 2)
      let yIndex = sol.minY + floor((size - 1) / 2)

      if (isValidPosition(word, xIndex, yIndex)) {//Checking the center
        return true
      }

      let i = 1
      let dir = 1
      while(i < size) {
        for (let j = 0; j < i; j++) {
          xIndex += dir
          if (isValidPosition(word, xIndex, yIndex)) {//Checks and moves right/left
            return true
          }
        }
        for (let j = 0; j < i; j++) {
          yIndex -= dir
          if (isValidPosition(word, xIndex, yIndex)) {//Checks and moves up/down
            return true
          }
        }
        i++
        dir = dir * -1
      }
      for (let j = 0; j < size - 1; j++) {
        xIndex++
        if (isValidPosition(word, xIndex, yIndex)) {//Checks the final row
          return true
        }
      }

      break;
    default:
      alert("Invalid arraySearchMethod: " + arraySearchMethod)
  }
  return false
}

function isValidPosition(word, x, y) { //Returns whether a word can be placed at a coordinate in logicArr

  if (sol.logicArr[x][y] == 0) {
    return false
  } if (!word.includes(sol.logicArr[x][y])) {
    return false
  }



  let letterPositions = [] //Indexes in word that share the letter with logicArr[x,y]
  for (let i = 0; i < word.length; i++) {
    if (word.charAt(i) == sol.logicArr[x][y]) {
      letterPositions.push(i)
    }
  }

  let upLeft, downRight
nextMatch:  for (let i = 0; i < letterPositions.length; i++){
    upLeft = letterPositions[i]                       // how far the word can go up or left
    downRight = word.length - letterPositions[i] - 1  // how far the word can go down or right

    if (sol.logicArr[x-1][y] == 0 && sol.logicArr[x+1][y] == 0) {
      for (let j = 0; j < upLeft; j++) {//Checking if placing the word left is valid
        if (!((sol.logicArr[x-2-j][y] == 0 || (j < upLeft-1 && sol.logicArr[x-2-j][y] == word.charAt(upLeft-2-j))) && (((sol.logicArr[x-1-j][y+1] == 0 && sol.logicArr[x-1-j][y-1] == 0) || sol.logicArr[x-1-j][y] == word.charAt(upLeft-1-j))))) {
          continue nextMatch
        }
      }

      for (let j = 0; j < downRight; j++) {//Checking if placing the word right is valid
        //if (!(logicArr[x+2+j][y] == 0 && logicArr[x+1+j][y+1] == 0 && logicArr[x+1+j][y-1] == 0)) {
        if (!((sol.logicArr[x+2+j][y] == 0 || (j < downRight-1 && sol.logicArr[x+2+j][y] == word.charAt(letterPositions[i]+2+j))) && (((sol.logicArr[x+1+j][y+1] == 0 && sol.logicArr[x+1+j][y-1] == 0) || sol.logicArr[x+1+j][y] == word.charAt(letterPositions[i]+1+j))))) {
          continue nextMatch
        }
      }

      addWord(word, x - upLeft, y, "across")
      return true

    } else if (sol.logicArr[x][y-1] == 0 && sol.logicArr[x][y+1] == 0) {
      for (let j = 0; j < upLeft; j++) {//Checking if placing the word up is valid
        if (!((sol.logicArr[x][y-2-j] == 0 || (j < upLeft-1 && sol.logicArr[x][y-2-j] == word.charAt(upLeft-2-j))) && (((sol.logicArr[x+1][y-1-j] == 0 && sol.logicArr[x-1][y-1-j] == 0) || sol.logicArr[x][y-1-j] == word.charAt(upLeft-1-j))))) {
          continue nextMatch
        }
      }

      for (let j = 0; j < downRight; j++) {//Checking if placing the word down is valid
        if (!((sol.logicArr[x][y+2+j] == 0 || (j < downRight-1 && sol.logicArr[x][y+2+j] == word.charAt(letterPositions[i]+2+j))) && (((sol.logicArr[x+1][y+1+j] == 0 && sol.logicArr[x-1][y+1+j] == 0) || sol.logicArr[x][y+1+j] == word.charAt(letterPositions[i]+1+j))))) {
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
    try {
      sol.logicArr[x + i * dx][y + i * dy] = word.charAt(i)
    } catch (e) {
      alert(e)
    }
  }

  if (x < sol.minX) { //These four if statements update max and min used values of the LogicArray dimensions
    sol.minX = x
  }
  if (x + (word.length - 1) * dx > sol.maxX) {
    sol.maxX = x + (word.length - 1) * dx
  }
  if (y < sol.minY) {
    sol.minY = y
  }
  if (y + (word.length - 1) * dy > sol.maxY) {
    sol.maxY = y + (word.length - 1) * dy
  }
}

function changeDisplayedSolution(type, choice) { // Receives arguments from button to decide which solution to display
  solType = type
  chosenSolution = choice
  updateDispArr()
}

function updateDispArr() {

  if (storedSols[solType][chosenSolution].orphans.length > 0) {
    h3.innerHTML = "Words that couldnt be used: " + storedSols[solType][chosenSolution].orphans
    h3.removeAttribute('hidden')
  } else{
    h3.setAttribute('hidden', true)
  }

  dispArr = new Array(storedSols[solType][chosenSolution].maxX - storedSols[solType][chosenSolution].minX + 1).fill(0).map(() => new Array(storedSols[solType][chosenSolution].maxY - storedSols[solType][chosenSolution].minY + 1).fill(0).map(() => new Array(2).fill(0))) // <-- set up dispArr to be what we draw off of
  for (let i = 0; i <= storedSols[solType][chosenSolution].maxX - storedSols[solType][chosenSolution].minX; i++) { // Populates dispArr with the appropriate values from logicArr
    for (let j = 0; j <= storedSols[solType][chosenSolution].maxY - storedSols[solType][chosenSolution].minY; j++) {
      dispArr[i][j][0] = storedSols[solType][chosenSolution].logicArr[storedSols[solType][chosenSolution].minX+i][storedSols[solType][chosenSolution].minY+j]
    }
  }

  let clueNum = 1;
  for (let j = 0; j <= storedSols[solType][chosenSolution].maxY - storedSols[solType][chosenSolution].minY; j++) { // Populates dispArr with the appropriate values from logicArr
    for (let i = 0; i <= storedSols[solType][chosenSolution].maxX - storedSols[solType][chosenSolution].minX; i++) {
      if (dispArr[i][j][0] != 0 && (i == 0 || dispArr[i - 1][j][0] == 0) && i < storedSols[solType][chosenSolution].maxX - storedSols[solType][chosenSolution].minX && dispArr[i + 1][j][0] != 0) {
        dispArr[i][j][1] = "" + clueNum
        clueNum++
      } else if (dispArr[i][j][0] != 0 && (j == 0 || dispArr[i][j - 1][0] == 0) && j < storedSols[solType][chosenSolution].maxY - storedSols[solType][chosenSolution].minY && dispArr[i][j + 1][0] != 0) {
        dispArr[i][j][1] = "" + clueNum
        clueNum++
      }
    }
  }

setupCanvas()
}

function setupCanvas() {

  let numCols = storedSols[solType][chosenSolution].maxX - storedSols[solType][chosenSolution].minX + 1 // calculates the number of rows and columns based on the dimenions on dispArr
  let numRows = storedSols[solType][chosenSolution].maxY - storedSols[solType][chosenSolution].minY + 1

  if (windowHeight < windowWidth) {
    canvasY = windowHeight * 0.75 // Automatically adjusts the canvas to be 75% of the window's height
    canvasX = canvasY / numRows * numCols
  } else {
    canvasX = windowWidth // Automatically adjusts the canvas to the window's width
    canvasY = canvasX / numCols * numRows
  }
  graphicX = canvasX * resMult
  graphicY = canvasY * resMult

  let canvas = createCanvas(canvasX + 1, canvasY + 1)
  graphic = createGraphics(graphicX + resMult, graphicY + resMult)
  canvas.parent('canvas')
  graphic.textFont('Courier')

  if (myButton1.getAttribute('hidden') != null) {
    h5.removeAttribute('hidden')
    myButton1.removeAttribute('hidden')
    myButton2.removeAttribute('hidden')
    myButton3.removeAttribute('hidden')
    myButton4.removeAttribute('hidden')
    myButton5.removeAttribute('hidden')
    myButtonWorst.removeAttribute('hidden')
  }

  myButton1.innerHTML = "1 - Type: " + storedSols[0][0].searchMethod
  myButton2.innerHTML = "2 - Type: " + storedSols[0][1].searchMethod
  myButton3.innerHTML = "3 - Type: " + storedSols[0][2].searchMethod
  myButton4.innerHTML = "4 - Type: " + storedSols[0][3].searchMethod
  myButton5.innerHTML = "5 - Type: " + storedSols[0][4].searchMethod
  myButtonWorst.innerHTML = "Worst - Type: " + storedSols[1][0].searchMethod

  notReady = false;
}

function draw() {
  if (notReady) {
    return
  }
  graphic.background(0)
  graphic.strokeWeight(resMult)

  let numCols = storedSols[solType][chosenSolution].maxX - storedSols[solType][chosenSolution].minX + 1 // calculates the number of rows and columns based on the dimenions on dispArr
  let numRows = storedSols[solType][chosenSolution].maxY - storedSols[solType][chosenSolution].minY + 1
  squareWidth = graphicX / numCols / pixelDensity(); // Calculates the size of each grid for drawing
  squareHeight = graphicY / numRows / pixelDensity();

  textValue = min(squareWidth, squareHeight) // Calculates the best text size to fit in the grid

  graphic.fill(255)
  for (let i = 0; i < numCols; i++){ //Creates the grid
    for (let j = 0; j < numRows; j++){
      graphic.rect(squareWidth*i, squareHeight*j, squareWidth, squareHeight)
    }
  }

  graphic.fill(0)
  for (i = 0; i < numCols; i++) { //Inputs the values in dispArr into the grid
    for (j = 0; j < numRows; j++) {
      graphic.textSize(textValue) // Sets the textSize to our calculated best text size
      if (dispArr[i][j][0] != 0) {
        graphic.text(dispArr[i][j][0], i*squareWidth + squareWidth/2 - textValue/4, j*squareHeight + squareHeight/2 + textValue/4)
      } else {
        graphic.rect(squareWidth*i, squareHeight*j, squareWidth, squareHeight)
      }

      graphic.textSize(textValue / 4) // Sets the textSize to our calculated best text size
      if (dispArr[i][j][1] != 0) {
        graphic.text(dispArr[i][j][1], i*squareWidth + squareWidth/3 - textValue/4, j*squareHeight + textValue/4)
      }
    }
  }

  image(graphic, 0, 0, canvasX + 1, canvasY + 1)

}

// Prints the 2d array as an alert message, primarily for debugging
function print2dArr(arr) {
  let msg = ""
  let i, j
  for (i = 0; i < arr[0].length; i++) {
    for (j = 0; j < arr.length; j++) {
      if (i < arr[0].length - 1) {
        msg += arr[j][i] + " "
      } else {
        msg += arr[j][i]
      }
    }
    if (i < arr[0].length - 1) {
      msg += "\n"
    }
  }
  alert(msg)
}

function shuffleArr(arr) {
  let i = arr.length;
  if ( i == 0 ) return false;
  while ( --i ) {
     let j = Math.floor( Math.random() * ( i + 1 ) );
     [arr[i], arr[j]] = [arr[j], arr[i]]
     // var tempi = arr[i];
     // var tempj = arr[j];
     // arr[i] = tempj;
     // arr[j] = tempi;
   }
}

function arraysEqual(a, b) {

  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a[0].length; j++) {
      if (a[i][j] !== b[i][j]) return false;
    }
  }
  return true;
}

class solutionState {
  constructor(minX, maxX, minY, maxY, fitness, logicArr, orphans, searchMethod) {
    this.minX = minX
    this.maxX = maxX
    this.minY = minY
    this.maxY = maxY
    this.fitness = fitness
    this.logicArr = logicArr
    this.orphans = orphans
    this.searchMethod
  }
}
