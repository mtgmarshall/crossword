
let words                   // The user's input array of words for the crossword
let hints                   // The user's input array of hints for the crossword
let numAcross               // The # of hints corresponding to words going across
let numDown                 // The # of hints corresponding to words going down
let wordIndices             // The indices to reference the words array
let gridCenter              // The center of logicArr (also just the total word length)
let storedSols              // stores topFiveSols and worstSol
let topFiveSols = []        // stores the top five solutions based on fitness
let worstSol                // stores the solution with the worst fitness
let solType = 0             // topFive (=0) or worst (=1)
let chosenSolution = 0      // determines which solution to look at
let dispArr                 // The array used to display
let notReady = true         // Prevents a draw until a crossword has been generated
let wordsLength             // Count of how many words the user inputs
let canvasX                 // The width of the drawing canvas
let canvasY                 // The height of the drawing canvas
let graphic                 // The high-resolution graphic used for exporting the crossword
let resMult = 4             // The increase in resolution from the canvas to the export
let hintScalar = 4          // The amount textValue is scaled down for the hint section
let squareHeight, squareWidth, textValue // drawing sizes used to draw the grid
let numTries = 1000         // The amount of crossword generation attempts
let sol                     // The current solution attempt
let hideWords = false       // Used to decide if the words should be printed in draw

function setup() {
  noLoop()
  hideWords = false
}

// The primary flow of logic, runs when "Create" is clicked
function main() {
  words = []
  hints = []
  wordIndices = []
  let numValidRows = 0;
  for (let i = 1; i < numTableRows; i++) { //
    let wrd
    let hnt = new hint()
    try {
      wrd = document.getElementById('wordRow'+i).value.toLowerCase()
      hnt.sentence = document.getElementById('hintRow'+i).value
    } catch (e) {
      wrd = undefined
      hnt = undefined
    }
    if (wrd == undefined || hnt.sentence == undefined) {
      continue
    } else if (wrd == "" || hnt.sentence == "") {
      alert("Row: " + (numValidRows + 1) + " is empty!")
      return
    }
    // regex expression to match all non-alphanumeric characters in string, so that they can be removed
    let regex = /[^A-Za-z0-9]/g
    wrd = wrd.replace(regex, "")
    words.push(wrd)
    hints.push(hnt)
    wordIndices.push(numValidRows)
    numValidRows++
  }

  if (words.length == 0) { // Prevents empty entries from proceeding
    alert("No words have been input!")
    return
  }

  wordsLength = 0 //Determining max grid size as all words together
  for (let i = 0; i < words.length; i++) {
    wordsLength += words[i].length
  }
  gridCenter = wordsLength

  topFiveSols = [] // sets up topFiveSols and worstSol to the track the 5 best, and 1 worst solutions
  worstSol = new solutionState(0, 0, 0, 0, -1, 0, [], -1)
  worstSol.logicArr = new Array(wordsLength*2).fill(0).map(() => new Array(wordsLength*2).fill(0))
  for (let i = 0; i < wordsLength*2; i++) {
    for (let j = 0; j < wordsLength*2; j++) {
      worstSol.logicArr[i][j] = new gridPoint()
    }
  }
  for (let i = 0; i < 5; i++) {
    topFiveSols.push(new solutionState(0, 0, 0, 0, 100000000, 0, [], -1))
    topFiveSols[i].logicArr = new Array(wordsLength*2).fill(0).map(() => new Array(wordsLength*2).fill(0))
    for (let j = 0; j < wordsLength*2; j++) {
      for (let k = 0; k < wordsLength*2; k++) {
        topFiveSols[i].logicArr[j][k] = new gridPoint()
      }
    }
  }

  // Start our loop through random assortments of words[] to try various solutions
  for (let k = 0; k < numTries; k++) {

    shuffleArr(wordIndices)

    sol = new solutionState()

    sol.minX = wordsLength * 2 - 1;
    sol.maxX = 0;
    sol.minY = wordsLength * 2 - 1;
    sol.maxY = 0;

    sol.logicArr = new Array(wordsLength*2).fill(0).map(() => new Array(wordsLength*2).fill(0))
    for (let i = 0; i < wordsLength*2; i++) {
      for (let j = 0; j < wordsLength*2; j++) {
        sol.logicArr[i][j] = new gridPoint()
      }
    }

    sol.orphans = []

    sol.searchMethod = floor(random() * 5)

    addWord(words[wordIndices[0]], wordIndices[0], gridCenter, gridCenter, "across")

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
      if (!findHomeForWord(words[wordIndices[i]], wordIndices[i])) {
        wordIndices.push(wordIndices.splice(i,1)[0]) //Pushes word that couldnt be added to the end of the array
        i--
        orphanCounter++
      } else {
        orphanCounter = 0;
      }

      if (orphanCounter >= words.length - 1 - i) {

        for (let j = i+1; j < words.length; j++) {
           sol.orphans.push(words[wordIndices[j]])
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
      if (arraysEqual(sol.logicArr, topFiveSols[j].logicArr, sol.minX, sol.maxX, sol.minY, sol.maxY, topFiveSols[j].minX, topFiveSols[j].maxX, topFiveSols[j].minY, topFiveSols[j].maxY)) {
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

//Determines if a given word can be placed in the logicArr and returns whether it placed the word in logicArr (will if it can)
function findHomeForWord(word, wordIndex) {
  switch (sol.searchMethod) {
    case 0: // Starts in the top left corner to find valid points
      for (let i = sol.minX; i <= sol.maxX; i++) { //Checking if any position has valid placement
        for (let j = sol.minY; j <= sol.maxY; j++) {

          if (isValidPosition(word, wordIndex, i, j)) {
            return true;
          }

        }
      }
      break;
    case 1: // Starts in the top right corner to find valid points
      for (let i = sol.maxX; i >= sol.minX; i--) { //Checking if any position has valid placement
        for (let j = sol.minY; j <= sol.maxY; j++) {

          if (isValidPosition(word, wordIndex, i, j)) {
            return true;
          }

        }
      }
      break;
    case 2: // Starts in the bottom left corner to find valid points
      for (let i = sol.minX; i <= sol.maxX; i++) { //Checking if any position has valid placement
        for (let j = sol.maxY; j >= sol.minY; j--) {

          if (isValidPosition(word, wordIndex, i, j)) {
            return true;
          }

        }
      }

      break;
    case 3: // Starts in the bottom right corner to find valid points
      for (let i = sol.maxX; i >= sol.minX; i--) { //Checking if any position has valid placement
        for (let j = sol.maxY; j >= sol.minY; j--) {

          if (isValidPosition(word, wordIndex, i, j)) {
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

      if (isValidPosition(word, wordIndex, xIndex, yIndex)) {//Checking the center
        return true
      }

      let i = 1
      let dir = 1
      while(i < size) {
        for (let j = 0; j < i; j++) {
          xIndex += dir
          if (isValidPosition(word, wordIndex, xIndex, yIndex)) {//Checks and moves right/left
            return true
          }
        }
        for (let j = 0; j < i; j++) {
          yIndex -= dir
          if (isValidPosition(word, wordIndex, xIndex, yIndex)) {//Checks and moves up/down
            return true
          }
        }
        i++
        dir = dir * -1
      }
      for (let j = 0; j < size - 1; j++) {
        xIndex++
        if (isValidPosition(word, wordIndex, xIndex, yIndex)) {//Checks the final row
          return true
        }
      }

      break;
    default:
      alert("Invalid arraySearchMethod: " + sol.searchMethod)
  }
  return false
}

// Returns whether a word can be placed at a coordinate in logicArr
function isValidPosition(word, wordIndex, x, y) {

  if (sol.logicArr[x][y].letter == 0) {
    return false
  } if (!word.includes(sol.logicArr[x][y].letter)) {
    return false
  }



  let letterPositions = [] //Indexes in word that share the letter with logicArr[x,y]
  for (let i = 0; i < word.length; i++) {
    if (word.charAt(i) == sol.logicArr[x][y].letter) {
      letterPositions.push(i)
    }
  }

  let upLeft, downRight
nextMatch:  for (let i = 0; i < letterPositions.length; i++){
    upLeft = letterPositions[i]                       // how far the word can go up or left
    downRight = word.length - letterPositions[i] - 1  // how far the word can go down or right

    if (sol.logicArr[x-1][y].letter == 0 && sol.logicArr[x+1][y].letter == 0) {
      for (let j = 0; j < upLeft; j++) {//Checking if placing the word left is valid
        if (!((sol.logicArr[x-2-j][y].letter == 0 || (j < upLeft-1 && sol.logicArr[x-2-j][y].letter == word.charAt(upLeft-2-j))) && (((sol.logicArr[x-1-j][y+1].letter == 0 && sol.logicArr[x-1-j][y-1].letter == 0) || sol.logicArr[x-1-j][y].letter == word.charAt(upLeft-1-j))))) {
          continue nextMatch
        }
      }

      for (let j = 0; j < downRight; j++) {//Checking if placing the word right is valid
        //if (!(logicArr[x+2+j][y] == 0 && logicArr[x+1+j][y+1] == 0 && logicArr[x+1+j][y-1] == 0)) {
        if (!((sol.logicArr[x+2+j][y].letter == 0 || (j < downRight-1 && sol.logicArr[x+2+j][y].letter == word.charAt(letterPositions[i]+2+j))) && (((sol.logicArr[x+1+j][y+1].letter == 0 && sol.logicArr[x+1+j][y-1].letter == 0) || sol.logicArr[x+1+j][y].letter == word.charAt(letterPositions[i]+1+j))))) {
          continue nextMatch
        }
      }

      addWord(word, wordIndex, x - upLeft, y, "across")
      return true

    } else if (sol.logicArr[x][y-1].letter == 0 && sol.logicArr[x][y+1].letter == 0) {
      for (let j = 0; j < upLeft; j++) {//Checking if placing the word up is valid
        if (!((sol.logicArr[x][y-2-j].letter == 0 || (j < upLeft-1 && sol.logicArr[x][y-2-j].letter == word.charAt(upLeft-2-j))) && (((sol.logicArr[x+1][y-1-j].letter == 0 && sol.logicArr[x-1][y-1-j].letter == 0) || sol.logicArr[x][y-1-j].letter == word.charAt(upLeft-1-j))))) {
          continue nextMatch
        }
      }

      for (let j = 0; j < downRight; j++) {//Checking if placing the word down is valid
        if (!((sol.logicArr[x][y+2+j].letter == 0 || (j < downRight-1 && sol.logicArr[x][y+2+j].letter == word.charAt(letterPositions[i]+2+j))) && (((sol.logicArr[x+1][y+1+j].letter == 0 && sol.logicArr[x-1][y+1+j].letter == 0) || sol.logicArr[x][y+1+j].letter == word.charAt(letterPositions[i]+1+j))))) {
          continue nextMatch
        }
      }

      addWord(word, wordIndex, x, y - upLeft, "down")
      return true

    }

  }

  return false
}

// Adds word to the LogicArr at x,y going in dir, updates minX maxX minY maxY
function addWord(word, wordIndex, x, y, dir) {

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
      sol.logicArr[x + i * dx][y + i * dy].letter = word.charAt(i)
      if (i == 0) {
        sol.logicArr[x + i * dx][y + i * dy].wordIndex.push(wordIndex)
        sol.logicArr[x + i * dx][y + i * dy].wordDirection.push(dir)
      }
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

// Alternates whether or not the words will print within the crossword
function showHideWords() {
  hideWords = !hideWords
  redraw()
}

 // Receives arguments from button to decide which solution to display
function changeDisplayedSolution(type, choice) {
  solType = type
  chosenSolution = choice
  updateDispArr()
}

// Prepares the dispArr with the chosen solution
function updateDispArr() {

  if (storedSols[solType][chosenSolution].orphans.length > 0) {
    h3.innerHTML = "Words that couldnt be used: " + storedSols[solType][chosenSolution].orphans
    h3.removeAttribute('hidden')
  } else{
    h3.setAttribute('hidden', true)
  }

  dispArr = new Array(storedSols[solType][chosenSolution].maxX - storedSols[solType][chosenSolution].minX + 1).fill(0).map(() => new Array(storedSols[solType][chosenSolution].maxY - storedSols[solType][chosenSolution].minY + 1).fill(0)) // <-- set up dispArr to be what we draw off of
  for (let i = 0; i < dispArr.length; i++) {
    for (let j = 0; j < dispArr[0].length; j++) {
      dispArr[i][j] = new gridPoint()
    }
  }

  for (let i = 0; i <= storedSols[solType][chosenSolution].maxX - storedSols[solType][chosenSolution].minX; i++) { // Populates dispArr with the appropriate values from logicArr
    for (let j = 0; j <= storedSols[solType][chosenSolution].maxY - storedSols[solType][chosenSolution].minY; j++) {
      dispArr[i][j].letter = storedSols[solType][chosenSolution].logicArr[storedSols[solType][chosenSolution].minX+i][storedSols[solType][chosenSolution].minY+j].letter
      for (k = 0; k < storedSols[solType][chosenSolution].logicArr[storedSols[solType][chosenSolution].minX+i][storedSols[solType][chosenSolution].minY+j].wordIndex.length; k++) {
        dispArr[i][j].wordIndex.push(storedSols[solType][chosenSolution].logicArr[storedSols[solType][chosenSolution].minX+i][storedSols[solType][chosenSolution].minY+j].wordIndex[k])
        dispArr[i][j].wordDirection.push(storedSols[solType][chosenSolution].logicArr[storedSols[solType][chosenSolution].minX+i][storedSols[solType][chosenSolution].minY+j].wordDirection[k])
      }
    }
  }

  let clueNum = 1;
  for (let j = 0; j <= storedSols[solType][chosenSolution].maxY - storedSols[solType][chosenSolution].minY; j++) { // Populates dispArr with the appropriate values from logicArr
    for (let i = 0; i <= storedSols[solType][chosenSolution].maxX - storedSols[solType][chosenSolution].minX; i++) {
      if (dispArr[i][j].letter != 0 && (i == 0 || dispArr[i - 1][j].letter == 0) && i < storedSols[solType][chosenSolution].maxX - storedSols[solType][chosenSolution].minX && dispArr[i + 1][j].letter != 0) {
        dispArr[i][j].hintNum = "" + clueNum
        clueNum++
      } else if (dispArr[i][j].letter != 0 && (j == 0 || dispArr[i][j - 1].letter == 0) && j < storedSols[solType][chosenSolution].maxY - storedSols[solType][chosenSolution].minY && dispArr[i][j + 1].letter != 0) {
        dispArr[i][j].hintNum = "" + clueNum
        clueNum++
      }
    }
  }

  hintsAcross = []
  hintsDown = []
  numAcross = 0
  numDown = 0

  for (let i = 0; i < hints.length; i++) {
    hints[i].num = 0
  }

  for (let j = 0; j < dispArr[0].length; j++) {
    for (let i = 0; i < dispArr.length; i++) {
      for (let k = 0; k < dispArr[i][j].wordIndex.length; k++) {
        if (dispArr[i][j].hintNum != 0) {
          hints[dispArr[i][j].wordIndex[k]].num = dispArr[i][j].hintNum
          hints[dispArr[i][j].wordIndex[k]].dir = dispArr[i][j].wordDirection[k]
          if (dispArr[i][j].wordDirection[k] == "across") {
            numAcross++
          } else if (dispArr[i][j].wordDirection[k] == "down") {
            numDown++
          } else {
            alert("Error, no hint direction")
          }
        }
      }
    }
  }
setupCanvas()
}

// Prepares the canvas for the draw() function to display on
function setupCanvas() {

  let numCols = storedSols[solType][chosenSolution].maxX - storedSols[solType][chosenSolution].minX + 1 // calculates the number of rows and columns based on the dimenions on dispArr
  let numRows = storedSols[solType][chosenSolution].maxY - storedSols[solType][chosenSolution].minY + 1

  if (windowHeight < windowWidth) {
    if (storedSols[solType][chosenSolution].orphans.length == 0) {
      canvasY = windowHeight * 0.75 // Automatically adjusts the canvas to be 75% of the window's height
      canvasX = canvasY / numRows * numCols
    } else {
      canvasY = windowHeight * 0.7
      canvasX = canvasY / numRows * numCols
    }
  } else {
    canvasX = windowWidth // Automatically adjusts the canvas to the window's width
    canvasY = canvasX / numCols * numRows
  }

  let canvas = createCanvas(canvasX + 1, canvasY + 1)
  canvas.parent('canvas')
  textFont('Courier')

  if (myButton1.getAttribute('hidden') != null) {
    myButtonWords.removeAttribute('hidden')
    myButtonSave.removeAttribute('hidden')
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
  redraw()
}

// Draws the crosswords onto the canvas, so it is seen on the web page
function draw() {
  if (notReady) {
    return
  }
  background(0)

  let numCols = storedSols[solType][chosenSolution].maxX - storedSols[solType][chosenSolution].minX + 1 // calculates the number of rows and columns based on the dimenions on dispArr
  let numRows = storedSols[solType][chosenSolution].maxY - storedSols[solType][chosenSolution].minY + 1
  squareWidth = canvasX / numCols // Calculates the size of each grid for drawing
  squareHeight = canvasY / numRows

  textValue = min(squareWidth, squareHeight) // Calculates the best text size to fit in the grid

  fill(255)
  for (let i = 0; i < numCols; i++){ //Creates the grid
    for (let j = 0; j < numRows; j++){
      rect(squareWidth*i, squareHeight*j, squareWidth, squareHeight)
    }
  }

  fill(0)
  for (i = 0; i < numCols; i++) { //Inputs the values in dispArr into the grid
    for (j = 0; j < numRows; j++) {
      textSize(textValue) // Sets the textSize to our calculated best text size
      if (dispArr[i][j].letter != 0) {
        if (!hideWords) {
          text(dispArr[i][j].letter, i*squareWidth + squareWidth/2 - textValue/4, j*squareHeight + squareHeight/2 + textValue/4)
        }
      } else {
        rect(squareWidth*i, squareHeight*j, squareWidth, squareHeight)
      }

      textSize(textValue / 4) // Sets the textSize to our calculated best text size
      if (dispArr[i][j].hintNum != 0) {
        text(dispArr[i][j].hintNum, i*squareWidth + squareWidth/3 - textValue/4, j*squareHeight + textValue/4)
      }
    }
  }
  createExportableImage()
}

// Converts graphic to an image, then downloads it
function saveImage() {
  let img = createImage(graphic.width, graphic.height)
  img.copy(graphic, 0, 0, graphic.width, graphic.height, 0, 0, graphic.width, graphic.height)
  img.save('Crossword', 'png')
}

// A near identical copy of draw() but draws on the graphic variable, instead of canvas
function createExportableImage() {
  if (notReady) {
    return
  }

  let graphicX = canvasX * resMult
  let graphicY = canvasY * resMult

  let numCols = storedSols[solType][chosenSolution].maxX - storedSols[solType][chosenSolution].minX + 1 // calculates the number of rows and columns based on the dimenions on dispArr
  let numRows = storedSols[solType][chosenSolution].maxY - storedSols[solType][chosenSolution].minY + 1
  squareWidth = graphicX / numCols; // Calculates the size of each grid for drawing
  squareHeight = graphicY / numRows;

  textValue = min(squareWidth, squareHeight) // Calculates the best text size to fit in the grid

  let hintGridX = canvasX * resMult
  textSize(textValue / hintScalar)
  let numCharactersInRow = floor((hintGridX / 2) / (textWidth('A')))   // Used to calculate when a new line will be needed
  let hintSpacing = textWidth('A') * 2.5
  let linesAcross = 2           // linesAcross & linesDown are needed to create the graphicY length
  let linesDown = 2
  for (let i = 0; i < hints.length; i++) { // Loops through every hint, counting however many lines are needed
    if (hints[i].num == 0) {
      continue
    }
    if (hints[i].dir == "across") {
      linesAcross += hints[i].getLines(numCharactersInRow)
    } else {
      linesDown += hints[i].getLines(numCharactersInRow)
    }
  }

  let hintGridY = (max(linesAcross, linesDown) * hintSpacing)// * resMult

  graphic = createGraphics(graphicX + 1, graphicY + resMult + hintGridY)
  graphic.textFont('Courier')
  graphic.background(0)

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
      if (dispArr[i][j].letter != 0) {
        if (!hideWords) {
          graphic.text(dispArr[i][j].letter, i*squareWidth + squareWidth/2 - textValue/4, j*squareHeight + squareHeight/2 + textValue/4)
        }
      } else {
        graphic.rect(squareWidth*i, squareHeight*j, squareWidth, squareHeight)
      }

      graphic.textSize(textValue / 4) // Sets the textSize to our calculated best text size
      if (dispArr[i][j].hintNum != 0) {
        graphic.text(dispArr[i][j].hintNum, i*squareWidth + squareWidth/3 - textValue/4, j*squareHeight + textValue/4)
      }
    }
  }

  graphic.fill(255)
  graphic.rect(0, graphicY + resMult*2, hintGridX, hintGridY)
  graphic.fill(0)
  graphic.textSize(textValue / hintScalar * 2)
  graphic.text("Across:", 0, graphicY + resMult * 2 + hintSpacing, hintGridX / 2)
  graphic.text("Down:", hintGridX / 2, graphicY + resMult * 2 + hintSpacing, hintGridX / 2)
  graphic.textSize(textValue / hintScalar)
  let acrossCounter = 2
  let downCounter = 2
  for (let i = 1; i <= hints.length; i++) {
    for (let j = 0; j < hints.length; j++) {
      if (hints[j].num != i) {
        continue
      }
      if (hints[j].dir == "across") {
        graphic.text(hints[j].getClue(), 0, graphicY + resMult*2 + hintSpacing * acrossCounter, hintGridX/2)
        acrossCounter += hints[j].getLines(numCharactersInRow)
      } else {
        graphic.text(hints[j].getClue(), hintGridX/2, graphicY + resMult*2 + hintSpacing * downCounter, hintGridX/2)
        downCounter += hints[j].getLines(numCharactersInRow)
      }
    }
  }

}

// Prints the 2d array as an alert message, primarily for debugging
function print2dArr(arr) {
  let msg = ""
  let i, j
  for (i = 0; i < arr[0].length; i++) {
    for (j = 0; j < arr.length; j++) {
      if (j < arr.length - 1) {
        msg += arr[j][i].letter + " "
      } else {
        msg += arr[j][i].letter
      }
    }
    if (i < arr[0].length - 1) {
      msg += "\n"
    }
  }
  console.log(msg)
}

// Shuffles the arr array randomly
function shuffleArr(arr) {
  let i = arr.length;
  if ( i == 0 ) return false;
  while ( --i ) {
     let j = Math.floor( Math.random() * ( i + 1 ) );
     [arr[i], arr[j]] = [arr[j], arr[i]]
   }
}

// Checks if two arrays are equal, and can check sub-arrays if necessary
function arraysEqual(a, b, xStartA = 0, xEndA = -1, yStartA = 0, yEndA = -1, xStartB = 0, xEndB = -1, yStartB = 0, yEndB = -1) {

  if (xEndA == -1) {
    xEndA = a.length - 1
  }
  if (yEndA == -1) {
    yEndA = a[0].length - 1
  }
  if (xEndB == -1) {
    xEndB = b.length - 1
  }
  if (yEndB == -1) {
    yEndB = b[0].length - 1
  }
  if (xEndA - xStartA != xEndB - xStartB || yEndA - yStartA != yEndB - yStartB) {
    return false
  }

  let xOffset = xEndB - xEndA
  let yOffset = yEndB - yEndA

  for (let i = xStartA; i <= xEndA; i++) {
    for (let j = yStartA; j <= yEndA; j++) {
      if (!a[i][j].equals(b[i + xOffset][j + yOffset])) {
        //print2dArr(a)
        //print2dArr(b)
        return false
      }
    }
  }
  return true
}

// The object used to store information for solutions
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

class gridPoint {
  constructor(letter = 0, wordIndex = [], wordDirection = [], hintNum = 0) {
    this.letter = letter
    this.wordIndex = wordIndex
    this.wordDirection = wordDirection
    this.hintNum = hintNum
    this.equals = function(otherGridPoint) {
      if (this.wordIndex.length != otherGridPoint.wordIndex.length) {
        return false
      }
      for (let i = 0; i < this.wordIndex.length; i++) {
        if (this.wordIndex[i] != otherGridPoint.wordIndex[i]) {
          return false
        }
        if (this.wordDirection[i] != otherGridPoint.wordDirection[i]) {
          return false
        }
      }
      return (this.letter == otherGridPoint.letter && this.hintNum == otherGridPoint.hintNum)
    }
  }
}

class hint {
  constructor(sentence = "", num = 0, dir = "") {
    this.sentence = sentence
    this.num = num
    this.dir = dir
    this.getClue = function() {
      return this.num + ": " + this.sentence
    }
    this.getLines = function(charsPerRow) {

      let numLines = 0
      let sentenceArray = this.getClue().split(" ")

      let lineLength = sentenceArray.shift().length + 2
      let prevLineLength = 0

      while (sentenceArray.length > 0) {
        numLines++
        lineLength -= (prevLineLength + 1)
        while (lineLength <= charsPerRow) {
          prevLineLength = lineLength
          if (sentenceArray.length > 0) {
            lineLength += 1 + sentenceArray.shift().length
          } else {
            break
          }
        }
      }
      return numLines
    }
  }
}
