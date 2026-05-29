const express = require("express");
const router = express.Router();
const { hitungDosisObat } = require("../controllers/dosisController");
const { validateDosisInput } = require("../middleware/validator");
router.post("/hitung", validateDosisInput, hitungDosisObat);

module.exports = router;
