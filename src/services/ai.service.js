import model from "../lib/gemini.js";

// ============================================
// ROADMAP PROMPT
// ============================================
const buildRoadmapPrompt = (itRole) => `
You are an expert IT career mentor and curriculum designer.

Your task is to generate a beginner-friendly learning roadmap for the IT role: ${itRole}.

The roadmap should be designed like a game progression system, where learners complete quests and defeat a boss challenge after each quest. Each boss has exactly 3 questions.

Return the result STRICTLY in JSON format using the structure below. No extra text, only JSON.

{
  "pathName": "${itRole}",
  "title": "string - creative roadmap title",
  "expectedDuration": "string - e.g. 1-2 months",
  "estimatedWeeks": number,
  "stages": [
    {
      "stageNumber": number,
      "title": "string",
      "description": "string",
      "startWeek": number,
      "endWeek": number,
      "quests": [
        {
          "questNumber": number,
          "title": "string",
          "week": number,
          "duration": "string - e.g. Week 1-2",
          "goal": "string - learning goal",
          "keyTopics": ["string"],
          "resourceDescription": "string",
          "courseLink": "string - real free course URL",
          "videoSeriesLink": "string - real YouTube URL",
          "documentationLink": "string - real docs URL",
          "xpReward": number,
          "badgeReward": "string - badge name",
          "boss": {
            "name": "string - creative boss name",
            "goal": "string",
            "challenge": "string - what the student must build or do",
            "hp": number,
            "damage": number,
            "difficulty": "Easy | Medium | Hard",
            "xpReward": number,
            "loot": "string - badge or reward name",
            "questions": [
              {
                "question": "string - describe what is broken and what to fix",
                "type": "MULTIPLE_CHOICE | CODING",
                "choices": ["string - only for MULTIPLE_CHOICE, empty array for CODING"],
                "answer": ["string - for MULTIPLE_CHOICE: correct choice. For CODING: the correct/fixed code solution"],
                "starterCode": "string - ONLY for CODING: broken or incomplete code the student must fix. null for MULTIPLE_CHOICE",
                "codeLanguage": "string - ONLY for CODING: e.g. javascript, python, html. null for MULTIPLE_CHOICE",
                "testCases": [
                  {
                    "description": "string - what this test checks",
                    "expectedBehavior": "string - what the fixed code should do"
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  ]
}

Rules:
- Generate exactly 3 stages with 1-2 quests each
- Each boss must have exactly 3 questions
- Mix question types: at least 1 CODING and 1 MULTIPLE_CHOICE per boss
- For CODING questions: starterCode must have intentional bugs or missing parts (e.g. wrong logic, syntax error, missing return, incomplete function)
- For CODING questions: testCases should describe 2-3 behaviors the fixed code must satisfy
- For MULTIPLE_CHOICE questions: starterCode and testCases must be null
- Use real, working URLs for resources (freeCodeCamp, MDN, YouTube, etc.)
- XP rewards should increase with difficulty (100, 200, 300, 500...)
- Boss HP should increase with difficulty (500, 800, 1200, 1500...)
- Make it beginner-friendly and fun
`;

// ============================================
// SCHEDULE PROMPT
// ============================================
const buildSchedulePrompt = (scheduleText) => `
You are an expert academic scheduler and study planner.

A student has provided their class schedule. Parse it and identify:
1. CLASS blocks - when they have classes
2. GAP_WINDOW blocks - free time that is good for studying (golden hours)
3. DEAD_ZONE blocks - late nights or early mornings when studying is not ideal
4. BREAK blocks - lunch/short breaks

Return the result STRICTLY in JSON format. No extra text, only JSON.

Student Schedule:
"""
${scheduleText}
"""

Return this structure:
{
  "semesterName": "string - inferred semester name if available",
  "parsedBlocks": [
    {
      "dayOfWeek": number (1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday),
      "startTime": "HH:MM in 24hr format",
      "endTime": "HH:MM in 24hr format",
      "subject": "string or null",
      "type": "CLASS | GAP_WINDOW | DEAD_ZONE | BREAK",
      "description": "string - short description"
    }
  ],
  "studySummary": {
    "totalClassHours": number,
    "totalGapWindows": number,
    "bestStudyDays": ["string - day names"],
    "recommendation": "string - AI recommendation for scheduling quests"
  }
}

Rules:
- 22:00 to 06:00 = DEAD_ZONE
- Free gaps between classes of 1.5hrs+ = GAP_WINDOW
- Lunch break 12:00-13:00 = BREAK
- Be precise with times
- If a day has no classes, mark it as a GAP_WINDOW for the whole day (8am-10pm)
`;

// ============================================
// BOSS FIGHT PROMPT
// ============================================
const buildBossFightPrompt = (
  boss,
  questions,
  userAnswer,
  questTitle,
  academicLevel,
) => `
You are an expert IT mentor evaluating a student's boss fight attempt.

Student Info:
- Academic Level: ${academicLevel || "College Student"}
- Current Quest: ${questTitle}
- Boss: ${boss.name}
- Boss Challenge: ${boss.challenge}

The student answered the following questions:

${questions
  .map((q, i) => {
    const answer = userAnswer[i];
    if (q.type === "CODING") {
      return `
Question ${i + 1}: ${q.question}
Type: CODING
Language: ${q.codeLanguage || "javascript"}
Broken Starter Code (what the student was given):
\`\`\`
${q.starterCode || "No starter code provided"}
\`\`\`
Expected Fix / Correct Solution:
\`\`\`
${q.answer.join("\n")}
\`\`\`
Test Cases:
${(q.testCases || []).map((tc) => `- ${tc.description}: ${tc.expectedBehavior}`).join("\n") || "No test cases"}
Student's Submitted Code:
\`\`\`
${answer || "No answer provided"}
\`\`\`
`;
    } else {
      return `
Question ${i + 1}: ${q.question}
Type: MULTIPLE_CHOICE
Choices: ${q.choices.join(", ")}
Correct Answer: ${q.answer.join(", ")}
Student's Answer: ${answer || "No answer provided"}
`;
    }
  })
  .join("\n")}

Evaluate the student's performance and return STRICTLY in JSON format. No extra text, only JSON.

{
  "passed": true or false,
  "score": number (0-100),
  "xpEarned": number (based on score percentage of ${boss.xpReward} XP),
  "hpDealt": number (damage dealt to boss based on score, max ${boss.hp}),
  "feedback": "string - encouraging feedback mentioning their performance",
  "questionResults": [
    {
      "questionIndex": number,
      "isCorrect": true or false,
      "explanation": "string - for CODING: explain what was wrong in the broken code and whether the student fixed it correctly. For MULTIPLE_CHOICE: explain why the answer is right or wrong."
    }
  ],
  "bossStatus": "DEFEATED | SURVIVED",
  "motivationalMessage": "string - short game-like message e.g. 'The Skeleton King has fallen!'"
}

Rules:
- passed = true if score >= 70
- xpEarned = Math.floor((score/100) * ${boss.xpReward})
- hpDealt = Math.floor((score/100) * ${boss.hp})
- bossStatus = DEFEATED if passed, SURVIVED if not
- For CODING questions: evaluate whether the student's code logically fixes the bugs/missing parts in the starter code and satisfies the test cases. Do NOT require exact character match — judge intent and correctness.
- For MULTIPLE_CHOICE: exact match required
- Be encouraging even if they fail
- Use game-like language
`;

// ============================================
// SERVICE FUNCTIONS
// ============================================

export const generateRoadmap = async (itRole) => {
  try {
    const prompt = buildRoadmapPrompt(itRole);
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const roadmapData = JSON.parse(response);
    return roadmapData;
  } catch (error) {
    throw new Error(`Failed to generate roadmap: ${error.message}`);
  }
};

export const parseSchedule = async (scheduleText) => {
  try {
    const prompt = buildSchedulePrompt(scheduleText);
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const scheduleData = JSON.parse(response);
    return scheduleData;
  } catch (error) {
    throw new Error(`Failed to parse schedule: ${error.message}`);
  }
};

export const evaluateBossFight = async (
  boss,
  questions,
  userAnswers,
  questTitle,
  academicLevel,
) => {
  try {
    const prompt = buildBossFightPrompt(
      boss,
      questions,
      userAnswers,
      questTitle,
      academicLevel,
    );
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const evaluation = JSON.parse(response);
    return evaluation;
  } catch (error) {
    throw new Error(`Failed to evaluate boss fight: ${error.message}`);
  }
};
