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
    watcher.on('ready', function() {
      watcher.on('all', function() {
        console.log('Clearing /app/ module cache from server');
        Object.keys(require.cache).forEach(function(id) {
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
          logger.error('Error fetching from characters using Username', {
            err,
            results
          });
          callback(err, results);
          return;
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
          logger.error('Error fetching from character_data using Character_ID', {
            err,
            results
          });
          callback(err, results);
          return;
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
          logger.error('Error fetching currently equipped weapon from inventory using Character_ID', {
            err,
            results
          });
          callback(err, results);
          return;
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
          return;
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
          return;
        }
        callback(null, results);
      }
    );
  }
  
  // TODO: extract data fetching from component rendering, add handling for errors
  renderNewBattle(res, zone, userID) {
    const logger = this.logger;
    const that = this;

    async.auto({
      getEquippedWeapon: (callback) => this.getEquippedWeaponByCharacterID(userID, callback),
      getCharacterData: (callback) => this.getCharacterDataByID(userID, callback),
      getRandomEnemy: (callback) => this.getRandomEnemyByZoneName(zone, (err, enemies, randNum, randEnemy, zoneID) => {
        callback(err, {enemies, randNum, randEnemy, zoneID});
      }),
      setBattleInProgress: ['getEquippedWeapon', 'getCharacterData', 'getRandomEnemy', (results, callback) => {
        this.insertIntoBattlesInProgress(
          userID,
          results.getRandomEnemy.enemies.enemy_id,
          results.getRandomEnemy.enemies.zone_id,
          results.getEquippedWeapon[0].item_id,
          getHealth(getLevel(results.getCharacterData[0].experience)),
          results.getRandomEnemy.enemies.initial_health,
          callback
        );
      }]
    }, (err, results) => {
      if (err) {
        logger.error('Error rendering new battle', err);
        return
      }
      console.log('Created new battle', results);
    });

    const battle = <Battle bg={'/static/images/zones/enchanted_forest/background.png'} />;
    return renderWithTemplate(res, battle);
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
          return;
        }
        callback(null, results);
      }
    )
  }

  getRandomEnemyByZoneName(zone, callback) {
    logger.info('getting random enemy by zone', {zone});

    async.auto({
      getZoneID: (callback) => this.getZoneID(zone, callback),
      getZoneEnemies: ['getZoneID', (results, callback) => this.getZoneEnemies(results.getZoneID[0], callback)],
      getEnemyData: ['getZoneEnemies', (results, callback) => this.getEnemyData(results.getZoneEnemies[2], callback)]
    }, (err, results) => {
      if (err) {
        logger.error('Error inserting into battles_in_progress', {
          err,
          results
        });
        callback(err, results);
        return;
      }
      callback(null, {
        enemy_id: results.getZoneEnemies[2].enemy_id,
        initial_health: results.getEnemyData[0].initial_health,
        zone_id: results.getZoneID[0].id
      });
    })
  }

  getZoneID(zone, callback) {
    this.db.query(
      `SELECT * FROM zones WHERE name=?`,
      [zone],
      (err, results) => {
        if (err) {
          logger.error('Error inserting into battles_in_progress', {
            err,
            results
          });
          callback(err, results);
          return;
        }
        callback(null, results);
    })
  }

  getZoneEnemies(zoneData, callback) {
    this.db.query(
      `SELECT * FROM zone_enemies WHERE zone_id=?`,
      [zoneData.id],
      (err, results) => {
        if (err) {
          logger.error('Error getting zone_enemies from database, error message:', {
            err,
            results
          });
          callback(err, results);
          return;
        }
        const enemies = results;
        const randNum = Math.random();
        const randEnemy = enemies[Math.floor(randNum * enemies.length)];
        callback(null, enemies, randNum, randEnemy, zoneData.id);
      })
  }

  getEnemyData(randEnemy, callback) {
    this.db.query(
      `SELECT * FROM enemies WHERE id=?`,
      [randEnemy.enemy_id],
      (err, results) => {
        if (err) {
          logger.error('Error inserting into battles_in_progress', {
            err,
            results
          });
          callback(err, results);
          return;
        }
        callback(null, results);
      })
  }


}

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
// Begin declaration of pure logical functions
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
  let returnNum;
  let exper = exp;
  for (let i = 1; exper >= experience[i]; i++) {
    returnNum = i;
    exper -= experience[i];
  }
  return returnNum;
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
  
  return min + Math.round((Math.random() * damageRange));
  // get a random value between 0 and 1, then multiply by range to get a value between 0 and damageRange,
  // then round to a whole num and add min to get a damage value between range of min and max (inclusive)
}


//
//
// End pure logical functions
// Begin impure query functions
//
//


// render component inside 'character data top bar' and 'navigation left bar'
// TODO: remove commented console statements when no longer necessary or update to logger calls
function renderWithNavigationShell(res, username, componentToRender, pageTitle, templateToRender = 'template',
                                   scriptSource, optProps) {
  db.query(
    `SELECT * FROM characters WHERE username = ?`,
    [username],
    function(err, results) {
      if (err) {
        res.send(500);
        return;
      }
      
      const characterQueryResults = results[0];
      // console.log('results from querying characters table for ', username, 'are ', characterQueryResults); //TODO remove
      
      db.query(
        `SELECT * FROM character_data WHERE id = ?`,
        [characterQueryResults.id],
        function(err, results) {
          if (err) {
            res.send(500);
            return;
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
  dbQueries.getCharacterByUsername(username, function onGetCharacterForRenderZoneBattle(err, results) {
    if (err) {
      res.send(500);
      return
    }
    const userData = results[0];
    dbQueries.checkBattlesInProgress(userData.id, function(err, results) {
      if (err) {
        res.send(500);
        return
      }
        if (results[0] && !results[0].completed) {
          const battle = <Battle bg={'/static/images/zones/enchanted_forest/background.png'} originalUrl={originalUrl} />;
          return renderWithTemplate(res, battle, pageTitle);
        }
        if (!results[0]) {
          dbQueries.renderNewBattle(res, zone, userData.id);
        }
      })
  });
}

// function that calls db querying functions asynchronously, then calls back with the queried values
// stored as keys in the results object
function playerAttack(playerID, enemyID, playerWeaponID, playerHealth, enemyHealth, res, urlToReturnTo) {
  async.parallel({
    newPlayerHealth: function(callback) {
      console.log('inside newPlayerHealth');
      rollEnemyMeleeDamage(enemyID, (err, enemyDamage) => {
        callback(err, playerHealth - enemyDamage);
      });
    },
    newEnemyHealth: function(callback) {
      console.log('inside newEnemyHealth');
      rollPlayerMeleeDamage(playerWeaponID, (err, playerDamage) => {
        callback(err, enemyHealth - playerDamage);
      })
    }
  },
    function(err, results) {
      console.log('inside final cb, err: ', err, ' results: ', results);
      playerAttackCallback(err, {
        ...results, // assign all queries values to an object, followed by additional required variables
        playerID: playerID,
        res: res,
        urlToReturnTo: urlToReturnTo
      })
    }
  );
}

// function that querys db for enemy data, then calls back with a random number between
// min_melee_damage and max_melee_damage (inclusive)
function rollEnemyMeleeDamage(enemyID, cb) {
  db.query(
    `SELECT * FROM enemies WHERE id = ?`,
    [enemyID],
    function(err, results) {
      if (err) {
        cb(err);
        return;
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
    function(err, results) {
      if (err) {
        cb(err);
        return;
      }
      cb(null, rollDamageInRange(results[0].min_melee_damage, results[0].max_melee_damage));
    }
  );
}

// callback function that
function playerAttackCallback(err, results) {
  if (err) {
    console.log('error in playerAttackCallback, this: ', this);
    return;
  }
  const { newPlayerHealth, newEnemyHealth, playerID, res, urlToReturnTo } = results;
  db.query(
    `UPDATE battles_in_progress SET player_health = ?, enemy_health = ? WHERE character_id = ?`,
    [newPlayerHealth, newEnemyHealth, playerID],
    function(err) {
      if (err) throw err;
      console.log('newEnemyHealth, newPlayerHealth: ', newEnemyHealth, newPlayerHealth);
      res.redirect(urlToReturnTo); // redirects player to current zone, which will re-render the battle with new state
      // TODO could be heavily optimized to hot reload state with json endpoints, but that drastically changes the structure of the app
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
          res.send(500);
          return;
        }
        const userResults = results[0];
        if (!userResults) {
          renderWithTemplate(res, failedLoginPage);
          return;
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
            res.send(500);
            return;
          }
          if (typeof results === 'object' && !results[0]) {
        
          }
          else if (typeof results === 'object' && results[0]) {
        
          }
          else res.send(500);
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
app.get('/', function(req, res) {
  const loginPage = <LoginPage />;
  renderWithTemplate(res, loginPage);
});

// checks login info against db login info, temporary method for proof of concept, obviously pw shouldn't be plaintext!
// TODO: implement hashing of passwords and update this logic
app.post('/login', controllers.createLoginController());

// when /signup is requested: renders signup page
app.get('/signup', function(req, res) {
  renderWithTemplate(res, <SignupPage />, 'Sign up for JLand', 'template', '/static/scripts/signup.js');
});

// checks username against current userbase, compares passwords
// TODO: make username check happen before post
// TODO: store password via hash instead of as plaintext
app.post('/signup/post', controllers.createSignupPostController());

// when /map is requested: renders map page
app.get('/map', function(req, res) {
  const username = req.signedCookies.username;
  renderWithNavigationShell(res, username, 'map', `Onward into battle, ${username}`);
});

app.get('/inventory', function(req, res) {
  const username = req.signedCookies.username;
  db.query(
    `SELECT * FROM characters WHERE username=?`,
    [username],
    function(err, results) {
      if (err) {
        res.sendStatus(500);
        return;
      }
      const userData = results[0];
      db.query(
        `SELECT * FROM inventory WHERE character_id=?`,
        [userData.id],
        function(err, results) {
          if (err) {
            res.sendStatus(500);
            return;
          }
          const itemIDs = [];
          if (results.length) {
            results.forEach(function inventoryItemForEachCallback(e) {
              itemIDs.push(e.item_id);
            });
          } else {
            renderWithNavigationShell(res, username, 'inventory', `${username}'s nice things`, 'template', '',
              {results: [], itemIDs: []});
            return;
          }
          //console.log('results from query for inventory items: ', itemIDs); TODO: remove
          db.query(
            `SELECT * FROM items WHERE id IN (?)`,
            [itemIDs],
            function(err, results) {
              if (err) {
                res.sendStatus(500);
                return;
              }
              // console.log('Rendering Inventory component with optProps:',
              //   JSON.stringify({results: results, itemIDs: itemIDs}));
              if (results && itemIDs && typeof results !== 'undefined' && typeof itemIDs[0] !== 'undefined') {
                renderWithNavigationShell(res, username, 'inventory', `${username}'s nice things`, 'template', '',
                  {results: results, itemIDs: itemIDs});
              } else {
                renderWithNavigationShell(res, username, 'inventory', `${username}'s nice things`, 'template', '',
                  {results: [], itemIDs: []});
              }
            });
        });
    });
});

// when /zone/enchanted_forest is requested: renders zone battle page
app.get('/zone/enchanted_forest', function(req, res) {
  const username = req.signedCookies.username;
  const zone = 'enchanted forest';
  const urlEncodedZoneName = (function urlEncodedZoneName(zoneName) {
    return  zoneName.replace(' ', '_');
  }(zone)); // IIFE that allows query parameter to be added to request URL; used to redirect the user back to the right zone
  renderZoneBattle(res, zone, `Kill or be killed, ${username}`, username, urlEncodedZoneName);
});

// when /shop is requested: redirects to /inventory
// TODO: add shop page
app.get('/shop', function(req, res) {
  const username = req.signedCookies.username;
  res.redirect(302, '/inventory');
});

// when /logout is requested: overwrites username cookie to prevent malicious requests, deletes current session,
// redirects to homepage
app.get('/logout', function(req, res) {
  res.cookie('username', null);
  delete res.session;
  res.redirect(302, '/');
});

//TODO: remove, was added because architecture was already set up and I wanted to test this out
app.get('/text_thing', function(req, res) {
  const username = req.signedCookies.username;
  renderWithNavigationShell(res, username, 'text_thing', 'Text Typing!', 'template', '/static/scripts/textThing.js');
});

// endpoint to be hit when player clicks 'attack' button in battle
//
app.post('/battle_attack_post' , function (req, res) {
  const username = req.signedCookies.username;
  db.query(
    `SELECT * FROM characters WHERE username=?`,
    [username],
    function(err, results) {
      if (err) throw err;
      const playerID = results[0].id;
      db.query(
        `SELECT * FROM battles_in_progress JOIN zones ON (battles_in_progress.zone_id = zones.id) WHERE character_id=?;`,
        [playerID],
        function(err, results) {
          if (err) throw err;
          const { enemy_id, player_weapon_id, player_health, enemy_health } = results[0];
          const urlToReturnTo = '/zone/' + results[0].name.replace(' ', '_');
          playerAttack(playerID, enemy_id, player_weapon_id, player_health, enemy_health, res, urlToReturnTo);
        }
      );
    }
  )
});

app.get('/test', function(req, res) {

  dbQueries.loginPlayer(
    'therealgentoo',
    'password',
    function(err, results) {
      if (err) throw err;

      res.send(results[0]);
    }
  );

  // db.query(
  //   `SELECT * FROM characters WHERE username = ? AND password = ?`,
  //   ['therealgentoo', 'password'],
  //   function(err, results) {
  //     if (err) throw err;
  //
  //     res.send(results[0]);
  //   }
  // );
});

// when any page with no response handler is requested: renders 404 text on page
app.get('/*', function(req, res) {
  res.sendStatus(404);
});

//console.log(process.env); //TODO: probably remove

// sets app to listen for requests on port 8001
app.listen(8001, function appDotListenErrorHandler(err) {
  if (err) {
    res.send(500);
    return;
  }
  console.log('Listening at http://localhost:8001/');
});

