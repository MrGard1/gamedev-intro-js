// import prompt function
import promptSync from 'prompt-sync'; 
const prompt = promptSync();


function promptQ(p) {
    let result = prompt(p)
    // can type Q to quit from anywhere in game
    if(result.toLowerCase() === "q"){
        console.log("Quitting... yah quitter, cya ☠️")
        process.exit()
    }
    return result
}

// Game state variables
let playerName = "";
let rabbitFound = false;
let inventory = [];
let location = "garage"; // Starting location
let gameOver = false;
let hasBucket = false;
// ... add more variables later
// import boxen from 'boxen';
// import gradient from 'gradient-string';
// import terminalImage from 'terminal-image';


async function startGame() {

    console.clear()
    console.log("hey")

    // console.log(boxen('rabbit', {padding: 1}));
    // console.log(gradient(['cyan', 'pink'])('Hello world of rabbits everywhere!'));
    // console.log(await terminalImage.file('unicorn.jpg'));
    // process.exit()

    playerName = promptQ("Welcome to the Lost Rabbit Adventure! What's your name?");
    console.log(`Hello, ${playerName}! Your pet rabbit, Flopsy, has gone missing! It's time to find them.`);
    gameLoop();
}

function gameLoop() {
    while (!gameOver) {
        console.clear()
        console.log("\n--- Game Status ---");
        console.log(`Location: ${location}`);
        console.log(`Inventory: ${inventory.join(", ")}`);
        console.log(`Rabbit Found: ${rabbitFound ? "Yes" : "No"}`);

        if (location === "house") {
            home();
        } else if (location === "garden") {
            outside();
        } else if (location === "garage") {
            garage();
        } else if (location === "backyard") {
            backyard();
        } else if (location === "jail") {
            jail();
        } else if (location === "dead") {
            dead();
        } else {
            console.log("IDK what happened, but it seems your life is over....")
            gameOver = true; // End game if no valid location is found
            dead();
        }
        console.log("")
        promptQ("...")
    }
    console.log("\nGame Over! Thanks for playing.");
}

function garage() {
    console.log("you are in the garage, it's a bit messy, but no time to clean now, THE ROOF IS LEAKING!!!")
    console.log("lots of stuff laying around do you want to grab a 'bucket' or a 'wrench' or head 'outside' or back in the 'house'?")
    let action = promptQ("what you going to do: ")
    if (action.toLowerCase() === "wrench") {
        console.log("great you have a wrench now, that will def help you fix the leaking roof")
        // maybe make variable later
    } else if (action.toLowerCase() === "bucket") {
        console.log("you have a bucket, what are you going to do with it??");
        hasBucket = true
    } else if (action.toLowerCase() === "home") {
        console.log("going back inside, maybe the leak isnt THAT bad...");
        location = "house"
    } else if (action.toLowerCase() === "outside") {
        console.log("going out front");
        location = "outside"
    } else {
        console.log("Invalid action!");
    }
}

function home() {
    console.log("\nYou are in your house. It's cozy, but the rabbit is nowhere to be found.");
    let action = promptQ("Do you want to search the house or go to the garden?");

    if (action.toLowerCase() === "search") {
        console.log("You search the house... but you can't find Flopsy anywhere.");
        inventory.push("Magnifying Glass");
        console.log("You found a magnifying glass! Maybe this will help...");
    } else if (action.toLowerCase() === "garden") {
        console.log("You decide to head to the garden to look for Flopsy.");
        location = "garden"; // Move to garden
    } else {
        console.log("Invalid action! Please choose 'search' or 'garden'.");
    }
}

function outside() {
    console.log("\nYou are now in the garden. The flowers are blooming, but there's no sign of Flopsy.");
    let action = promptQ("Do you want to look under the bushes or call out for Flopsy?");

    if (action.toLowerCase() === "look") {
        console.log("You crouch down and peek under the bushes... You spot something!");
        let foundRabbit = Math.random() < 0.5; // 50% chance to find the rabbit

        if (foundRabbit) {
            rabbitFound = true;
            console.log("You found Flopsy! The rabbit is safe and sound.");
            gameOver = true; // End game when rabbit is found
        } else {
            console.log("No rabbit here, just some old gardening tools.");
        }
    } else if (action.toLowerCase() === "call") {
        console.log("You call out, 'Flopsy! Where are you?'... You hear a rustling in the bushes.");
        let rabbitNearby = Math.random() < 0.7; // 70% chance the rabbit responds

        if (rabbitNearby) {
            console.log("Flopsy hops out from behind the bushes! You've found your rabbit!");
            rabbitFound = true;
            gameOver = true; // End game when rabbit is found
        } else {
            console.log("No response. The garden is quiet again.");
        }
    } else {
        console.log("Invalid action! Please choose 'look under the bushes' or 'call out'.");
    }
}


function backyard() {
    console.log("\nYou are now in the back yard");
    let action = promptQ("what do you want to do?: ");

    if (action.toLowerCase() === "ACTION1") {
        console.log("you do the action");
    } else if (action.toLowerCase() === "ACTION2") {
        console.log("you do the action");
    } else {
        console.log("Invalid action! Please choose 'look under the bushes' or 'call out'.");
    }
}

function dead() {
    console.log("\nYou are now in the back yard");
    let action = promptQ("what do you want to do?: ");

    if (action.toLowerCase() === "ACTION1") {
        console.log("you do the action");
    } else if (action.toLowerCase() === "ACTION2") {
        console.log("you do the action");
    } else {
        console.log("Invalid action! Please choose 'look under the bushes' or 'call out'.");
    }
}

function jail() {
    console.log("\nYou are now in the back yard");
    let action = promptQ("what do you want to do?: ");

    if (action.toLowerCase() === "ACTION1") {
        console.log("you do the action");
    } else if (action.toLowerCase() === "ACTION2") {
        console.log("you do the action");
    } else {
        console.log("Invalid action! Please choose 'look under the bushes' or 'call out'.");
    }
}

// Start the game
startGame();