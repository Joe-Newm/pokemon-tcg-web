import express from "express";
import axios from "axios";
import dotenv from "dotenv";

const app = express();
const port = 3000;
const API_URL = "https://api.pokemontcg.io/v2/cards";

dotenv.config();
const apiKey = process.env.API_KEY;

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
      const result = await axios.get(`${API_URL}?q=name:${pokemonName}`, {
        headers: {
          "X-Api-Key": apiKey,
        },
      });
      const pokedata = result.data.data;
      cards = pokedata.map((card) => ({
        image: card.images.small,
        name: card.name,
        number: card.number,
        rarity: card.rarity,
        hp: card.hp,
        //type: card.types.join(", "), // Joining in case of multiple types
        set: card.set.name,
        artist: card.artist,
      }));
      console.log(cards);
    }
    res.render("index.ejs", { cards });
  } catch (error) {
    console.error("Error fetching data from API:", error.message);
    res.status(500).send("Something went wrong!");
  }
});

app.listen(port, () => {
  console.log("we in this.");
});
