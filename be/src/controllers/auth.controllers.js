import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        if (!fullName || !email || !password) {
            return res.status(400).send("Please fill all the fields");
        }
        // hashed password logic would go here
        if (password.length < 6) {
            return res.status(400).send("Password must be at least 6 characters long");
        }

        const user = await User.findOne({ email });

        if (user) {
            return res.status(400).send("User already exists with this email");
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
        })

        if (newUser) {
            // generate a token or session here if needed
            generateToken(newUser._id, res);
            await newUser.save();
            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePicture: newUser.profilePicture,
            });
        } else {
            res.status(400).send("User creation failed");
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server error");
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).send("Please fill all the fields");
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send("User does not exist with this email");
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if (!isPasswordCorrect) {
            return res.status(400).send("Incorrect password");
        }

        generateToken(user._id, res);
        res.status(200).json({
            _is: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePicture: user.profilePicture,
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server error");
    }
}

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", {
            maxAge: 0
        });
        res.status(200).send("User logged out successfully");
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server error");
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { profilePicture } = req.body;
        const userId = req.user._id;

        if (!profilePicture) {
            return res.status(400).send("Please provide a profile picture");
        }

        const uploadRes = await cloudinary.uploader.upload(profilePicture)
        const updateUser = await User.findByIdAndUpdate(userId, {
            profilePicture: uploadRes.secure_url,
        }, { new: true });

        res.status(200).json(updateUser);
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server error");
    }
}

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        log(error.message);
        res.status(500).send("Server error");
    }
}