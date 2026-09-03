require("dotenv").config();
const jwt = require("jsonwebtoken");
console.log(jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: "1h" }));