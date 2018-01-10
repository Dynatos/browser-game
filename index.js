// NPM packages
const express = require('express');
const React = require('react');
const ReactDOM = require('react-dom/server');
const bodyparser = require('body-parser');
const cookieparser = require('cookie-parser');
const mysql = require('mysql');
const cookieSession = require('cookie-session');
const chokidar = (function() {
  // had issues with process.env.NODE_ENV, removed for now
  // const production = process.env.NODE_ENV === 'production';
  // console.log(`Process running in ${process.env.NODE_ENV} mode, hot reloading if that doesn't say production`);
  // if (!production) {
    const chokidar = require('chokidar');
    const watcher = chokidar.watch('./src', null);
    watcher.on('ready', function() {
      watcher.on('all', function() {
        console.log("Clearing /app/ module cache from server");
        Object.keys(require.cache).forEach(function(id) {
          if (/[\/\\]app[\/\\]/.test(id)) delete require.cache[id]
        })
      })
    });
 // }
}());

// imported components and data
import { experience } from './src/constants/experienceObject';
import LoginPage from './src/components/LoginPage';
import Battle from './src/components/Battle';
import NavigationShell from './src/components/NavigationShell';
import SignupPage from './src/components/SignupPage';

// initialize app and database
const app = express();
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'thisisplaintextlmao',
  database: 'first',
  typeCast: function castField(field, useDefaultTypeCasting) {
    // We only want to cast bit fields that have a single-bit in them. If the field
    // has more than one bit, then we cannot assume it is supposed to be a Boolean.
    if ((field.type === "BIT" ) && (field.length === 1)) {
      const bytes = field.buffer();
      // A Buffer in Node represents a collection of 8-bit unsigned integers.
      // Therefore, our single "bit field" comes back as the bits '0000 0001',
      // which is equivalent to the number 1.
      return( bytes[ 0 ] === 1 );
    }
    return( useDefaultTypeCasting() );
  } // transforms buffers (bits) to boolean
});
db.connect(function databaseConnectErrorHandler(err) {
  if (err) {
    console.log(`Error connecting to database, error message: ${err}`);
    throw err;
  }
});

// database class for initiating db functions and attaching them to any number of dbs
class DatabaseClient {
  constructor(db) {
    this.db = db;
  } //
  
  getCharacterByUsername(username, callback) {
    this.db.query(
      `SELECT * FROM characters WHERE username=?`,
      [username],
      callback
    )
  }
  
  getCharacterDataByID(id, callback) {
    this.db.query(
      `SELECT * FROM character_data WHERE id=?`,
      [id],
      callback
    )
  }
  
  getEquippedWeaponByCharacterID(characterID, callback) {
    this.db.query(
      `SELECT * FROM inventory WHERE character_id=? AND equipped=true`,
      [characterID],
      callback
    )
  }
  
  checkBattlesInProgress(character_ID, callback) {
    this.db.query(
      `SELECT * FROM battles_in_progress WHERE character_id=?`,
      [character_ID],
      callback
    )
  }
  
  // TODO: extract data fetching from component rendering, add handling for errors
  renderNewBattle(res, zone, userID) {
    this.getEquippedWeaponByCharacterID(userID, function(err, results) {
      if (err) res.send(500);
      const equippedWeaponData = results[0];
      this.getCharacterDataByID(userID,
        function(err, results) {
          if (err) res.send(500);
          const characterData = results[0];
          const characterLevel = getLevel(characterData.experience);
          const characterHealth = calculateHealth(characterLevel);
          this.getRandomEnemyByZone(zone, function(enemies, randNum, randEnemy, zoneID) {
            db.query(
              `SELECT * FROM enemies WHERE id=?`,
              [randEnemy.enemy_id],
              function(err, results) {
                if (err) res.send(500);
                const enemyData = results[0];
                this.insertIntoBattlesInProgress(userID, randEnemy.enemy_id, zoneID, equippedWeaponData.item_id, characterHealth, enemyData.initial_health,
                  function(err) {
                    if (err) res.send(500);
                    const battle = <Battle bg={'/static/images/zones/enchanted_forest/background.png'} />;
                    return renderWithTemplate(res, battle);
                  })
              })
          })
        })
    })
  }
  
  insertIntoBattlesInProgress(userID, enemy, zoneID, equippedWeaponID, characterHealth, enemyHealth, callback) {
    this.db.query(
      `INSERT INTO battles_in_progress (character_id, enemy_id, zone_id, player_weapon_id, player_health, enemy_health, completed) VALUES (?, ?, ?, ?, ?, ?, default)`,
      [userID, enemy, zoneID, equippedWeaponID, characterHealth, enemyHealth],
      callback
    )
  }
  
  getRandomEnemyByZone(zone, callback) {
    this.db.query(
      `SELECT * FROM zones WHERE name=?`,
      [zone],
      function(err, results) {
        if (err) console.log(`Error getting zone from database, error message: ${err}`);
        const zoneData = results[0];
        db.query(
          `SELECT * FROM zone_enemies WHERE zone_id=?`,
          [zoneData.id],
          function(err, results) {
            if (err) console.log(`Error getting zone_enemies from database, error message: ${err}`);
            const enemies = results;
            const randNum = Math.random();
            const randEnemy = enemies[Math.floor(randNum * enemies.length)];
            callback(enemies, randNum, randEnemy, zoneData.id);
          })
      })
  }
}

const dbQueries = new DatabaseClient(db); //instantiate db

function renderWithTemplate (res, componentToRender, title = 'JLand', templateToRender = 'template', scriptSource = '') {
  return res.render(templateToRender, {reactData: ReactDOM.renderToStaticMarkup(componentToRender), title: title,
    scriptSource: scriptSource})
} //function to make templates opt-in, also allows for easy script insertion
function getLevel(exp) {
  let returnNum;
  let exper = exp;
  for (let i = 1; exper >= experience[i]; i++) {
    returnNum = i;
    exper -= experience[i];
  }
  return returnNum;
} //function to calculate player level from experience number, necessary because storing exp and level could cause inconsistency
function calculateHealth (playerLevel) {
  const healthBonusFromLevel = playerLevel * 15;
  return 85 + healthBonusFromLevel;
}
function renderWithNavigationShell (res, username, componentToRender, pageTitle, templateToRender = 'template',
                                   scriptSource = '', optProps) {
  db.query(
    `SELECT * FROM characters WHERE username = ?`,
    [username],
    function(err, results) {
      if (err) res.send(500);
      const characterQueryResults = results[0];
      // console.log('results from querying characters table for ', username, 'are ', characterQueryResults);
      db.query(
        `SELECT * FROM character_data WHERE id = ?`,
        [characterQueryResults.id],
        function(err, results) {
          if (err) res.send(500);
          const characterDataQueryResults = results[0];
          // console.log('results of querying character_data table are', characterDataQueryResults);
          const dataObject = {
            character: characterQueryResults,
            character_data: characterDataQueryResults
          };
          const userDataObject = {
            username: dataObject.character.username,
            experience: dataObject.character_data.experience,
            gold: dataObject.character_data.gold
          };
          const componentWithData = optProps ?
            <NavigationShell userData={userDataObject} componentToRender={componentToRender} optProps={optProps} /> :
            <NavigationShell userData={userDataObject} componentToRender={componentToRender} />;
          return renderWithTemplate(res, componentWithData, pageTitle, templateToRender, scriptSource);
        });
    });
} //function to render component inside character data top bar and navigation left bar
function renderZoneBattle(res, zone, pageTitle, username) {
  dbQueries.getCharacterByUsername(username, function onGetCharacterForRenderZoneBattle(err, results) {
    const userData = results[0];
    dbQueries.checkBattlesInProgress(userData.id, function(err, results) {
        if (err) res.send(500);
        if (results[0] && !results[0].completed) {
          const battle = <Battle bg={'/static/images/zones/enchanted_forest/background.png'}/>;
          return renderWithTemplate(res, battle);
        }
        if (!results[0]) {
          dbQueries.renderNewBattle(res, zone, userData.id);
        }
      })
  });
} //function that checks for currently in progress battle, creates one if there isn't one, and renders the page

app.set('view engine', 'pug'); //sets template engine to pug
app.use(bodyparser.urlencoded()); //allows url encoding to be understood
app.use(cookieparser('urgheyyoubighomolol')); //secret for cookies
app.use('/static', express.static('src/static')); //sets static path
app.use(cookieSession({
  name: 'user-session',
  keys: ['urgheyyoubighomolol'],
  maxAge: .025 * 10 * 60 * 1000 //15 seconds
})); //sets express to use cookie sessions, uses a secret, and sets max age


app.get('/', function(req, res) {
  const loginPage = <LoginPage />;
  renderWithTemplate(res, loginPage);
});

app.post('/login', function(req, res) {
  const failedLoginPage = <LoginPage failedLogin={{display:'default'}} />;
  const usernameFromLogin = req.body.username;
  const passwordFromLogin = req.body.password;
  db.query(
    `SELECT * FROM characters WHERE username = ? AND password = ?`,
    [usernameFromLogin, passwordFromLogin],
    function(err, results) {
      if (err) res.send(500);
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
  });
});

app.get('/signup', function(req, res) {
  renderWithTemplate(res, <SignupPage />, 'Sign up for JLand', 'template', "/static/scripts/signup.js");
});

app.post('/signup/post', function(req, res) {
  const attemptedUsername = req.body.username;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  db.query(
    `SELECT * FROM characters WHERE username=?`,
    [attemptedUsername],
    function(err, results) {
      if (err) res.send(500);
      if (typeof results === 'object' && !results[0]) {
      
      }
      else if (typeof results === 'object' && results[0]) {
      
      }
      else res.send(500);
    }
  )
});

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
      if (err) res.send(500);
      const userData = results[0];
      db.query(
        `SELECT * FROM inventory WHERE character_id=?`,
        [userData.id],
        function(err, results) {
          if (err) res.send(500);
          const itemIDs = [];
          if (results) {
            results.forEach(function inventoryItemForEachCallback(e) {
              if (itemIDs.indexOf(e.item_id) !== -1) {
                return;
              }
              itemIDs.push(e.item_id);
            });
          }
          db.query(
            `SELECT * FROM items WHERE id IN (?)`,
            [itemIDs],
            function(err, results) {
              if (err) res.send(500);
              renderWithNavigationShell(res, username, 'inventory', `${username}'s nice things`, 'template', '', results);
            });
        });
    });
});

app.get('/zone/enchanted_forest', function(req, res) {
  const username = req.signedCookies.username;
  const zone = 'enchanted forest';
  renderZoneBattle(res, zone, `Kill or be killed, ${username}`, username);
});

app.get('/shop', function(req, res) {
  const username = req.signedCookies.username;
  res.redirect(302, '/inventory');
});

app.get('/logout', function(req, res) {
  res.cookie('username', null);
  delete res.session;
  res.redirect(302, '/');
});

app.get('/text_thing', function(req, res) {
  const username = req.signedCookies.username;
  renderWithNavigationShell(res, username, 'text_thing', 'Text Typing!', 'template', '/static/scripts/textThing.js');
});

app.get('/*', function(req, res) {
  res.send('404, page not found');
});

app.listen(8001, function appDotListenErrorHandler(err) {
  if (err) res.send(500);
  console.log('Listening at http://localhost:8001/');
});

