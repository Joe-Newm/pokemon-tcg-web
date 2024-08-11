import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";

const app = express();
const port = 3000;
const API_URL = "https://api.pokemontcg.io/v2/cards";

dotenv.config();
const apiKey = process.env.API_KEY;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  res.render("index.ejs", { images: [] });
});

app.post("/submit", async (req, res) => {
  const pokemonName = req.body.pokemonName;
  let cards = [];
  try {
    if (pokemonName) {
      const result = await axios.get(`${API_URL}?q=name:${pokemonName}*`, {
        headers: {
          "X-Api-Key": apiKey,
        },
      });

      const pokedata = result.data.data;

      // Log the prices to see their structure
      // pokedata.forEach(card => {
      //   console.log("TCGPlayer Prices:", card.tcgplayer.prices);
      //   console.log("Cardmarket Prices:", card.cardmarket.prices);
      // });

      cards = pokedata.map((card) => {
        // Access prices within tcgplayer and cardmarket
        const cardmarketPrices = card.cardmarket?.prices || {};

        return {
          image: card.images.small,
          name: card.name,
          number: card.number,
          rarity: card.rarity,
          hp: card.hp,
          set: card.set.name,
          artist: card.artist,
          // Adjust according to the actual structure of prices
          // market: tcgplayerPrices.normal ? tcgplayerPrices.normal.market : "N/A",
          cardmarketPrice: cardmarketPrices.averageSellPrice || "N/A",
        };
      });

      // console.log(cards); 
    }
    res.render("index.ejs", { cards });
  } catch (error) {
    console.error("Error fetching data from API:", error.message);
    res.status(500).send("Something went wrong!");
  }
});

// Route to fetch all Pokémon card names
// app.get('/fetch-card-names', async (req, res) => {
//   let allCardNames = [];
//   let page = 1;

//   try {
//     while (true) {
//       const response = await axios.get(`${API_URL}?page=${page}&pageSize=${250}`, {
//         headers: { 'X-Api-Key': apiKey }
//       });

//       const cardNames = response.data.data.map(card => card.name);
//       allCardNames = allCardNames.concat(cardNames);

//       // Break if the number of cards fetched is less than PAGE_SIZE (end of results)
//       if (response.data.data.length < 250) {
//         break;
//       }

//       page++;
//       await delay(1000); // Delay to handle rate limits
//     }

//     fs.writeFileSync('card-names.json', JSON.stringify(allCardNames, null, 2));
//     res.send('All card names fetched and saved.');
//   } catch (error) {
//     console.error('Error fetching card names:', error.message);
//     res.status(500).send('Something went wrong!');
//   }
// });

app.get('/card-names', (req, res) => {
  fs.readFile('card-names.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading card names file:', err);
      res.status(500).send('Error loading card names');
      return;
    }
    res.json(JSON.parse(data));
  });
});

// auto complete functionality for search bar
app.get('/autocomplete', async (req, res) => {
  const query = req.query.q;
  const maxSuggestions = 10;
  let suggestions = [];

  try {
    const response = await axios.get(`${API_URL}?q=name:${query}*`, {
      headers: { 'X-Api-Key': apiKey }
    });

    suggestions = response.data.data.map(card => card.name).slice(0, maxSuggestions);

    // Deduplicate suggestions
    const uniqueSuggestions = Array.from(new Set(suggestions));

    res.json(uniqueSuggestions);
  } catch (error) {
    console.error('Error fetching data from API:', error.message);
    res.status(500).send('Something went wrong!');
  }
});

app.listen(port, () => {
  console.log("we in this.");
});
