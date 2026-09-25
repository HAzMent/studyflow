import express from "express";
import OpenAI from "openai";

const router = express.Router();

function requireUser(req, res) {
  if (!req.session?.userId) {
    res.status(401).json({
      error: "Login required."
    });
    return false;
  }

  return true;
}

function promptForAction(action, course, question) {
  const base = `
You are StudyFlow, an AI study assistant.

Course:
${course || "Unknown course"}

Analyze the attached college study material carefully.
Use only information supported by the material when discussing its contents.
`;

  const prompts = {
    summary: `
Create a useful summary.
Include:
- main topic
- most important ideas
- definitions
- formulas or rules if present
- what a student should remember for an exam
`,

    guide: `
Create a structured exam study guide.
Include:
- sections by topic
- key concepts
- definitions
- formulas
- common mistakes
- what to practice
`,

    concepts: `
Extract the most important concepts.
For each concept:
- concept name
- simple explanation
- why it matters
- one quick example when appropriate
`,

    flashcards: `
Create 15-20 high-quality flashcards.

Use this format exactly:

Q: question
A: answer

Q: question
A: answer
`,

    quiz: `
Create a 10-question college-level practice quiz.

Use:
- multiple choice questions
- 4 choices each
- then provide an Answer Key
- include a short explanation for each correct answer
`,

    ask: `
Answer this student's question using the attached material:

${question || "Explain the most important material."}
`
  };

  return base + (prompts[action] || prompts.summary);
}

router.post("/material-analyze", async (req, res) => {
  if (!requireUser(req, res)) return;

  const {
    filename,
    fileData,
    course,
    action,
    question
  } = req.body || {};

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: "OPENAI_API_KEY is not configured."
    });
  }

  if (!filename || !fileData) {
    return res.status(400).json({
      error: "File is missing."
    });
  }

  if (typeof fileData !== "string" || fileData.length > 23_000_000) {
    return res.status(413).json({
      error: "File is too large."
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
              text: promptForAction(
                action,
                course,
                question
              )
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

    return res.json({
      answer: response.output_text || ""
    });

  } catch (error) {
    console.error("Material AI error:", error);

    return res.status(500).json({
      error:
        error?.message ||
        "Could not analyze this file."
    });
  }
});

export default router;
