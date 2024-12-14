const express = require("express");
const app = express();
const cors = require("cors");
const queryDB = require("./database/db");
const { Client, Events, GatewayIntentBits } = require('discord.js');

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000'];

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

const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ]
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

// Initialize Discord bot
client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.login(process.env.BOT_TOKEN);

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

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`server has started on port ${port}`);
})
