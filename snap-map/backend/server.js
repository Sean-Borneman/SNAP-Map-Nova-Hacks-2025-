import express from "express";
import cors from "cors";
import { exec } from "child_process";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// Proper route to run Python script
app.post("/run-script", (req, res) => {
    const { city } = req.body; // <-- Get city from request
    const scriptPath = path.join("Database", "Auto_Opportunity.py");

    console.log(`Running script for city: ${city}`);
    // Pass city as an argument to Python
    exec(`python "${scriptPath}" "${city}"`, (error, stdout, stderr) => {
        if (error) {
            console.error("Error running script:", error.message);
            return res.status(500).json({ error: error.message });
        }
        if (stderr) console.error("Script stderr:", stderr);

        console.log("Python stdout:", stdout);
        res.json({ output: stdout });
    });
});

app.listen(3002, () => console.log("Backend running on http://localhost:3002"));
