const { GoogleGenAI } = require("@google/genai")
const OpenAI = require("openai");
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions:
     z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The interviewer's underlying intention behind asking this question"),
        answer: z.string().describe("How to answer this question: key points to cover, frameworks, or approach to take")
    }))
    .min(3, "Generate at least 3 technical questions") // 👈 CHANGED
    .describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    
    behavioralQuestions: 
    z.array(z.object({
        question: z.string().describe("The behavioral question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    }))
    .min(2, "Generate at least 2 behavioral questions") // 👈 CHANGED
    .describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    
    skillGaps: 
    z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    }))
    .min(1, "List at least 1 skill gap") // 👈 CHANGED
    .describe("List of skill gaps in the candidate's profile along with their severity"),

    preparationPlan: 
    z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string())
        .min(2, "Provide at least 2 tasks per day") // 👈 CHANGED
        .describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    }))
    .min(3, "Provide a plan for at least 3 days") // 👈 CHANGED 
    .describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    

    const prompt = `You are an expert AI Interviewer and AI career coach . 
                    Analyze the candidate's resume and job description to generate a structured interview preparation report.

                    CRITICAL INSTRUCTIONS:
                    - You MUST generate technical questions, behavioral questions, skill gaps, and a step-by-step preparation plan.
                    - Match the required JSON schema strictly.

                    Generate an interview preparation report with:
                    - technicalQuestions
                    - behavioralQuestions
                    - skillGaps
                    - preparationPlan

                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    return JSON.parse(response.text)


}



async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "10mm",
            right: "10mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

        const prompt = `You are an elite, human professional Resume Writer and ATS (Applicant Tracking System) Optimization Specialist.

        YOUR MISSION:
        Transform the candidate's existing resume into a targeted, high-impact, single-page professional resume specifically tailored for the target Job Description. You must REWRITE, ENHANCE, and RESTRUCTURE the content rather than simply copying and pasting it.

        INPUT DATA:
        - Existing Resume: ${resume}
        - Candidate's Self Description/Additional Notes: ${selfDescription || "None provided"}
        - Target Job Description: ${jobDescription}

        STRICT REWRITING & ATS OPTIMIZATION RULES:
        1. KEYWORD & SKILL ALIGNMENT:
        - Analyze the Job Description to extract essential technical skills, tools, methodologies, and keywords.
        - Seamlessly blend these keywords into the candidate's work experience and project bullet points where relevant, using active professional language.

        2. HUMANIZE & ENHANCE CONTENT (DO NOT COPY-PASTE):
        - Rewrite weak bullet points into high-impact, action-oriented statements using strong action verbs (e.g., "Engineered", "Architected", "Spearheaded", "Optimized", "Integrated").
        - Quantify achievements wherever possible (e.g., performance improvements, component scalability, metric increases).
        - Eliminate generic AI buzzwords (like "synergy", "spearheaded modern solutions", "hardworking individual") so it sounds written by an experienced professional.

        3. ONE-PAGE & COMPLIANCE CONSTRAINTS:
        - Ensure the content density fits strictly onto ONE single standard page (A4 / Letter size) when rendered to PDF via Puppeteer.
        - Keep bullet points concise (1 to 2 lines maximum per point).
        - Prioritize relevant projects and internship experience over outdated or filler information.

        4. ATS-FRIENDLY HTML DESIGN RULES:
        - Use standard semantic HTML structure (\`<header>\`, \`<section>\`, \`<h1>\` to \`<h3>\`, \`<ul>\`, \`<li>\`).
        - Styling: Use clean, modern inline CSS or a single embedded \`<style>\` tag inside the HTML string.
        - Fonts: Use universally available sans-serif fonts (e.g., Inter, Roboto, Arial, or Helvetica).
        - Colors: Keep colors professional (e.g., dark slate/off-black for main text \`#1e293b\`, subtle navy/deep blue \`#0f172a\` or \`#2563eb\` for section headers).
        - Layout: Single-column or clean two-column layout. Avoid complex multi-layered grids, absolute positioning, background images, or non-standard graphics that confuse ATS parsers or cause PDF page overflow.

        OUTPUT FORMAT REQUIREMENTS:
        You MUST respond with a single, raw JSON object containing exactly one top-level key named "html". Do NOT wrap the JSON inside markdown code blocks (like \`\`\`json) or include extra conversational text.

        Expected Output Format:
        {
        "html": "<!DOCTYPE html><html><head><style>...</style></head><body>...</body></html>"
        }`;
    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })


    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport ,generateResumePdf}