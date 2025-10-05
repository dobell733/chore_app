require('dotenv').config();
const express = require("express");
const app = express();
const cors = require("cors");
const queryDB = require("./database/db");
const { Client, Events, GatewayIntentBits } = require('discord.js');

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000'];

const port = process.env.PORT || 5000;

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },  
  methods: 'GET,PUT,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

// middleware
app.use(cors(corsOptions));
app.use(express.json()); // req.body

// Initialize Discord bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.login(process.env.BOT_TOKEN);

// Parent PIN verification (server-side)
app.post("/parent/auth/verify-pin", (req, res) => {
  try {
    const { pin } = req.body || {};
    const expected = process.env.PARENT_PIN;

    if (!expected) {
      return res.status(500).json({ error: "Server PIN is not configured" });
    }

    if (typeof pin === "string" && pin === expected) {
      return res.json({ ok: true });
    }

    return res.status(401).json({ ok: false, error: "Invalid PIN" });
  } catch (e) {
    console.error("Error verifying PIN:", e);
    return res.status(500).json({ error: "Unable to verify PIN" });
  }
});

// ROUTES //
// Get all child id's and names
app.get("/children", async (req, res) => {
    try {
        const children = await queryDB("SELECT kid_id AS id, name FROM Kids");
        res.json(children);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
 });

// Get all chores for a child
app.get("/chores/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const chores = await queryDB(
      `SELECT 
          C.chore_id AS id,
          C.chore_name AS name,
          C.point_value AS points,
          KC.is_locked AS is_locked,
          KC.unlock_time AS unlock_time
        FROM Kids AS K
        INNER JOIN Kids_Chores AS KC ON K.kid_id = KC.kid_id
        INNER JOIN Chores AS C ON KC.chore_id = C.chore_id
        WHERE K.kid_id = $1`,
        [id]
    );
  
    const kidInfo = await queryDB(
      `SELECT points
      FROM Kids
      WHERE kid_id = $1`,
      [id]
    );

    const totalPoints = kidInfo[0]?.points || 0;
    
    // Send both chores and totalPoints in the response
    res.json({ chores, totalPoints });
  } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Payout and reset points
app.put("/payout/:kid_id/:kid_name", async (req, res) => {
  const { kid_id, kid_name } = req.params;
  const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
  if (channel) {
    const message = await channel.send(`${kid_name} wants to get paid. Did you do it? (yes/no)`);

    try {
      // Wait for a reply
      const filter = m => m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'no';
      const collected = await message.channel.awaitMessages({ filter, max: 1, time: process.env.MESSAGE_WAIT_TIME, errors: ['time'] });
      const reply = collected.first().content.toLowerCase();

      if (reply === 'yes') {
        const response = await queryDB(
          `UPDATE Kids
          SET points = 0
          WHERE kid_id = $1`,
          [kid_id]
        );
        res.json({ status: 'confirmed' });
      } else {
        res.json({ status: 'not confirmed' });
      }
    } catch (error) {
      res.json({ status: 'not confirmed' });
    }
  } else {
    res.status(500).json({ error: 'Discord channel not found' });
  }
});

const choreUnlockTimes = {
  "Fold and Put Away Clothes": 168,
  "Make Your Bed": 24,
  "Sweep Hallway": 84,
  "Wipe Down Surfaces": 168,
  "Empty Trash": 168,
  "Wipe Door Handles": 168,
  "Wash Your Dishes": 24,
  "Vacuum Your Room": 168,
  "Put Away Toys / Clean Up Clutter": 48,
  "Put Away Toys": 48,
  "Feed Pets": 48,
};

// Complete a chore
app.put("/chores/:kid_id/:chore_id/:chore_points", async (req, res) => {
  const { kid_id, chore_id, chore_points } = req.params;
  const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
  if (channel) {
    console.log("Discord channel found"); // Log if the Discord channel is found

    const kid = await queryDB(`SELECT name FROM Kids WHERE kid_id = $1`, [kid_id]);
    const chore = await queryDB(`SELECT chore_name FROM Chores WHERE chore_id = $1`, [chore_id]);

    const chore_name = chore[0].chore_name;
    const message = await channel.send(`${kid[0].name} completed "${chore_name}". Confirm? (yes/no)`);

    const unlockTime = choreUnlockTimes[chore_name] || 24; // Default to 24 hours if chore not found in mapping

    try {
      // Wait for a reply
      const filter = m => m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'no';
      const collected = await message.channel.awaitMessages({ filter, max: 1, time: process.env.MESSAGE_WAIT_TIME, errors: ['time'] });
      const reply = collected.first().content.toLowerCase();

      if (reply === 'yes') {
        const response = await queryDB(
          `UPDATE Kids_Chores
          SET is_locked = true,
            unlock_time = (CURRENT_TIMESTAMP AT TIME ZONE 'MST') + ($3 || ' hours')::interval
          WHERE kid_id = $1 AND chore_id = $2`,
          [kid_id, chore_id, unlockTime]
        );
      
        if (chore_points) {
          await queryDB(
          `UPDATE Kids
          SET points = points + $1
          WHERE kid_id = $2`,
          [parseInt(chore_points), kid_id]
          );
        }

        const updatedChore = await queryDB(
          `SELECT is_locked, unlock_time 
          FROM Kids_Chores 
          WHERE kid_id = $1 AND chore_id = $2`, 
          [kid_id, chore_id]
        );
        
        res.json({ status: 'confirmed', unlock: updatedChore[0].unlock_time, time: updatedChore[0].unlock_time });
      } else {
        res.json({ status: 'not confirmed' });
      }
    } catch (error) {
      // Handle the error here
      res.json({ status: 'not confirmed' });
    }
  } else {
    res.status(500).json({ error: 'Discord channel not found' });
  }
});

const toBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'n'].includes(normalized)) {
      return false;
    }
  }

  return defaultValue;
};

const toPositiveInteger = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
};

// Parent dashboard management endpoints
app.get("/parent/children-with-chores", async (req, res) => {
  try {
    const kids = await queryDB(
      `SELECT kid_id, name, age, points
       FROM Kids
       ORDER BY name`
    );

    const chores = await queryDB(
      `SELECT
          KC.kids_chore_id,
          KC.kid_id,
          KC.chore_id,
          KC.is_locked,
          KC.unlock_time,
          C.chore_name,
          C.point_value
        FROM Kids_Chores AS KC
        INNER JOIN Chores AS C ON KC.chore_id = C.chore_id
        ORDER BY KC.kid_id, C.chore_name`
    );

    const data = kids.map((kid) => {
      const kidChores = chores
        .filter((chore) => chore.kid_id === kid.kid_id)
        .map((chore) => ({
          kidsChoreId: chore.kids_chore_id,
          choreId: chore.chore_id,
          name: chore.chore_name,
          pointValue: chore.point_value,
          isLocked: chore.is_locked,
          unlockTime: chore.unlock_time,
        }));

      return {
        id: kid.kid_id,
        name: kid.name,
        age: kid.age,
        points: kid.points,
        chores: kidChores,
      };
    });

    res.json(data);
  } catch (error) {
    console.error("Error fetching parent dashboard data:", error);
    res.status(500).json({ error: "Unable to fetch parent dashboard data" });
  }
});

app.post("/parent/kids/:kidId/chores", async (req, res) => {
  const { kidId } = req.params;
  const { name, pointValue, isLocked } = req.body;

  const trimmedName = typeof name === "string" ? name.trim() : "";
  const parsedPoints = toPositiveInteger(pointValue);
  const locked = toBoolean(isLocked, false);

  if (!trimmedName) {
    return res.status(400).json({ error: "Chore name is required" });
  }

  if (parsedPoints === null) {
    return res.status(400).json({ error: "Point value must be a non-negative integer" });
  }

  try {
    const kidExists = await queryDB(
      `SELECT kid_id FROM Kids WHERE kid_id = $1`,
      [kidId]
    );

    if (kidExists.length === 0) {
      return res.status(404).json({ error: "Kid not found" });
    }

    const newChore = await queryDB(
      `INSERT INTO Chores (chore_name, point_value)
       VALUES ($1, $2)
       RETURNING chore_id, chore_name, point_value`,
      [trimmedName, parsedPoints]
    );

    const choreId = newChore[0].chore_id;

    const assignment = await queryDB(
      `INSERT INTO Kids_Chores (kid_id, chore_id, is_locked)
       VALUES ($1, $2, $3)
       RETURNING kids_chore_id, kid_id, is_locked, unlock_time`,
      [kidId, choreId, locked]
    );

    const created = {
      kidsChoreId: assignment[0].kids_chore_id,
      choreId,
      name: newChore[0].chore_name,
      pointValue: newChore[0].point_value,
      isLocked: assignment[0].is_locked,
      unlockTime: assignment[0].unlock_time,
    };

    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating chore:", error);
    res.status(500).json({ error: "Unable to create chore" });
  }
});

app.put("/parent/kids/:kidId/chores/:kidsChoreId", async (req, res) => {
  const { kidId, kidsChoreId } = req.params;
  const { name, pointValue, isLocked } = req.body;

  const trimmedName = typeof name === "string" ? name.trim() : "";
  const parsedPoints = toPositiveInteger(pointValue);
  const locked = toBoolean(isLocked, false);

  if (!trimmedName) {
    return res.status(400).json({ error: "Chore name is required" });
  }

  if (parsedPoints === null) {
    return res.status(400).json({ error: "Point value must be a non-negative integer" });
  }

  try {
    const assignments = await queryDB(
      `SELECT kid_id, chore_id
       FROM Kids_Chores
       WHERE kids_chore_id = $1`,
      [kidsChoreId]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ error: "Chore assignment not found" });
    }

    const assignment = assignments[0];

    if (assignment.kid_id !== Number.parseInt(kidId, 10)) {
      return res.status(400).json({ error: "Chore does not belong to this kid" });
    }

    const updatedChore = await queryDB(
      `UPDATE Chores
       SET chore_name = $1,
           point_value = $2
       WHERE chore_id = $3
       RETURNING chore_id, chore_name, point_value`,
      [trimmedName, parsedPoints, assignment.chore_id]
    );

    await queryDB(
      `UPDATE Kids_Chores
       SET is_locked = $1,
           unlock_time = CASE WHEN $1 = false THEN NULL ELSE unlock_time END
       WHERE kids_chore_id = $2`,
      [locked, kidsChoreId]
    );

    const refreshedAssignment = await queryDB(
      `SELECT kids_chore_id, kid_id, is_locked, unlock_time
       FROM Kids_Chores
       WHERE kids_chore_id = $1`,
      [kidsChoreId]
    );

    const responsePayload = {
      kidsChoreId: refreshedAssignment[0].kids_chore_id,
      choreId: updatedChore[0].chore_id,
      name: updatedChore[0].chore_name,
      pointValue: updatedChore[0].point_value,
      isLocked: refreshedAssignment[0].is_locked,
      unlockTime: refreshedAssignment[0].unlock_time,
    };

    res.json(responsePayload);
  } catch (error) {
    console.error("Error updating chore:", error);
    res.status(500).json({ error: "Unable to update chore" });
  }
});

app.delete("/parent/kids/:kidId/chores/:kidsChoreId", async (req, res) => {
  const { kidId, kidsChoreId } = req.params;

  try {
    const assignments = await queryDB(
      `SELECT kid_id, chore_id
       FROM Kids_Chores
       WHERE kids_chore_id = $1`,
      [kidsChoreId]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ error: "Chore assignment not found" });
    }

    const assignment = assignments[0];

    if (assignment.kid_id !== Number.parseInt(kidId, 10)) {
      return res.status(400).json({ error: "Chore does not belong to this kid" });
    }

    await queryDB(
      `DELETE FROM Kids_Chores
       WHERE kids_chore_id = $1`,
      [kidsChoreId]
    );

    const remainingAssignments = await queryDB(
      `SELECT COUNT(*)
       FROM Kids_Chores
       WHERE chore_id = $1`,
      [assignment.chore_id]
    );

    const remainingCount = Number.parseInt(remainingAssignments[0].count, 10);

    if (remainingCount === 0) {
      await queryDB(
        `DELETE FROM Chores
         WHERE chore_id = $1`,
        [assignment.chore_id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting chore:", error);
    res.status(500).json({ error: "Unable to delete chore" });
  }
});

app.listen(port, () => {
    console.log(`server has started on port ${port}`);
})
