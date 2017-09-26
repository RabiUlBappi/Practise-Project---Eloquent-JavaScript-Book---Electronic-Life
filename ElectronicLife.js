/*
	defines the plan
 */

var plan = ["############################",
			"#      #    #      o      ##",
			"#                          #",
			"#          #####           #",
			"##         #   #    ##     #",
			"###           ##     #     #",
			"#           ###      #     #",
			"#   ####                   #",
			"#   ##       o             #",
			"# o  #         o       ### #",
			"#    #                     #",
			"############################"];

/*
	defines the directions & the helper functions
 */

function randomElement(array) {
	return array[Math.floor(Math.random() * array.length)];
}

var directionNames = "n ne e se s sw w nw".split(" ");

function elementFromChar(legend, ch) {
	if (ch === " ") { return null; }
	var element = new legend[ch]();
	element.originChar = ch;
	return element;
}


function charFromElement(element) {
	if (element === null) {
        return " ";
    }
	else {
        return element.originChar;
    }
}


/*
	Vector defines the vector class
 */

function Vector(x, y) {
	this.x = x;
	this.y = y;
}

Vector.prototype.plus = function(other) {
	return new Vector(this.x + other.x, this.y + other.y);
};


/*
	directions defins the directions of the crittera by 
	the eight surrounding squares by their compass 
	directions: "n" for north, "ne" for northeast, and so on
 */

var directions = {
	"n":  new Vector( 0, -1),
	"ne": new Vector( 1, -1),
	"e":  new Vector( 1,  0),
	"se": new Vector( 1,  1),
	"s":  new Vector( 0,  1),
	"sw": new Vector(-1,  1),
	"w":  new Vector(-1,  0),
	"nw": new Vector(-1, -1)
};


/*
	Grid defines the grid class
 */

function Grid(width , height) {
	this.space = new Array(width * height);
	this.width = width;
	this.height = height;
}

Grid.prototype.isInside = function(vector) {
	return vector.x >= 0 && vector.x < this.width && vector.y >= 0 && vector.y < this.height;
};

Grid.prototype.get = function(vector) {
	return this.space[vector.x + this.width * vector.y];
};

Grid.prototype.set = function(vector , value) {
	this.space[vector.x + this.width * vector.y] = value;
};

// [forEach] method for Grid type,
// it calls a given function f for each element in the 
// grid that isn’t null or undefined,
// context allows to access the correct this inside 
// the inner function 
Grid.prototype.forEach = function(f, context) {
	for (var y = 0; y < this.height; y++) {
		for (var x = 0; x < this.width; x++) {
			var value = this.space[x + y * this.width];
			if (value != null)
				f.call(context , value , new Vector(x, y));
		}
	}
};


/*
	the view Object
 */

function View(world , vector) {
	this.world = world;
	this.vector = vector;
}

// The look method fgures out the coordinates 
// that we are trying to look at
View.prototype.look = function(dir) {
	var target = this.vector.plus(directions[dir]);
	if (this.world.grid.isInside(target))
		return charFromElement(this.world.grid.get(target));
	else
		return "#";
};

// fnds the character corresponding to
// the element that sits there
View.prototype.findAll = function(ch) {
	var found = [];
	for (var dir in directions)
		if (this.look(dir) == ch)
			found.push(dir);
	return found;
};

View.prototype.find = function(ch) {
	var found = this.findAll(ch);
	if (found.length == 0) return null;
	return randomElement(found);
};


/*
	defines the random directions for the bouncing critter
 */

// function BouncingCritter() {
// 	this.direction = randomElement(directionNames);
// };


// // The act method returns an action of some kind
// BouncingCritter.prototype.act = function(view) {
// 	if (view.look(this.direction) != " ")
// 		this.direction = view.find(" ") || "s";
// 	return {type: "move", direction: this.direction};
// };


/*
	defines the world object and additonal other functions
 */
// the World object
function World(map , legend) {
	var grid = new Grid(map[0].length , map.length);
	this.grid = grid;
	this.legend = legend;

	map.forEach(function(line , y) {
		for (var x = 0; x < line.length; x++)
			grid.set(new Vector(x, y), elementFromChar(legend , line[x]));
	});
}

World.prototype.toString = function() {
	var output = "";
	for (var y = 0; y < this.grid.height; y++) {
		for (var x = 0; x < this.grid.width; x++) {
			var element = this.grid.get(new Vector(x, y));
			output += charFromElement(element);
		}
		output += "\n";
	}
	return output;
};


// validates direction
World.prototype.checkDestination = function(action , vector) {
	if (directions.hasOwnProperty(action.direction)) {
		var dest = vector.plus(directions[action.direction]);
		if (this.grid.isInside(dest))
			return dest;
	}
};


// The letAct method contains the actual logic 
// that allows the critters to move
World.prototype.letAct = function(critter , vector) {
	var action = critter.act(new View(this , vector));
	if (action && action.type == "move") {
		var dest = this.checkDestination(action , vector);
		if (dest && this.grid.get(dest) == null) {
			this.grid.set(vector , null);
			this.grid.set(dest , critter);
		}
	}
};

// turn method makes the critter act,
// the acted[] array keeps track of the visited 
// squares and ignore them when we see them again
World.prototype.turn = function() {
	var acted = [];
	this.grid.forEach(function(critter , vector) {
		if (critter.act && acted.indexOf(critter) == -1) {
			acted.push(critter);
			this.letAct(critter , vector);
		}
	}, this);
};


/*
	Defines various types of actions
 */

var actionTypes = Object.create(null);

actionTypes.grow = function(critter) {
	critter.energy += 0.5;
	return true;
};


actionTypes.move = function(critter , vector , action) {
	var dest = this.checkDestination(action , vector);
	if (dest == null || critter.energy <= 1 || this.grid.get(dest) != null)
		return false;

	critter.energy -= 1;
	this.grid.set(vector , null);
	this.grid.set(dest , critter);

	return true;
};


actionTypes.eat = function(critter , vector , action) {
	var dest = this.checkDestination(action , vector);
	var atDest = dest != null && this.grid.get(dest);
	
	if (!atDest || atDest.energy == null)
		return false;

	critter.energy += atDest.energy;
	this.grid.set(dest , null);

	return true;
};


actionTypes.reproduce = function(critter , vector , action) {
	var baby = elementFromChar(this.legend, critter.originChar);
	var dest = this.checkDestination(action , vector);
	if (dest == null || critter.energy <= 2 * baby.energy || this.grid.get(dest) != null)
		return false;

	critter.energy -= 2 * baby.energy;
	this.grid.set(dest , baby);

	return true;
};



/*
	Populate the world
 */

function Plant() {
	this.energy = 3 + Math.random() * 4;
}

Plant.prototype.act = function(view) {
	if (this.energy > 15) {
		var space = view.find(" ");
		if (space)
			return {type: "reproduce", direction: space};
	}

	if (this.energy < 20)
		return {type: "grow"};
};

function PlantEater() {
	this.energy = 20;
}

PlantEater.prototype.act = function(view) {
	var space = view.find(" ");
	if (this.energy > 60 && space)
		return {type: "reproduce", direction: space};

	var plant = view.find("*");

	if (plant)
		return {type: "eat", direction: plant};
	if (space)
		return {type: "move", direction: space};
};



// LifelikeWorld overrides the letAct method in 
// the World object after inheritance
function LifelikeWorld(map , legend) {
	World.call(this , map , legend);
}

LifelikeWorld.prototype = Object.create(World.prototype);

// first checks whether an action was returned at all
// then whether a handler function for this action exists
// finally whether that handler returned true
// If the action didn’t work , it slowly dies loosing energy
LifelikeWorld.prototype.letAct = function(critter , vector) {
	var action = critter.act(new View(this , vector));
	var handled = action &&
				  action.type in actionTypes &&
				  actionTypes[action.type].call(this , critter , vector , action);
	if (!handled) {
		critter.energy -= 0.2;
		if (critter.energy <= 0)
			this.grid.set(vector , null);
	}
};


/*
	Wall
 */

function Wall() {}

// “compute” with compass directions,
// dirPlus("n", 1) means one 45-degree turn 
// clockwise from north, giving "ne"
function dirPlus(dir , n) {
	var index = directionNames.indexOf(dir);
	return directionNames[(index + n + 8) % 8];
}

function WallFollower() {
	this.dir = "s";
}

WallFollower.prototype.act = function(view) {
	var start = this.dir;
	if (view.look(dirPlus(this.dir , -3)) != " ")
		start = this.dir = dirPlus(this.dir , -2);
	while (view.look(this.dir) != " ") {
		this.dir = dirPlus(this.dir , 1);
		if (this.dir == start) break;
	}
	return {type: "move", direction: this.dir};
};


var valley = new LifelikeWorld(
	["############################",
	 "#####                 ######",
	 "##   ***                **##",
	 "#   *##**         **  O  *##",
	 "#    ***     O    ##**    *#",
	 "#       O         ##***    #",
	 "#                 ##**     #",
	 "#   O       #*             #",
	 "#*          #**       O    #",
	 "#***        ##**    O    **#",
	 "##****     ###***       *###",
	 "############################"],
 	 {	
	 	"#": Wall ,
	 	"O": PlantEater ,
		"*": Plant
	 }
);