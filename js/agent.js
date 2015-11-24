/*************************************************
 *      Josh Rueschenberg & Reid Thompson        *
 *                                               *
 * Program seems to work a bit faster in firefox *
 *************************************************/

// helper functions
function randomInt(n) {
    return Math.floor(Math.random() * n);
};

function AgentBrain(gameEngine) {
    this.size = 4;
    this.previousState = gameEngine.grid.serialize();
    this.reset();
    this.score = 0;
};

AgentBrain.prototype.reset = function () {
    this.score = 0;
    this.grid = new Grid(this.previousState.size, this.previousState.cells);
};

// Adds a tile in a random position
AgentBrain.prototype.addRandomTile = function () {
    if (this.grid.cellsAvailable()) {
        var value = Math.random() < 0.9 ? 2 : 4;
        var tile = new Tile(this.grid.randomAvailableCell(), value);

        this.grid.insertTile(tile);
    }
};

AgentBrain.prototype.moveTile = function (tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
AgentBrain.prototype.move = function (direction) {
    // 0: up, 1: right, 2: down, 3: left
    var self = this;

    var cell, tile;

    var vector = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved = false;

    //console.log(vector);
    this.prepareTiles();
    //console.log(traversals);

    // Traverse the grid in the right direction and move tiles
    traversals.x.forEach(function (x) {
        traversals.y.forEach(function (y) {
            cell = { x: x, y: y };
            tile = self.grid.cellContent(cell);

            if (tile) {
                var positions = self.findFarthestPosition(cell, vector);
                var next = self.grid.cellContent(positions.next);

                // Only one merger per row traversal?
                if (next && next.value === tile.value && !next.mergedFrom) {
                    var merged = new Tile(positions.next, tile.value * 2);
                    merged.mergedFrom = [tile, next];

                    self.grid.insertTile(merged);
                    self.grid.removeTile(tile);

                    // Converge the two tiles' positions
                    tile.updatePosition(positions.next);

                    // Update the score
                    self.score += merged.value;

                } else {
                    self.moveTile(tile, positions.farthest);
                }

                if (!self.positionsEqual(cell, tile)) {
                    moved = true; // The tile moved from its original cell!
                }
            }
        });
    });
    if (moved) {
        this.addRandomTile();
    }
    return {moved : moved, score : self.score};
};

// Get the vector representing the chosen direction
AgentBrain.prototype.getVector = function (direction) {
    // Vectors representing tile movement
    var map = {
        0: { x: 0, y: -1 }, // Up
        1: { x: 1, y: 0 },  // Right
        2: { x: 0, y: 1 },  // Down
        3: { x: -1, y: 0 }   // Left
    };

    return map[direction];
};

// Build a list of positions to traverse in the right order
AgentBrain.prototype.buildTraversals = function (vector) {
    var traversals = { x: [], y: [] };

    for (var pos = 0; pos < this.size; pos++) {
        traversals.x.push(pos);
        traversals.y.push(pos);
    }

    // Always traverse from the farthest cell in the chosen direction
    if (vector.x === 1) traversals.x = traversals.x.reverse();
    if (vector.y === 1) traversals.y = traversals.y.reverse();

    return traversals;
};

AgentBrain.prototype.findFarthestPosition = function (cell, vector) {
    var previous;

    // Progress towards the vector direction until an obstacle is found
    do {
        previous = cell;
        cell = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(cell) &&
             this.grid.cellAvailable(cell));

    return {
        farthest: previous,
        next: cell // Used to check if a merge is required
    };
};

AgentBrain.prototype.positionsEqual = function (first, second) {
    return first.x === second.x && first.y === second.y;
};

AgentBrain.prototype.movesAvailable = function () {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

AgentBrain.prototype.tileMatchesAvailable = function () {
    var self = this;

    var tile;

    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
            tile = this.grid.cellContent({ x: x, y: y });

            if (tile) {
                for (var direction = 0; direction < 4; direction++) {
                    var vector = self.getVector(direction);
                    var cell   = { x: x + vector.x, y: y + vector.y };

                    var other  = self.grid.cellContent(cell);

                    if (other && other.value === tile.value) {
                        return true; // These two tiles can be merged
                    }
                }
            }
        }
    }

    return false;
};

// this is needed to keep the board from filling up with valid merges but not making them while simulating
AgentBrain.prototype.prepareTiles = function () {
    this.grid.eachCell(function (x, y, tile) {
        if (tile) {
            tile.mergedFrom = null;
            tile.savePosition();
        }
    });
};

// ??
function Agent() {

};

getValidMoves = function(gameManager) {
    var moves = [];
    var finder = new AgentBrain(gameManager);
    for (var dir = 0; dir < 4; dir++) {
        var moved = finder.move(dir);
        if (moved.moved) { moves.push(dir); }
        finder.reset();
    }
    return moves;
};

monteCarlo = function(gameManager) {
    var validDirs = getValidMoves(gameManager);
    var scores = [0,0,0,0];
    var highScore = 0;
    var maxDir = -1;
    for (var dir = 0; dir < validDirs.length; dir++) {
        var currIdx = validDirs[dir];
        var itr = 0;
        var brain = new AgentBrain(gameManager);
        var largestCell = findLargestCell(brain);
        var numGames = Math.log2(largestCell) * 8; //decent way to scale the number of games simulated per turn

        while (itr < numGames) {

            var score = runGames(currIdx, brain);
            if (score === -1) continue;

            itr++;
            scores[currIdx] += score;
            brain.reset();
        }

    }

    for (var i = 0; i < scores.length; i++) {
        if (isNaN(scores[i])) scores[i] = 0; //should keep it from trying to pick bad directions because they are NaN

        if (scores[i] >= highScore && validDirs.indexOf(i) > -1) {
            highScore = scores[i];
            maxDir = i;
        }

    }
    return maxDir;
};

runGames = function(dir, brain) {
    var cells = 0;
    var big = 0;
    var moved = brain.move(dir);
    var movesMade = 0;
    var cScore = 0;
    if (!moved.moved) {
        return -1;
    }

    while(brain.movesAvailable()) {
        var rDir = randomInt(4);
        var singleMove = brain.move(rDir);
        movesMade++;
        cells = brain.grid.availableCells().length;
        var gradientScore = evalGridBasedOnGradients(brain);

        // after testing dozens of different configurations, this one seems to yield the best results
        cScore += gradientScore + (singleMove.score / 10) + (cells * 10);
    }
    return cScore;
};


findLargestCell = function(brain) {
    var grid = brain.grid;
    var maxCell = 0;
    for (var x = 0; x < 4; x++) {
        for (var y = 0; y < 4; y++) {
            var currCell = grid.cellContent({x: x, y: y});
            if (currCell === null) {
                currCell = 0;
            } else {
                currCell = currCell.value;
            }
            if (currCell > maxCell) {
                maxCell = currCell;
            }
        }
    }
    return maxCell;
};


// functions sourced from: https://github.com/ranjaykrishna/2048
// however, function in that repo has an error in the third gradient that we fixed.
evalGridBasedOnGradients = function(brain) {
    var gradients = [ // covers all directions
           [[ 3,  2,  1,  0],
            [ 2,  1,  0, -1],
            [ 1,  0, -1, -2],
            [ 0, -1, -2, -3]],

           [[ 0,  1,  2,  3],
            [-1,  0,  1,  2],
            [-2, -1,  0,  1],
            [-3, -2, -1,  0]],

           [[ 0, -1, -2, -3],
            [ 1,  0, -1, -2],
            [ 2,  1,  0, -1],
            [ 3,  2,  1,  0]],

           [[-3, -2, -1,  0],
            [-2, -1,  0,  1],
            [-1,  0,  1,  2],
            [ 0,  1,  2,  3]]
    ];
    var values = [0, 0, 0, 0];

    var grid = brain.grid;
    var currCell;
    for (var gradient = 0; gradient < 4; gradient++) {
        for (var x = 0; x < 4; x++) {
            for (var y = 0; y < 4; y++) {
                currCell = grid.cellContent({x: x, y: y});
                if (currCell !== null) {
                    values[gradient] += gradients[gradient][x][y] * currCell.value;
                }
            }
        }
    }

    return Math.max.apply(Math, values); //javascript wizardry
};

Agent.prototype.selectMove = function(gameManager) {
    return monteCarlo(gameManager);
};

