import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { saveBase64Image, deleteLocalFile, getFileUrl } from "../lib/localStorage.js";

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }
        // hashed password logic would go here
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        const user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: "User already exists with this email" });
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
            
            const userResponse = {
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePicture: newUser.profilePicture ? getFileUrl(newUser.profilePicture, req) : null,
                createdAt: newUser.createdAt,
                updatedAt: newUser.updatedAt,
            };
            
            res.status(201).json(userResponse);
        } else {
            res.status(400).json({ message: "User creation failed" });
        }
    } catch (error) {
        console.log("signup error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User does not exist with this email" });
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Incorrect password" });
        }

        generateToken(user._id, res);
        res.status(200).json({
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            profilePicture: user.profilePicture ? getFileUrl(user.profilePicture, req) : null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }
    );

    } catch (error) {
        console.log("login error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
}

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", {
            maxAge: 0
        });
        res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        console.log("logout error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { profilePicture, fullName } = req.body;
        const userId = req.user._id;

        // Validate input
        if (!profilePicture && !fullName) {
            return res.status(400).json({ message: "Please provide either a profile picture or a name to update" });
        }

        // Get current user to check if they have an existing profile picture
        const currentUser = await User.findById(userId);
        
        let updateData = {};
        
        // Handle profile picture update
        if (profilePicture) {
            // Save new profile picture locally
            const uploadRes = await saveBase64Image(profilePicture, 'avatar');
            
            // Delete old profile picture if it exists
            if (currentUser.profilePicture && currentUser.profilePicture.startsWith('/uploads/')) {
                deleteLocalFile(currentUser.profilePicture);
            }
            
            updateData.profilePicture = uploadRes.url;
        }
        
        // Handle name update
        if (fullName) {
            if (fullName.trim().length < 2) {
                return res.status(400).json({ message: "Name must be at least 2 characters long" });
            }
            updateData.fullName = fullName.trim();
        }

        const updateUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

        // Add full URL to the response
        const userWithFullUrl = {
            ...updateUser.toObject(),
            profilePicture: updateUser.profilePicture ? getFileUrl(updateUser.profilePicture, req) : null
        };

        res.status(200).json(userWithFullUrl);
    } catch (error) {
        console.log("updateProfile error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
}

export const checkAuth = (req, res) => {
    try {
        const userWithFullUrl = {
            ...req.user.toObject(),
            profilePicture: req.user.profilePicture ? getFileUrl(req.user.profilePicture, req) : null
        };
        res.status(200).json(userWithFullUrl);
    } catch (error) {
        console.log("checkAuth error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
}