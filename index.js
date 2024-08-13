import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";

const app = express();
const port = 3000;
const API_URL = "https://api.pokemontcg.io/v2/cards";

dotenv.config();
const apiKey = process.env.API_KEY;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 20; // Number of cards per page
  let cards = [];
  let totalPages = page; // Default to current page

  try {
    // Fetch random cards from the API
    const result = await axios.get(
      `${API_URL}?page=${page}&pageSize=${pageSize}`, // Use page and pageSize for random results
      {
        headers: {
          "X-Api-Key": apiKey,
        },
      },
    );

    const pokedata = result.data.data;

    cards = pokedata.map((card) => {
      const cardmarketPrices = card.cardmarket?.prices || {};

      return {
        image: card.images.small,
        id: card.id,
        name: card.name,
        number: card.number,
        rarity: card.rarity,
        hp: card.hp,
        set: card.set.name,
        artist: card.artist,
        cardmarketPrice: cardmarketPrices.averageSellPrice || "N/A",
      };
    });

    // Calculate total pages based on totalCount
    const totalCount = result.data.totalCount;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Calculate range of pages to display
    const maxPageButtons = 5;
    let startPage = Math.max(1, page - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    // Adjust startPage if there aren't enough pages at the end
    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    // Render the page with random cards and pagination
    res.render("index.ejs", {
      cards,
      page,
      totalPages,
      startPage,
      endPage,
      pokemonName: '', // No specific Pokémon name on the homepage
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching random cards from API:", error.message);
    res.status(500).send("Something went wrong!");
  }
});

app.get("/card-info/:id", async (req, res) => {
  const cardId = req.params.id;

  try {
    const result = await axios.get(`${API_URL}/${cardId}`, {
      headers: {
        "X-Api-Key": apiKey,
      },
    });
    const card = result.data.data;
    res.render("card-info.ejs", {card});
  } catch (error) {
    console.error("Error fetching card data:", error.message);
    res.status(500).send("Something went wrong!")
  }
});

app.post("/submit", async (req, res) => {
  const pokemonName = req.body.pokemonName;
  const page = parseInt(req.body.page) || 1;
  const pageSize = 20; // Number of cards per page
  let cards = [];
  let totalPages = page; // Default to current page

  console.log("Pokemon Name:", pokemonName);
  console.log("Requested Page:", page);

  try {
    // Modify the API URL based on whether pokemonName is provided
    const apiUrl = pokemonName
      ? `${API_URL}?q=name:${pokemonName}*&page=${page}&pageSize=${pageSize}`
      : `${API_URL}?page=${page}&pageSize=${pageSize}`;
      
      const result = await axios.get(
        apiUrl,
        {
          headers: {
            "X-Api-Key": apiKey,
          },
        },
      );
      console.log("API Result:", result.data.totalCount);
      const pokedata = result.data.data;

      cards = pokedata.map((card) => {
        const cardmarketPrices = card.cardmarket?.prices || {};

        return {
          id: card.id,
          image: card.images.small,
          name: card.name,
          number: card.number,
          rarity: card.rarity,
          hp: card.hp,
          set: card.set.name,
          artist: card.artist,
          cardmarketPrice: cardmarketPrices.averageSellPrice || "N/A",
        };
      });

        // Calculate total pages based on totalCount
      const totalCount = result.data.totalCount; // Use the correct field
      const totalPages = Math.ceil(totalCount / pageSize);

      // Calculate range of pages to display
      const maxPageButtons = 5; 
      let startPage = Math.max(1, page - Math.floor(maxPageButtons / 2));
      let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

      // Adjust startPage if there aren't enough pages at the end
      if (endPage - startPage + 1 < maxPageButtons) {
        startPage = Math.max(1, endPage - maxPageButtons + 1);
      }

      // Pass pagination info to the frontend
      res.render("index.ejs", {
        cards,
        page,
        totalPages,
        startPage,
        endPage,
        pokemonName,
        totalCount,
      });
    
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

app.get("/card-names", (req, res) => {
  fs.readFile("card-names.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading card names file:", err);
      res.status(500).send("Error loading card names");
      return;
    }
    res.json(JSON.parse(data));
  });
});

// auto complete functionality for search bar
app.get("/autocomplete", async (req, res) => {
  const query = req.query.q;
  const maxSuggestions = 10;
  let suggestions = [];

  try {
    const response = await axios.get(`${API_URL}?q=name:${query}*`, {
      headers: { "X-Api-Key": apiKey },
    });

    suggestions = response.data.data
      .map((card) => card.name)
      .slice(0, maxSuggestions);

    // Deduplicate suggestions
    const uniqueSuggestions = Array.from(new Set(suggestions));

    res.json(uniqueSuggestions);
  } catch (error) {
    console.error("Error fetching data from API:", error.message);
    res.status(500).send("Something went wrong!");
  }
});

app.listen(port, () => {
  console.log("we in this.");
});
