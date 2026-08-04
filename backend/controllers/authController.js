const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Register User
exports.register = async (req, res) => {

    try {

        const {
            full_name,
            email,
            password,
            role_id
        } = req.body;

        User.findByEmail(email, async (err, results) => {

            if (err)
                return res.status(500).json(err);

            if (results.length > 0) {
                return res.status(400).json({
                    message: "Email already exists."
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            User.create({

                full_name,
                email,
                password_hash: hashedPassword,
                role_id

            }, (err) => {

                if (err)
                    return res.status(500).json(err);

                res.status(201).json({
                    message: "User registered successfully."
                });

            });

        });

    } catch (error) {

        res.status(500).json(error);

    }

};


// Login User
exports.login = (req, res) => {

    const { email, password } = req.body;

    User.findByEmail(email, async (err, results) => {

        if (err)
            return res.status(500).json(err);

        if (results.length === 0) {

            return res.status(401).json({
                message: "Invalid email or password."
            });

        }

        const user = results[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!validPassword) {

            return res.status(401).json({
                message: "Invalid email or password."
            });

        }

        const token = jwt.sign(

            {

                id: user.user_id,
                role_id: user.role_id

            },

            process.env.JWT_SECRET,

            {

                expiresIn: "1d"

            }

        );

        res.json({

            message: "Login successful.",

            token

        });

    });

};