require("dotenv").config();

const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");

const User = require("./models/User");

connectDB();

async function createMill() {

    try {

        try {

            await User.collection.dropIndex("email_1");

        }

        catch (error) {

            if (error.codeName !== "IndexNotFound" && error.code !== 27) {

                throw error;

            }

        }

        const existingMill = await User.findOne({

            role: "mill"

        });

        if (existingMill) {

            console.log("Mill account already exists.");

            process.exit();

        }

        const hashedPassword = await bcrypt.hash(

            "mill123",

            10

        );

        await User.create({

            name: "CaneFlow Sugar Mill",

            phone: "9999999999",

            password: hashedPassword,

            role: "mill"

        });

        console.log("Mill account created successfully.");

        process.exit();

    }

    catch (error) {

        console.log(error);

        process.exit();

    }

}

createMill();