// database class for initiating db functions and attaching them to any number of dbs
export default class DatabaseClient {
  constructor(db, logger) {
    this.db = db; //database dependency injection
    this.logger = logger;
  }
  
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
  
  loginPlayer(usernameFromLogin, passwordFromLogin, cb) {
    db.query(
      `SELECT * FROM characters WHERE username = ? AND password = ?`,
      [usernameFromLogin, passwordFromLogin],
      cb
    );
  }
  
  // TODO: extract data fetching from component rendering, add handling for errors
  renderNewBattle(res, zone, userID) {
    const logger = this.logger;
    this.getEquippedWeaponByCharacterID(userID, function(err, results) {
      if (err) {
        logger.error('Error fetching equipment weapon by character ID', {
          err,
          results
        });
        return res.send(500);
      }
      const equippedWeaponData = results[0];
      this.getCharacterDataByID(userID,
        function(err, results) {
          if (err) {
            logger.error('Error getting character data by ID', err);
            return;
          }
          const characterData = results[0];
          const characterLevel = getLevel(characterData.experience);
          const characterHealth = getHealth(characterLevel);
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
      `INSERT INTO battles_in_progress (character_id, enemy_id, zone_id, player_weapon_id, player_health, enemy_health,
      completed) VALUES (?, ?, ?, ?, ?, ?, default)`,
      [userID, enemy, zoneID, equippedWeaponID, characterHealth, enemyHealth],
      callback
    )
  }
  
  getRandomEnemyByZone(zone, callback) {
    logger.info('getting random enemy by zone', {zone});
    this.db.query(
      `SELECT * FROM zones WHERE name=?`,
      [zone],
      function(err, results) {
        if (err) {
          logger.error('Error getting random enemy by zone', {
            err,
            zone
          });
          return;
        }
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
