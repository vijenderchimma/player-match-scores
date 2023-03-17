const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server is Running http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDbObjectAndResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    playerMatchId: dbObject.player_match_id,
    match: dbObject.match,
    year: dbObject.year,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
    totalScore: dbObject.totalScore,
    totalFours: dbObject.totalFours,
    totalSixes: dbObject.totalSixes,
  };
};
//GET ALL PLAYERS DETAILS
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT *
    FROM player_details;
    `;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectAndResponseObject(eachPlayer)
    )
  );
});

//GET PLAYER DETAILS
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `
    SELECT *
    FROM player_details
    WHERE player_id = ${playerId};
    `;
  const playersArray = await db.get(getPlayersQuery);
  response.send(convertDbObjectAndResponseObject(playersArray));
});

//POST PLAYER DETAILS

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerDetailsQuery = `
    UPDATE player_details
    SET 
    player_name = '${playerName}'
    WHERE player_id = ${playerId};
    `;
  await db.run(updatePlayerDetailsQuery);
  response.send("Player Details Updated");
});

//GET MATCH DETAILS

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId};
    `;
  const matchArray = await db.get(getMatchQuery);
  response.send(convertDbObjectAndResponseObject(matchArray));
});

//GET PLAYER ALL MATCHES

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `
    SELECT match_id,match,year
    FROM player_match_score NATURAL JOIN match_details
    WHERE player_id = ${playerId}
    `;
  const matchArray = await db.all(getMatchQuery);
  response.send(
    matchArray.map((eachMatch) => convertDbObjectAndResponseObject(eachMatch))
  );
});

//GET PLAYER LIST

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `
    SELECT player_id,player_name
    FROM player_match_score NATURAL JOIN player_details
    WHERE match_id = ${matchId};
    `;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectAndResponseObject(eachPlayer)
    )
  );
});

//GET SCORES OF ALL PLAYERS

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoresQuery = `
    SELECT player_id,player_name,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM player_match_score NATURAL JOIN player_details
    WHERE player_id = ${playerId}
    GROUP BY player_id
    `;
  const playersScoreArray = await db.get(getPlayerScoresQuery);
  response.send(convertDbObjectAndResponseObject(playersScoreArray));
});

module.exports = app;
