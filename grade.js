function fightMonster(attackPower, weaponType) {
    let totalPower = attackPower
    if (weaponType == "magic sword") {
        totalPower = attackPower + 5
    }
    if (totalPower > 10) {
      console.log("You defeated the monster!");
    } else {
      console.log("The monster is too strong!");
    }
 }
 // Call the function with a test value
 fightMonster(8);
 fightMonster(11);
 fightMonster(8, "magic sword");
 fightMonster(5, "magic sword");