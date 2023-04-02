const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

app.use(express.json());
const app=express()

let databasePath=path.join(__dirname,"cricketMatchDetails.db");

let database=null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year:dbObject.year,
  };
};

const convertPlayerMatchDbObjectToResponseObject = (dbObject) => {
  return {
    playerMatchId:dbObject.player_match_id
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score:dbObject.score,
    fours:dbObject.fours,
    sixes:dbObject.sixes,
  };
};


app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
      *
    FROM
      player_details;`;
  const playersArray = await database.all(getPlayersQuery);
  response.send(playersArray)
});


app.get("/players/:playerId/",async(request,response)=>{
    const {playerId}=request.params;
    const getPlayerQuery=`
    SELECT * FROM player_details
    WHERE playerId=${playerId};`;
    const player=await database.get(getPlayerQuery);
    response.send(convertPlayerDbObjectToResponseObject(player));
});

app.put("/players/:playerId/",async(request,response)=>{
    const{playerId}=request.params;
    const{playerName}=request.body;
    const putPlayerQuery=`
    UPDATE player_details
    SET 
    player_name=${playerName}
    WHERE player_id=${playerId};`;
    await database.run(putPlayerQuery);
    response.send("Player Details Updated");

})

app.get("/matches/:matchId/",async(request,response)=>{
    const{matchId}=request.params;
    const getMatchQuery=`
    SELECT * FROM match_details
    WHERE match_id=${matchId};`;
   const match= await database.get(getMatchQuery);
    response.send(convertMatchDbObjectToResponseObject(match));
});

app.get("/players/:playerId/matches",async(request,response)=>{
    const{playerId}=request.params;
    const getPlayerMatchesQuery=`
    SELECT * FROM player_match_score
    NATURAL JOIN match_score
    WHERE player_id=${playerId};`;
   const playerMatch= await database.get(getMatchesQuery)
   response.send(playerMatch.map((eachMatch)=>convertPlayerMatchDbObjectToResponseObject(eachMatch)
   )
   ); 
});


app.get("/matches/:matchId/players,async(request,response)=>{
    const{matchId}=request.params;
    const getMatchPlayersQuery = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
         const matchPlayers=await database.get(getMatchPlayersQuery);
         response.send(matchPlayers.map((matchPlayer)=>convertPlayerMatchDbObjectToResponseObject(matchPlayer);
         )
        );

});

app.get("/players/:playerId/playerScores",async(request,response)=>{
    const{playerId}=request.params;
     const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
    const playerScores=await database.get(getPlayerScored);
    response.send(playerScores.map((playerScore)=>convertPlayerMatchDbObjectToResponseObject(playerScore)
    )
    );
});





module.exports = app;