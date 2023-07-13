const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () => {
      console.log("Server Running at http://localhost:3003/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDbToResponse = (dbO) => {
  return {
    playerId: dbO.player_id,
    playerName: dbO.player_name,
    matchId: dbO.match_id,
    match: dbO.match,
    year: dbO.year,
  };
};


// API 1
app.get("/players/", async (request, response) => {
  const getPlayersDetailsQuery = `
        SELECT
            *
        FROM
            player_details
        ORDER BY
            player_id;`;
  const playersArray = await db.all(getPlayersDetailsQuery);
  response.send(playersArray.map((eachOne) => convertDbToResponse(eachOne)));
});

// API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetailsQuery = `
        SELECT
            *
        FROM
            player_details
        WHERE
            player_id = ${playerId};`;
  const playerDetails = await db.get(playerDetailsQuery);
  response.send(convertDbToResponse(playerDetails));
});

// API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
        UPDATE
            player_details
        SET
            player_name = '${playerName}'
        WHERE
            player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
        SELECT
            *
        FROM
            match_details
        WHERE
            match_id = ${matchId};`;
  const matchDetails = await db.get(matchDetailsQuery);
  response.send(convertDbToResponse(matchDetails));
});

// API 5
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
        SELECT
            match_id,
            match,
            year
        FROM 
            player_match_score NATURAL JOIN match_details
        WHERE
            player_id = ${playerId};`;
  const matchArray = await db.all(getPlayerMatchesQuery);
  response.send(matchArray.map((eachOne) => convertDbToResponse(eachOne)));
});

// API 6
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
        SELECT
            player_id,
            player_name
        FROM 
            player_match_score NATURAL JOIN player_details
        WHERE
            match_id = ${matchId};`;
  const playersArray = await db.all(getMatchPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertDbToResponse(eachPlayer))
  );
});

// API 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayersQuery = `
        SELECT
            player_id AS playerId,
            player_name AS playerName,
            SUM(score) AS totalScore,
            SUM(fours) AS totalFours,
            SUM(sixes) AS totalSixes
        FROM 
            player_match_score NATURAL JOIN  player_details
        WHERE
            player_id = ${playerId};`;
  const playersMatchDetails = await db.get(getMatchPlayersQuery);
  response.send(playersMatchDetails);
});

module.exports = app;

