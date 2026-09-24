import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import cloudRouter from "./cloud-routes.js";
import supabaseAuthRouter from "./auth-routes.js";
import { createSessionMiddleware } from "./session-config.js";
import authExtraRouter from "./auth-extra-routes.js";

dotenv.config();

const app = express();

app.set("trust proxy", 1);
const PORT = Number(process.env.PORT) || 3000;
const USERS_FILE = "./data/users.json";

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, "[]");
}

function getUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.use(express.json({ limit: "25mb" }));

app.use(createSessionMiddleware());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "studyflow-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);


/*
  Supabase-backed StudyFlow accounts
*/
app.use("/api", supabaseAuthRouter);
app.use("/api", authExtraRouter);

app.use("/api/cloud", cloudRouter);

app.get("/api/health", (req, res) => {

  res.json({
    ok: true,
    app: "StudyFlow",
    time: new Date().toISOString()
  });

});



/* ========================================================
   STUDYFLOW PUBLIC ROUTES
======================================================== */

app.get("/", (req, res) => {

  res.sendFile(
    "landing.html",
    {
      root: "public"
    }
  );

});


app.get("/app", (req, res) => {

  res.sendFile(
    "index.html",
    {
      root: "public"
    }
  );

});


app.get("/privacy", (req, res) => {

  res.sendFile(
    "privacy.html",
    {
      root: "public"
    }
  );

});


app.get("/terms", (req, res) => {

  res.sendFile(
    "terms.html",
    {
      root: "public"
    }
  );

});



app.get("/forgot-password", (req, res) => {
  res.sendFile("forgot-password.html", {
    root: "public"
  });
});

app.get("/reset-password", (req, res) => {
  res.sendFile("reset-password.html", {
    root: "public"
  });
});

app.use(express.static("public"));

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Fill in all fields." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const users = getUsers();

  const exists = users.find(
    user => user.email.toLowerCase() === email.toLowerCase()
  );

  if (exists) {
    return res.status(400).json({ error: "Account already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    id: Date.now().toString(),
    name,
    email: email.toLowerCase(),
    passwordHash,
    university: "",
    major: ""
  };

  users.push(user);
  saveUsers(users);

  req.session.userId = user.id;

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      university: user.university,
      major: user.major
    }
  });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const users = getUsers();

  const user = users.find(
    u => u.email.toLowerCase() === String(email).toLowerCase()
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const correct = await bcrypt.compare(password, user.passwordHash);

  if (!correct) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  req.session.userId = user.id;

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      university: user.university,
      major: user.major
    }
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get("/api/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in." });
  }

  const users = getUsers();
  const user = users.find(u => u.id === req.session.userId);

  if (!user) {
    return res.status(401).json({ error: "User not found." });
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      university: user.university,
      major: user.major
    }
  });
});

app.put("/api/profile", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in." });
  }

  const { name, university, major } = req.body;

  const users = getUsers();
  const index = users.findIndex(u => u.id === req.session.userId);

  if (index === -1) {
    return res.status(404).json({ error: "User not found." });
  }

  users[index].name = name || users[index].name;
  users[index].university = university || "";
  users[index].major = major || "";

  saveUsers(users);

  res.json({
    user: {
      id: users[index].id,
      name: users[index].name,
      email: users[index].email,
      university: users[index].university,
      major: users[index].major
    }
  });
});

app.post("/api/ai", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Login required." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: "AI key is not connected yet."
    });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Enter a question." });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await client.responses.create({
      model: "gpt-5-mini",
      instructions:
        "You are StudyFlow AI Tutor. Help college students learn. Explain clearly, step by step, without unnecessarily completing graded work for them.",
      input: message
    });

    res.json({
      answer: response.output_text
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "AI request failed."
    });
  }
});


app.post("/api/syllabus-analyze", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Login required." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: "OPENAI_API_KEY is not connected yet."
    });
  }

  const { filename, fileData } = req.body;

  if (!filename || !fileData) {
    return res.status(400).json({
      error: "PDF file is required."
    });
  }

  if (!filename.toLowerCase().endsWith(".pdf")) {
    return res.status(400).json({
      error: "Please upload a PDF syllabus."
    });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      store: false,

      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
Analyze this college syllabus.

Extract:
- course name
- instructor
- assignments
- homework
- quizzes
- exams
- projects
- presentations
- important readings with explicit deadlines

IMPORTANT RULES:
- Never invent dates.
- If a date is not explicitly stated or cannot be confidently converted
  to YYYY-MM-DD, return an empty string for date.
- Do not treat ordinary class meeting dates as assignments.
- Use short useful titles.
- High priority should generally be major exams/projects/finals.
- Medium priority should generally be quizzes/assignments.
- Low priority may be readings or minor work.
`
            },
            {
              type: "input_file",
              filename,
              file_data: fileData
            }
          ]
        }
      ],

      text: {
        format: {
          type: "json_schema",
          name: "syllabus_analysis",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              courseName: {
                type: "string"
              },
              instructor: {
                type: "string"
              },
              events: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: {
                      type: "string"
                    },
                    date: {
                      type: "string"
                    },
                    type: {
                      type: "string",
                      enum: [
                        "Assignment",
                        "Homework",
                        "Quiz",
                        "Exam",
                        "Project",
                        "Presentation",
                        "Reading",
                        "Other"
                      ]
                    },
                    priority: {
                      type: "string",
                      enum: [
                        "Low",
                        "Medium",
                        "High"
                      ]
                    },
                    details: {
                      type: "string"
                    }
                  },
                  required: [
                    "title",
                    "date",
                    "type",
                    "priority",
                    "details"
                  ]
                }
              }
            },
            required: [
              "courseName",
              "instructor",
              "events"
            ]
          }
        }
      }
    });

    const parsed = JSON.parse(response.output_text);

    res.json(parsed);

  } catch (error) {
    console.error("Syllabus analysis error:", error);

    res.status(500).json({
      error:
        error?.message ||
        "Could not analyze this syllabus."
    });
  }
});



app.post("/api/document-ai", async (req, res) => {

  if (!req.session.userId) {
    return res.status(401).json({
      error: "Login required."
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: "OPENAI_API_KEY is not connected."
    });
  }

  const {
    filename,
    fileData,
    instruction
  } = req.body;

  if (!filename || !fileData) {
    return res.status(400).json({
      error: "PDF is required."
    });
  }

  try {

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await client.responses.create({

      model:
        process.env.OPENAI_MODEL ||
        "gpt-5-mini",

      store: false,

      input: [
        {
          role: "user",

          content: [

            {
              type: "input_text",

              text:
                instruction ||
                "Summarize this document for a college student."
            },

            {
              type: "input_file",
              filename,
              file_data: fileData
            }

          ]
        }
      ]

    });

    res.json({
      answer: response.output_text
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error:
        error?.message ||
        "Document analysis failed."
    });
  }

});




/* ========================================================
   404
======================================================== */

app.use((req, res, next) => {

  if(
    req.path.startsWith("/api/")
  ){

    return next();

  }


  res
  .status(404)
  .sendFile(
    "404.html",
    {
      root: "public"
    }
  );

});

app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("🎓 StudyFlow is running!");
  console.log(`➡️  http://localhost:${PORT}`);
  console.log("");
});