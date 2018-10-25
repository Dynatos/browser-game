Welcome to my browser game! This is a game I'm working on that utilizes a MySQL database (MariaDB) to store all game data and state. My goal is to host this as a live game with persistent accounts that you can log into from any browser on any platform. All calculations are done on the server side to prevent cheating. Battle is turn-based, and the status of a battle is stored so that players can continue any in-progress battles from any device. This is also to prevent players from having the ability to run from battles. Battles end only when the player or the monster dies.

All items are stored as a set of values in the database, this means that items can be changed while the servers are running (won't effect 'in progress' battles, starting damage values are stored as part of in-progress battle state). This also means that items can be added while the servers are running. You can find a set of database build commands in the gameBuildingFile folder, use buildFileWithoutTemplate to build the database's tables and populate them with the game's content.

The frontend is mostly React, components can be found in /src/components

The backend is mostly Express, main file can be found at /index.js
