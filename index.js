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
  let images = [];
  try {
    if (pokemonName) {
      const result = await axios.get(`${API_URL}?q=name:${pokemonName}`, {
        headers: {
          "X-Api-Key": apiKey,
        },
      });
      const pokedata = result.data.data;
      images = pokedata.map((card) => card.images.small);
      console.log(images);
    }
    res.render("index.ejs", { images });
  } catch (error) {
    console.error("Error fetching data from API:", error.message);
    res.status(500).send("Something went wrong!");
  }
});

app.listen(port, () => {
  console.log("we in this.");
});
