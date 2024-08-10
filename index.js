import express from "express";
import axios from "axios";
import dotenv from "dotenv";

const app = express();
const port = 3000;
const API_URL = "https://api.pokemontcg.io";

dotenv.config();
const apiKey = process.env.API_KEY;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.listen(port, () => {
  console.log("we in this.");
});
