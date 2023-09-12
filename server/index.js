const express = require("express");
const app = express();
const cors = require("cors");
const queryDB = require("./database/db"); // azure db;
const { Client, Events, GatewayIntentBits } = require('discord.js');

const allowedOrigins = ['http://localhost:3000', 'https://unique-muffin-22a3b9.netlify.app'];

// CORS configuration
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
// Route to get all child id's and names'
app.get("/children", async (req, res) => {
    try {
        const children = await queryDB("SELECT kid_id AS id, name FROM Kids");
        res.json(children);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
 });

// Route to get all chores for a child
app.get("/chores/:id", async (req, res) => {
  try {
    // id could technically be named anything, but we're expecting an id
    // it will just pull out whatever param is in the url and assign it to the variable 'id' here
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
          WHERE K.kid_id = @param0`,
          [id]
      );
    // Query to get total points for the kid
    const kidInfo = await queryDB(
      `SELECT points
      FROM Kids
      WHERE kid_id = @param0`,
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

// Route to payout and reset points
app.put("/payout/:kid_id/:kid_name", async (req, res) => {
  console.log("PUT request received for /payout/:kid_id"); // Log when the route is hit
  const { kid_id, kid_name } = req.params;
  const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
  if (channel) {
    // console.log("Discord channel found"); // Log if the Discord channel is found
    const message = await channel.send(`${kid_name} wants to get paid. Did you do it? (yes/no)`);
    // Log the message sent to Discord
    // console.log(`Message sent to Discord: ${kid_name} wants to get paid. Did you do it? (yes/no)`);

    try {
      // Wait for a reply
      const filter = m => m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'no';
      const collected = await message.channel.awaitMessages({ filter, max: 1, time: process.env.MESSAGE_WAIT_TIME, errors: ['time'] });
      const reply = collected.first().content.toLowerCase();

      // Log the reply received
      // console.log(`Reply received: ${reply}`);

      if (reply === 'yes') {
        // Update the database
        const response = await queryDB(
          `UPDATE Kids
          SET points = 0
          WHERE kid_id = @param0`,
          [kid_id]
        );
        // console.log("Database updated"); // Log if the database is updated
        res.json({ status: 'confirmed' });
      } else {
        // console.log("Confirmation not received"); // Log if the confirmation is not received
        res.json({ status: 'not confirmed' });
      }
    } catch (error) {
      // Handle the error here
      // console.log("No valid reply received within the time limit.");
      res.json({ status: 'not confirmed' });
    }
  } else {
    // console.log("Discord channel not found"); // Log if the Discord channel is not found
    res.status(500).json({ error: 'Discord channel not found' });
  }
});

// Route to complete a chore
app.put("/chores/:kid_id/:chore_id/:chore_points", async (req, res) => {
  console.log("PUT request received for /chores/:kid_id/:chore_id"); // Log when the route is hit
  const { kid_id, chore_id, chore_points } = req.params;
  const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
  if (channel) {
    console.log("Discord channel found"); // Log if the Discord channel is found
    const kid = await queryDB(`SELECT name FROM Kids WHERE kid_id = @param0`, [kid_id]);
    const chore = await queryDB(`SELECT chore_name FROM Chores WHERE chore_id = @param0`, [chore_id]);
    const message = await channel.send(`${kid[0].name} completed "${chore[0].chore_name}". Confirm? (yes/no)`);
    
    // Log the message sent to Discord
    // console.log(`Message sent to Discord: ${kid[0].name} completed "${chore[0].chore_name}". Confirm? (yes/no)`);
    
    try {
      // Wait for a reply
      const filter = m => m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'no';
      const collected = await message.channel.awaitMessages({ filter, max: 1, time: process.env.MESSAGE_WAIT_TIME, errors: ['time'] });
      const reply = collected.first().content.toLowerCase();
  
      // Log the reply received
      // console.log(`Reply received: ${reply}`);

      if (reply === 'yes') {
        // Update the database
        const response = await queryDB(
          // CHANGE THIS IN PRODUCTION TO WHATEVER TIME YOU WANT //
          `UPDATE Kids_Chores
          SET is_locked = 1,
            unlock_time = DATEADD(SECOND, 20, GETDATE())
          WHERE kid_id = @param0 AND chore_id = @param1`,
          [kid_id, chore_id]
        );
        // console.log("Database updated"); // Log if the database is updated

        // Update the kid's total points in the Kids table
        if (chore_points && chore_points.length > 0) {
            await queryDB(
            `UPDATE Kids
            SET points = points + @param0
            WHERE kid_id = @param1`,
            [chore_points, kid_id]
            );
            // console.log("Kid's total points updated"); // Log if the kid's total points are updated
        }

        const updatedChore = await queryDB(`SELECT is_locked, unlock_time FROM Kids_Chores WHERE kid_id = @param0 AND chore_id = @param1`, [kid_id, chore_id]);
        res.json({ status: 'confirmed', unlock: updatedChore[0].unlock_time, time: updatedChore[0].unlock_time });
      } else {
        // console.log("Confirmation not received"); // Log if the confirmation is not received
        res.json({ status: 'not confirmed' });
      }
    } catch (error) {
      // Handle the error here
      // console.log("No valid reply received within the time limit.");
      res.json({ status: 'not confirmed' });
    }
  } else {
    // console.log("Discord channel not found"); // Log if the Discord channel is not found
    res.status(500).json({ error: 'Discord channel not found' });
  }
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log("server has started on port 5000");
})
