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


function cleanJSON(raw) {

  let text = String(raw || "").trim();

  text = text
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  try {

    return JSON.parse(text);

  } catch {}


  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");

  if (
    first === -1 ||
    last === -1 ||
    last <= first
  ) {

    throw new Error(
      "AI did not return valid structured data."
    );
  }

  return JSON.parse(
    text.slice(
      first,
      last + 1
    )
  );
}


function normalizePriority(value) {

  const v =
    String(value || "")
    .toLowerCase();

  if (v === "high") return "High";
  if (v === "low") return "Low";

  return "Medium";
}


function normalizeKind(value) {

  const v =
    String(value || "")
    .toLowerCase();

  if (
    [
      "task",
      "exam",
      "note",
      "announcement"
    ].includes(v)
  ) {

    return v;
  }

  return "note";
}


function normalizeDate(value) {

  const date =
    String(value || "")
    .trim();

  if (
    /^\d{4}-\d{2}-\d{2}$/
    .test(date)
  ) {

    return date;
  }

  return "";
}


function normalizeResult(parsed) {

  const sourceItems =
    Array.isArray(parsed?.items)
      ? parsed.items
      : [];

  const items =
    sourceItems
    .slice(0, 60)
    .map(item => ({

      kind:
        normalizeKind(
          item?.kind
        ),

      title:
        String(
          item?.title ||
          "Untitled"
        )
        .trim()
        .slice(0, 240),

      course:
        String(
          item?.course || ""
        )
        .trim()
        .slice(0, 180),

      date:
        normalizeDate(
          item?.date
        ),

      priority:
        normalizePriority(
          item?.priority
        ),

      details:
        String(
          item?.details || ""
        )
        .trim()
        .slice(0, 6000),

      topics:
        Array.isArray(
          item?.topics
        )
          ? item.topics
            .map(topic =>
              String(topic)
              .trim()
            )
            .filter(Boolean)
            .slice(0, 30)
          : [],

      confidence:
        Math.min(
          100,
          Math.max(
            0,
            Number(
              item?.confidence
            ) || 70
          )
        )

    }))
    .filter(item =>
      item.title
    );


  return {

    sourceType:
      String(
        parsed?.sourceType ||
        "unknown"
      )
      .slice(0, 60),

    summary:
      String(
        parsed?.summary ||
        ""
      )
      .trim()
      .slice(0, 5000),

    courseGuess:
      String(
        parsed?.courseGuess ||
        ""
      )
      .trim()
      .slice(0, 180),

    items

  };
}


function createPrompt({
  today,
  timezone,
  knownCourses,
  courseHint,
  sourceName
}) {

  return `
You are StudyFlow Inbox, an academic document extraction system.

Your job is to inspect student material and extract ACTIONABLE academic information.

TODAY:
${today || "unknown"}

USER TIMEZONE:
${timezone || "unknown"}

KNOWN COURSES:
${JSON.stringify(knownCourses || [])}

OPTIONAL COURSE HINT:
${courseHint || "none"}

SOURCE NAME:
${sourceName || "unknown"}

Detect whether the material contains:
- assignments / homework / projects / essays
- quizzes
- tests / midterms / final exams
- deadlines
- important professor announcements
- study notes or course information

Return ONLY one valid JSON object.
No markdown.
No explanation outside JSON.

Use this exact structure:

{
  "sourceType": "syllabus | assignment | announcement | screenshot | notes | mixed | unknown",
  "summary": "short useful summary",
  "courseGuess": "best matching course name or empty string",
  "items": [
    {
      "kind": "task | exam | note | announcement",
      "title": "clear title",
      "course": "course name or empty string",
      "date": "YYYY-MM-DD or empty string",
      "priority": "Low | Medium | High",
      "details": "important instructions or context",
      "topics": ["topic 1", "topic 2"],
      "confidence": 0
    }
  ]
}

IMPORTANT RULES:

1. Resolve relative dates like tomorrow, Friday, next Monday using TODAY.

2. If a year is omitted, infer the nearest reasonable upcoming date.

3. Do NOT invent a deadline when no deadline is shown.
Use an empty date.

4. Match course names to KNOWN COURSES when there is a reasonable match.

5. Syllabus:
Extract EACH clearly stated assignment, quiz, exam, midterm, project and final exam that has enough useful information.
Do not create hundreds of meaningless entries.

6. Exam:
Use kind "exam".

7. Homework, project, essay, quiz submission, reading assignment:
Use kind "task".

8. Important informational content with no action:
Use kind "note" or "announcement".

9. confidence should represent how confident you are that the extracted item is correct.

10. Keep titles concise and human-readable.

11. For exam topics, place them in "topics".

12. If there is nothing actionable, return items as [].
`;
}


router.post(
  "/inbox-analyze",
  async (req, res) => {

    if (!requireUser(req, res)) {
      return;
    }


    if (!process.env.OPENAI_API_KEY) {

      return res
      .status(503)
      .json({
        error:
          "OPENAI_API_KEY is not configured."
      });
    }


    const {
      mode,
      text,
      fileData,
      filename,
      mimeType,
      today,
      timezone,
      knownCourses,
      courseHint
    } = req.body || {};


    if (
      !["text","image","pdf"]
      .includes(mode)
    ) {

      return res
      .status(400)
      .json({
        error:
          "Unsupported Inbox input type."
      });
    }


    if (
      mode === "text" &&
      !String(text || "").trim()
    ) {

      return res
      .status(400)
      .json({
        error:
          "Paste some text first."
      });
    }


    if (
      (mode === "image" ||
       mode === "pdf") &&
      !fileData
    ) {

      return res
      .status(400)
      .json({
        error:
          "File data is missing."
      });
    }


    /*
      Safety limit for base64 request.
      About 12 MB raw file becomes ~16 MB base64.
    */

    if (
      typeof fileData === "string" &&
      fileData.length > 17_500_000
    ) {

      return res
      .status(413)
      .json({
        error:
          "File is too large. Keep it under about 12 MB."
      });
    }


    try {

      const client =
        new OpenAI({
          apiKey:
            process.env.OPENAI_API_KEY
        });


      const prompt =
        createPrompt({
          today,
          timezone,
          knownCourses:
            Array.isArray(knownCourses)
              ? knownCourses.slice(0,50)
              : [],
          courseHint,
          sourceName:
            filename ||
            "Pasted text"
        });


      const content = [

        {
          type:"input_text",
          text:prompt
        }

      ];


      if (mode === "text") {

        content.push({

          type:"input_text",

          text:
`STUDENT MATERIAL:

${String(text)
.slice(0,180000)}`

        });

      }


      if (mode === "image") {

        content.push({

          type:"input_image",

          image_url:
            fileData

        });

      }


      if (mode === "pdf") {

        content.push({

          type:"input_file",

          filename:
            filename ||
            "document.pdf",

          file_data:
            fileData

        });

      }


      const response =
        await client
        .responses
        .create({

          model:
            "gpt-5.6-luna",

          store:false,

          input:[
            {
              role:"user",
              content
            }
          ]

        });


      const parsed =
        cleanJSON(
          response.output_text
        );


      const normalized =
        normalizeResult(
          parsed
        );


      return res.json(
        normalized
      );


    } catch (error) {

      console.error(
        "StudyFlow Inbox error:",
        error
      );


      return res
      .status(500)
      .json({

        error:
          error?.message ||
          "StudyFlow could not analyze this material."

      });

    }

  }
);


export default router;
