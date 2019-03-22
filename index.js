// NPM packages
const express = require('express');
const React = require('react');
const ReactDOM = require('react-dom/server');
const bodyparser = require('body-parser');
const cookieparser = require('cookie-parser');
const mysql = require('mysql');
const cookieSession = require('cookie-session');
const async = require('async');
const winston = require('winston');
const chokidar = (function() {
  // had issues with process.env.NODE_ENV, removed for now
  // const production = process.env.NODE_ENV === 'production';
  // console.log(`Process running in ${process.env.NODE_ENV} mode, hot reloading if that doesn't say production`);
  // if (!production) {
    const chokidar = require('chokidar');
    const watcher = chokidar.watch('./src', null);
    watcher.on('ready', () => {
      watcher.on('all', () => {
        console.log('Clearing /app/ module cache from server');
        Object.keys(require.cache).forEach((id) => {
          if (/[\/\\]app[\/\\]/.test(id)) delete require.cache[id]
        })
      })
    });
 // }
}());

// imported components and data
import { experience } from './src/constants/experienceObject'; // Used to calculate level
import LoginPage from './src/components/LoginPage';
import Battle from './src/components/Battle';
import NavigationShell from './src/components/NavigationShell';
import SignupPage from './src/components/SignupPage';

// initialize app and database
const app = express(); // initialize app
const db = mysql.createConnection({ // initialize db login info (required for future connect call) and typecast
  host: 'localhost',
  //port: '3306',
  user: 'root',
  password: 'thisisplaintextlmao',
  database: 'first',
  typeCast: function castField(field, useDefaultTypeCasting) {
    // We only want to cast bit fields that have a single-bit in them. If the field
    // has more than one bit, then we cannot assume it is supposed to be a Boolean.
    if ((field.type === 'BIT' ) && (field.length === 1)) {
      const bytes = field.buffer();
      // A Buffer in Node represents a collection of 8-bit unsigned integers.
      // Therefore, our single 'bit field' comes back as the bits '0000 0001',
      // which is equivalent to the number 1.
      return( bytes[ 0 ] === 1 );
    }
    return( useDefaultTypeCasting() );
  }, // transforms buffers (bits) to boolean
  authSwitchHandler(data, cb) {
    if (data.pluginName === 'mysql_clear_password') {
      // https://dev.mysql.com/doc/internals/en/clear-text-authentication.html
      let password = 'password\0';
      let buffer = Buffer.from(password);
      cb(null, buffer);
    }
  }
});
db.connect(function databaseConnectErrorHandler(err) { // finalizes connection to db, throws an error if there is one
  if (err) {
    console.log('error connecting to db in db.connect() call');
    logger.error('Error connecting to database', err);
    throw err;
  }
});


// initialize logger variable with winston for future injection
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transport: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// TODO: make this have environments
if (true /*process.env.NODE_ENV !== 'production'*/) {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}


// database class for initiating db functions and attaching them to any number of dbs
// to be called with instances of db and logger
class DatabaseClient {
  constructor(db, logger) {
    this.db = db; // database dependency injection
    this.logger = logger; //
  }
  
  getCharacterByUsername(username, callback) {
    this.db.query(
      `SELECT * FROM characters WHERE username=?`,
      [username],
      (err, results) => {
        if (err) {
          logger.error('Error getting character login info with username', {
            err,
            results
          });
          callback(err, results);
          return
        }
        callback(null, results);
      }
    )
  }
  
  getCharacterDataByID(id, callback) {
    this.db.query(
      `SELECT * FROM character_data WHERE id=?`,
      [id],
      (err, results) => {
        if (err) {
          logger.error('Error getting character_data using character_id', {
            err,
            results
          });
          callback(err, results);
          return
        }
        callback(null, results);
      }
    )
  }
  
  getEquippedWeaponByCharacterID(characterID, callback) {
    this.db.query(
      `SELECT * FROM inventory WHERE character_id=? AND equipped=true`,
      [characterID],
      (err, results) => {
        if (err) {
          logger.error('Error getting currently equipped weapon from inventory using character_id', {
            err,
            results
          });
          callback(err, results);
          return
        }
        callback(null, results);
      }
    )
  }
  
  checkBattlesInProgress(character_ID, callback) {
    this.db.query(
      `SELECT * FROM battles_in_progress WHERE character_id=?`,
      [character_ID],
      (err, results) => {
        if (err) {
          logger.error('Error fetching from battles_in_progress using Character_ID', {
            err,
            results
          });
          callback(err, results);
          return
        }
        callback(null, results);
      }
    )
  }
  
  loginPlayer(usernameFromLogin, passwordFromLogin, callback) {
    this.db.query(
      `SELECT * FROM characters WHERE username = ? AND password = ?`,
      [usernameFromLogin, passwordFromLogin],
      (err, results) => {
        if (err) {
          logger.error('Error during loginPlayer when fetching from characters using Username and Password', {
            err,
            results
          });
          callback(err, results);
          return
        }
        callback(null, results);
      }
    );
  }
  
  // TODO: extract data fetching from component rendering, add handling for errors
  renderNewBattle(res, zone, userID) {
    console.log('rendering new battle');
    async.auto({
      getEquippedWeapon: (callback) => this.getEquippedWeaponByCharacterID(userID, callback),
      getCharacterData: (callback) => this.getCharacterDataByID(userID, callback),
      getRandomEnemy: (callback) => {this.getRandomEnemyByZoneName(zone, (err, enemyDataObject) => {
        callback(err, enemyDataObject);
      })},
      deleteCompletedBattle: (callback) => {this.deleteCompletedBattleFromBattlesInProgress(userID, callback)},
      setBattleInProgress: ['getEquippedWeapon', 'getCharacterData', 'getRandomEnemy', 'deleteCompletedBattle', (results, callback) => {
        this.insertIntoBattlesInProgress(
          userID,
          results.getRandomEnemy.enemy_id,
          results.getRandomEnemy.zone_id,
          results.getEquippedWeapon[0].item_id,
          getHealth(getLevel(results.getCharacterData[0].experience)),
          results.getRandomEnemy.initial_health,
          callback
        );
      }]
    }, (err, results) => {
      if (err) {
        logger.error('Error rendering new battle', err);
        res.sendStatus(500);
        return
      }

      const battleBackgroundImageURL = `/static/images/zones/${results.getRandomEnemy.zone_name.replace(' ', '_')}/background.png`;
      const battle = <Battle bg={battleBackgroundImageURL} />;
      return renderWithTemplate(res, battle);
    });
  }
  
  insertIntoBattlesInProgress(userID, enemy, zoneID, equippedWeaponID, characterHealth, enemyHealth, callback) {
    this.db.query(
      `INSERT INTO battles_in_progress (character_id, enemy_id, zone_id, player_weapon_id, player_health, enemy_health,
      completed) VALUES (?, ?, ?, ?, ?, ?, default)`,
      [userID, enemy, zoneID, equippedWeaponID, characterHealth, enemyHealth],
      (err, results) => {
        if (err) {
          logger.error('Error inserting into battles_in_progress', {
            err,
            results
          });
          callback(err, results);
          return
        }
        callback(null, results);
      }
    )
  }

  deleteCompletedBattleFromBattlesInProgress(playerID, callback) {
    this.db.query(
      `DELETE FROM battles_in_progress WHERE character_id = ?`,
      [playerID],
      (err) => {
        if (err) {
          logger.error('Error deleting completed battle from battles_in_progress', {
            err
          });
        }
        callback(err);
      }
    )
  }

  getRandomEnemyByZoneName(zone, callback) {
    logger.info('getting random enemy by zone', {zone});

    async.auto({
      getZoneID: (callback) => this.getZoneID(zone, callback),
      getZoneEnemies: ['getZoneID', (results, callback) => this.getZoneEnemies(results.getZoneID[0].id, callback)],
      getEnemyData: ['getZoneEnemies', (results, callback) => this.getEnemyData(results.getZoneEnemies[2].enemy_id, callback)]
    }, (err, results) => {
      if (err) {
        logger.error('Error getting random enemy using zone name', {
          err,
          results
        });
        callback(err, results);
        return
      }
      callback(null, {
        enemy_id: results.getZoneEnemies[2].enemy_id,
        initial_health: results.getEnemyData[0].initial_health,
        zone_id: results.getZoneID[0].id,
        zone_name: zone
      });
    })
  }

  getZoneID(zone, callback) {
    this.db.query(
      `SELECT * FROM zones WHERE name=?`,
      [zone],
      (err, results) => {
        if (err) {
          logger.error('Error getting zone id from zone name', {
            err,
            results
          });
          callback(err, results);
          return
        }
        callback(null, results);
    })
  }

  getZoneEnemies(zoneID, callback) {
    this.db.query(
      `SELECT * FROM zone_enemies WHERE zone_id=?`,
      [zoneID],
      (err, results) => {
        if (err) {
          logger.error('Error getting zone_enemies from database, error message:', {
            err,
            results
          });
          callback(err, results);
          return
        }
        const enemies = results;
        const randNum = Math.random();
        const randEnemy = enemies[Math.floor(randNum * enemies.length)];
        callback(null, enemies, randNum, randEnemy, zoneID);
      })
  }

  getEnemyData(enemyID, callback) {
    this.db.query(
      `SELECT * FROM enemies WHERE id=?`,
      [enemyID],
      (err, results) => {
        if (err) {
          logger.error('Error getting enemy data from enemy ID', {
            err,
            results
          });
          callback(err, results);
          return
        }
        callback(null, results);
    })
  }

  getBattleInProgress(userID, callback) {
    this.db.query(
      `SELECT * FROM battles_in_progress JOIN zones ON (battles_in_progress.zone_id = zones.id) WHERE character_id = ? 
      AND completed = 0;`,
      [userID],
      (err, results) => {
        if (err) {
          logger.error('Error getting battle in progress:', {
            err,
            results
          });
          return
        }
        callback(err, results[0]);
      }
    );
  }

  getInventoryData(username, cb) {

    const itemIDs = [];

    async.auto({
      getUserID: (callback) => this.getCharacterByUsername(username, callback),
      getInventoryItems: ['getUserID', (results, callback) => {
        this.getAllItemsInUserInventory(results.getUserID[0].id, callback)
      }],
      getItemStats: ['getInventoryItems', (results, callback) => {

        const itemArray = results.getInventoryItems;

        if (itemArray.length) {
          itemArray.forEach((currentItem) => {
            itemIDs.push(currentItem.item_id);
          });
          this.getItemStats(itemIDs, callback)
        } else {
          callback(null, results)
        }
      }]
      }, (err, results) => {
        if (err) {
          logger.error('Error getting inventory data', {
            err,
            results
          });
          cb(err, results);
          return
        }

        cb(err, {
          itemIDs: itemIDs || [],
          itemData: results.getItemStats || []
        })
      }

    );

  }

  getAllItemsInUserInventory(userID, callback) {
    this.db.query(
      `SELECT * FROM inventory WHERE character_id=?`,
      [userID],
      (err, results) => {
        if (err) {
          logger.error("Error getting user's items from inventory", {
            err,
            results
          });
        }
        callback(err, results)
      }
    );
  }

  getItemStats(itemIDs, callback) {
    this.db.query(
      `SELECT * FROM items WHERE id IN (?)`,
      [itemIDs],
      (err, results) => {
        if (err) {
          logger.error('Error getting item stats', {
            err,
            results
          });
        }
        callback(err, results)
      }
    );
  }

  getZoneNameFromID(zoneID, callback) {
    this.db.query(
      `SELECT * FROM zones WHERE id=?`,
      [zoneID],
      (err, results) => {
        if (err) {
          logger.error('Error getting zone name', {
            err,
            results
          });
        }
        callback(err, results)
      }
    )
  }

  updateBattleInProgressHealthValues(results, callback) {
    const { newPlayerHealth, newEnemyHealth, playerID, /*res, urlToReturnTo*/ } = results;
    this.db.query(
      `UPDATE battles_in_progress SET player_health = ?, enemy_health = ? WHERE character_id = ?`,
      [newPlayerHealth, newEnemyHealth, playerID],
      (err) => {
        if (err) {
          logger.error('Error updating battles in progress during player attack:', {
            err
          });
          return
        }
        callback(results);
      }
    );
  }

  setBattleInProgressToCompleted(playerID, callback) {
    this.db.query(
      `UPDATE battles_in_progress SET completed = 1 WHERE character_id = ?`,
      [playerID],
      (err) => {
        if (err) {
          logger.error('Error updating battle in progress while trying to mark as completed', {
            err
          });
          return
        }
        callback(err);
      }
    );
  }

  handleBattleComplete(playerID, callback) {
    async.auto({
      setBattleCompleted: (callback) => this.setBattleInProgressToCompleted(playerID, callback),
      getBattleInProgress: (callback) => this.getBattleInProgress(playerID, callback),
      getCharacterData: (callback) => this.getCharacterDataByID(playerID, callback),
      getEnemyData: ['getBattleInProgress', (callback) => this.getEnemyData(results.getBattleInProgress[0].enemy_id, callback)],
      updateExperienceAndGold: ['getBattleInProgress', 'getCharacterData', 'getEnemyData', (results, callback) => {
        const enemyStartingHealth = results.getEnemyData[0].initial_health;
        const zoneID = results.getBattleInProgress[0].zone_id;
        const newExperience = results.getCharacterData[0].experience + rollExperienceReward(enemyStartingHealth, zoneID);
        const newGold = results.getCharacterData[0].gold + rollGoldReward(enemyStartingHealth, zoneID);
        this.updatePlayerExperienceAndGold(newExperience, newGold, playerID, callback);
      }],
      rollItemDrop: ['getEnemyData', (results, callback) => {
        this.rollAndHandleItemDropForSuccessfulBattle(playerID, results.getBattleInProgress[0].enemy_id, callback)
      }],

    }, (err, results) => {
      if (err) {
        logger.error('Error running async.auto calls inside dbQueries.handleBattleComplete', {
          err,
          results
        });
        callback(err);
        return
      }
      callback(err, results);
    })
  }

  updatePlayerExperienceAndGold(newExperience, newGold, playerID, callback) {
    this.db.query(
      `UPDATE character_data SET experience = ? AND gold = ? WHERE character_id = ?`,
      [newExperience, newGold, playerID],
      (err) => {
        if (err) {
          logger.error('Error updating battle in progress while trying to mark as completed', {
            err
          });
          return
        }
        callback(err);
      }
    );
  }

  rollAndHandleItemDropForSuccessfulBattle(playerID, enemyID, callback) {
    this.db.query(
      `SELECT * FROM drop_association AS da JOIN drop_data ON da.drop_id = drop_data.drop_id WHERE enemy_id = ?;`,
      [enemyID],
      (err, results) => {
        if (err) {
          logger.error('Error rolling item drop after successful battle', {
            err,
            results
          });
          return
        }
        const randomItem = rollRandomItem(results);
        console.log('rolled random item, results either itemID or null', randomItem);
        if (randomItem) {
          this.addItemToInventory(playerID, randomItem, callback);
          return
        }
        callback(err)
      }
    );


  }

  addItemToInventory(playerID, itemID, callback) {
    this.db.query(
      `INSERT INTO inventory (character_id, item_id) VALUES (?, ?)`,
      [playerID, itemID],
      (err) => {
        if (err) {
          logger.error(`Error inserting item drop from successful battle into inventory, 
          playerID:${playerID}, itemID: ${itemID} `, {
            err
          });
          return
        }
        callback(err)
      }
    )
  }


}


const dbQueries = new DatabaseClient(db /*, logger TODO: use or delete*/); // instantiate dbQueries with db


app.set('view engine', 'pug'); // sets template engine to pug
app.use(bodyparser.urlencoded({ extended: true })); // allows url encoding to be understood. Called with
// { extended: true } object literal to set a necessary flag
app.use(cookieparser('urgheyyoubighomolol')); // secret for cookies
app.use('/static', express.static('src/static')); // sets static path

// sets express to use cookie sessions, uses a secret, and sets max age
app.use(cookieSession({
  name: 'user-session',
  keys: ['urgheyyoubighomolol'],
  maxAge: .025 * 10 * 60 * 1000 //15 seconds
}));


//
//
// End initialization
// Begin declaration of logical functions
//
//


// used to render pages with templates, makes templates opt-in. Also allows for easy script insertion
function renderWithTemplate (res, componentToRender, title = 'JLand', templateToRender = 'template', scriptSource) {
  return res.render(templateToRender, {
    reactData: ReactDOM.renderToStaticMarkup(componentToRender),
    title: title,
    scriptSource: scriptSource
  })
}

// calculates player level from experience value, necessary because storing both exp and level could cause inconsistency
function getLevel(exp) {
  let playerLevel;
  let remainingExp = exp;
  //experience is an array of values where experience[index] == amount of experience required to reach the next level/index

  for (let i = 1; remainingExp >= experience[i]; i++) {
    playerLevel = i;
    remainingExp -= experience[i];
  }
  return playerLevel;
}

// calculate health value based on user's level
function getHealth(playerLevel) {
  const healthBonusFromLevel = playerLevel * 15;
  return 85 + healthBonusFromLevel;
}

// get a random number between min and max (inclusive)
function rollDamageInRange(min, max) {
  const damageRange = Math.abs(max - min);
  // number of possible damage values. eg: range between 2 and 5 damage = 4 possible values [2, 3, 4, 5]
  
  return Math.round((Math.random() * damageRange)) + min;
  // get a random value between 0 and 1 then multiply it by the range to get a value between 0 and damageRange,
  // then round to a whole num and add min to get a damage value between range of min and max (inclusive)
}

function rollExperienceReward(enemyStartingHealth, zoneID) {
  return Math.round((enemyStartingHealth / 6) * (zoneID * 1.25))
}

// rolls a static value based on enemy health
// then uses Math.random() for a 1/5 chance of returning 1.5x that base value, else it returns the base value
function rollGoldReward(enemyStartingHealth, zoneID) {
  const baseGold = Math.round((enemyStartingHealth / 6) * (zoneID * 1.5));
  return Math.random() * 5 < 1 ? Math.round(baseGold * 1.5) : baseGold;
}

//rolls are based on x/100 drop chance, x being defined in the database on a per-enemy basis
//returns either an itemID or null
function rollRandomItem(arrayOfItems) {

  console.log('rolling random item from results:', arrayOfItems);

  const rollLookup = [];

  arrayOfItems.map(item => {
    for ( let i = 0; i < item.drop_chance; i++) {
      rollLookup.push(item.item_id);
    }
  });

  const roll = Math.floor(Math.random() * 100);
  return rollLookup[roll] ? rollLookup[roll] : null
}


//
//
// End logical functions
// Begin query functions
//
//


// render component inside 'character data top bar' and 'navigation left bar'
// TODO: remove commented console statements when no longer necessary or update to logger calls
function renderWithNavigationShell(res, username, componentToRender, pageTitle, templateToRender = 'template',
                                   scriptSource, optProps) {
  db.query(
    `SELECT * FROM characters WHERE username = ?`,
    [username],
    (err, results) => {
      if (err) {
        res.sendStatus(500);
        return
      }
      
      const characterQueryResults = results[0];
      // console.log('results from querying characters table for ', username, 'are ', characterQueryResults); //TODO remove
      
      db.query(
        `SELECT * FROM character_data WHERE id = ?`,
        [characterQueryResults.id],
        (err, results) => {
          if (err) {
            res.sendStatus(500);
            return
          }
          
          const characterDataQueryResults = results[0];
          // console.log('results of querying character_data table are', characterDataQueryResults); //TODO remove
          const dataObject = {
            character: characterQueryResults,
            character_data: characterDataQueryResults
          };
          const userDataObject = {
            username: dataObject.character.username,
            experience: dataObject.character_data.experience,
            gold: dataObject.character_data.gold
          };
          const componentWithData = optProps ? // if optProps is truthy: call NavigationShell with optProps
            <NavigationShell userData={userDataObject} componentToRender={componentToRender} optProps={optProps} /> :
            <NavigationShell userData={userDataObject} componentToRender={componentToRender} />;
            
          return renderWithTemplate(res, componentWithData, pageTitle, templateToRender, scriptSource);
        });
    });
}

// checks for currently in progress battle via user's ID, creates one if there isn't one, and renders the page
function renderZoneBattle(res, zone, pageTitle, username, originalUrl) {
  dbQueries.getCharacterByUsername(username, (err, results) => {
    if (err) {
      res.sendStatus(500);
      return
    }
    const userData = results[0];
    dbQueries.checkBattlesInProgress(userData.id, (err, results) => {
      console.log('checked for battle in progress')
      if (err) {
        console.log('err')
        res.sendStatus(500);
        return
      }
      if (results[0] && !results[0].completed) {
        console.log('found battle')
        const battle = <Battle bg={`/static/images/zones/${originalUrl}/background.png`} originalUrl={originalUrl} />;
        return renderWithTemplate(res, battle, pageTitle);
      }
      if (!results[0] || results[0].completed) {
        console.log('didnt find battle')
        return dbQueries.renderNewBattle(res, zone, userData.id);
      }
    })
  });
}

// function that calls db querying functions asynchronously, then calls back with the queried values
// stored as keys in the results object
function handlePlayerAttack(playerID, enemyID, playerWeaponID, playerHealth, enemyHealth, cb) {

  async.parallel({
    newPlayerHealth: (callback) => {
      rollEnemyMeleeDamage(enemyID, (err, enemyDamage) => {
        callback(err, playerHealth - enemyDamage);
      });
    },
    newEnemyHealth: (callback) => {
      rollPlayerMeleeDamage(playerWeaponID, (err, playerDamage) => {
        callback(err, enemyHealth - playerDamage);
      })
    }
  },

  (err, results) => {
    if (err) {
      logger.error('Error handling player attack:', {
        err,
        results
      });
      return
    }
    dbQueries.updateBattleInProgressHealthValues({
      ...results, // assign all queried values to an object, followed by additional required variables
      playerID: playerID
    }, (newHealthValueObject) => {
      const { newPlayerHealth, newEnemyHealth, playerID } = newHealthValueObject;

      if (newPlayerHealth <= 0 || newEnemyHealth <= 0) {
        dbQueries.handleBattleComplete(playerID, (err) => {
          if (err) {
            logger.error('Error updating battle in progress while trying to mark as completed', {
              err
            });
          }
          cb(err);

        })
      }

      // moved to above callback, final placement uncertain
      //res.redirect(urlToReturnTo); // redirects player to current zone, which will re-render the battle with new state
      // TODO could be heavily optimized to hot-load new state with json endpoints, but that drastically changes the structure of the app
    })

  });
}

// function that querys db for enemy data, then calls back with a random number between
// min_melee_damage and max_melee_damage (inclusive)
function rollEnemyMeleeDamage(enemyID, cb) {
  db.query(
    `SELECT * FROM enemies WHERE id = ?`,
    [enemyID],
    (err, results) => {
      if (err) {
        cb(err);
        return
      }
      cb(null, rollDamageInRange(results[0].min_melee_damage, results[0].max_melee_damage));
    }
  );
}

// function that querys db for player weapon data, then calls back with a random number between
// min_melee_damage and max_melee_damage (inclusive)
function rollPlayerMeleeDamage(playerWeaponID, cb) {
  db.query(
    `SELECT * FROM items WHERE id = ?`,
    [playerWeaponID],
    (err, results) => {
      if (err) {
        cb(err);
        return
      }
      cb(null, rollDamageInRange(results[0].min_melee_damage, results[0].max_melee_damage));
    }
  );
}


//
//
// End impure query functions
// Begin
//
//


class Controllers {
  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
  }
  
  createLoginController() {
    //const db = this.db;
    // May have previously been used for db.loginPlayer call, updated to dbQueries.loginPlayer
    return function loginController(req, res) {
      const failedLoginPage = <LoginPage failedLogin={{display:'default'}} />;
      const usernameFromLogin = req.body.username;
      const passwordFromLogin = req.body.password;
  
      function onLoginQueryFinished(err, results) {
        if (err) {
          console.error('Failed to login player', err);
          res.sendStatus(500);
          return
        }
        const userResults = results[0];
        if (!userResults) {
          renderWithTemplate(res, failedLoginPage);
          return
        }
        if (passwordFromLogin && userResults.password === passwordFromLogin) {
          res.cookie('username', `${userResults.username}`, { signed: true, path: '/' });
          // console.log('cookie set, redirecting to /inventory');
          res.redirect(302, '/inventory');
        }
      }
      
      dbQueries.loginPlayer(usernameFromLogin, passwordFromLogin, onLoginQueryFinished);
    };
  }
  
  createSignupPostController() {
    return function signupPostController(req, res) {
      const attemptedUsername = req.body.username;
      const password = req.body.password;
      const confirmPassword = req.body.confirmPassword;
      db.query(
        `SELECT * FROM characters WHERE username=?`,
        [attemptedUsername],
        function (err, results) {
          if (err) {
            res.sendStatus(500);
            return
          }
          if (typeof results === 'object' && !results[0]) {
        
          }
          else if (typeof results === 'object' && results[0]) {
        
          }
          else res.sendStatus(500);
        }
      )
    }
  }
}

const controllers = new Controllers(db, logger);


//
//
// End
// Begin request handling for URLs
//
//


// when the base URL is requested: renders login page
app.get('/', (req, res) => {
  const loginPage = <LoginPage />;
  renderWithTemplate(res, loginPage);
});

// checks login info against db login info, temporary method for proof of concept, obviously pw shouldn't be plaintext!
// TODO: implement hashing of passwords and update this logic
app.post('/login', controllers.createLoginController());

// when /signup is requested: renders signup page
app.get('/signup', (req, res) => {
  renderWithTemplate(res, <SignupPage />, 'Sign up for JLand', 'template', '/static/scripts/signup.js');
});

// checks username against current userbase, compares passwords
// TODO: make username check happen before post
// TODO: store password via hash instead of as plaintext
app.post('/signup/post', controllers.createSignupPostController());

// when /map is requested: renders map page
app.get('/map', (req, res) => {
  const username = req.signedCookies.username;
  renderWithNavigationShell(res, username, 'map', `Onward into battle, ${username}`);
});

app.get('/inventory', (req, res) => {
  const username = req.signedCookies.username;

  dbQueries.getInventoryData(username, (err, results) => {
    if (err) {
      res.sendStatus(500);
    }

    if (results.itemData.length) {
      renderWithNavigationShell(res, username, 'inventory', `${username}'s nice things`, 'template', '',
        {results: results.itemData, itemIDs: results.itemIDs});
    } else {
      renderWithNavigationShell(res, username, 'inventory', `${username}'s nice things`, 'template', '',
        {results: [], itemIDs: []});
    }

  });

});

// when /shop is requested: redirects to /inventory
// TODO: add shop page
app.get('/shop', (req, res) => {
  const username = req.signedCookies.username;
  res.redirect(302, '/inventory');
});

// when /logout is requested: overwrites username cookie to prevent malicious requests, deletes current session,
// redirects to homepage
app.get('/logout', (req, res) => {
  res.cookie('username', null);
  delete res.session;
  res.redirect(302, '/');
});

// when /zone/enchanted_forest is requested: renders zone battle page
app.get('/zone/enchanted_forest', (req, res) => {
  const username = req.signedCookies.username;
  const zone = 'enchanted forest';
  const urlEncodedZoneName = zone.replace(' ', '_'); // Used to make a URL to redirect the user back to the right zone
  renderZoneBattle(res, zone, `Kill or be killed, ${username}`, username, urlEncodedZoneName);
});

// endpoint to be hit when player clicks 'attack' button in battle
//
app.post('/battle_attack_post' , (req, res) => {

  const userData = {
    username: req.signedCookies.username
  };

  dbQueries.getCharacterByUsername(userData.username, (err, results) => {

    userData.userID = results[0].id;

    dbQueries.getBattleInProgress(userData.userID, (err, results) => {
      const { enemy_id, player_weapon_id, player_health, enemy_health } = results;
      const urlToReturnTo = '/zone/' + results.name.replace(' ', '_');
      handlePlayerAttack(userData.userID, enemy_id, player_weapon_id, player_health, enemy_health, (err) => {
        if (err) {
          logger.error('Error getting zone name', {
            err
          });
          res.sendStatus(500);
          return
        }
        res.redirect(urlToReturnTo)
      });
    })

  });

});


//TODO: remove, was added because architecture was already set up and I wanted to test this out
app.get('/text_thing', (req, res) => {
  const username = req.signedCookies.username;
  renderWithNavigationShell(res, username, 'text_thing', 'Text Typing!', 'template', '/static/scripts/textThing.js');
});


// when any page with no response handler is requested: renders 404 text on page
app.get('/*', (req, res) => {
  res.sendStatus(404);
});

//console.log(process.env); //TODO: probably remove

// sets app to listen for requests on port 8001
app.listen(8001, function appDotListenErrorHandler(err) {
  if (err) {
    res.sendStatus(500);
    return
  }
  console.log('Listening at http://localhost:8001/');
});

