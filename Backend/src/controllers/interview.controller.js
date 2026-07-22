const pdfParse = require("pdf-parse")
const { generateInterviewReport , generateResumePdf} = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")





/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText();
        const { selfDescription, jobDescription } = req.body;

        const rawAiOutput = await generateInterviewReport({
            resume: resumeContent.text,
            selfDescription,
            jobDescription
        });

        // 1. Ensure the AI output is parsed as a JS Object if it returned a JSON string
        let reportData = typeof rawAiOutput === 'string' ? JSON.parse(rawAiOutput) : rawAiOutput;

        // 2. Handle cases where the AI output might be nested under a key like `response` or `data`
        if (reportData.interviewReport) reportData = reportData.interviewReport;
        if (reportData.data) reportData = reportData.data;

        // 🔍 LOG TO CONSOLE TO CONFIRM STRUCTURE BEFORE SAVING
        // console.log("Parsed AI Data for DB:", reportData);

        // 3. Map string arrays to sub-document objects required by Mongoose Schema
        const technicalQuestions = (reportData.technicalQuestions || []).map(q => ({
            question: typeof q === 'string' ? q : q.question,
            intention: typeof q === 'object' && q.intention ? q.intention : "Assess core technical knowledge and past project work.",
            answer: typeof q === 'object' && q.answer ? q.answer : "Provide a clear, structured response drawing from hands-on experience."
        }));

        const behavioralQuestions = (reportData.behavioralQuestions || []).map(q => ({
            question: typeof q === 'string' ? q : q.question,
            intention: typeof q === 'object' && q.intention ? q.intention : "Evaluate communication, teamwork, and problem-solving.",
            answer: typeof q === 'object' && q.answer ? q.answer : "Structure your answer using the STAR methodology (Situation, Task, Action, Result)."
        }));

        const skillGaps = (reportData.skillGaps || []).map(g => ({
            skill: typeof g === 'string' ? g : g.skill,
            severity: typeof g === 'object' && g.severity ? g.severity : "medium"
        }));

        const preparationPlan = (reportData.preparationPlan || []).map((p, idx) => ({
            day: typeof p === 'object' && p.day ? p.day : idx + 1,
            focus: typeof p === 'object' && p.focus ? p.focus : `Phase ${idx + 1}`,
            tasks: typeof p === 'string' ? [p] : (Array.isArray(p.tasks) ? p.tasks : [p.tasks || p])
        }));

        // 4. Save clean objects to Mongoose
        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeContent.text,
            selfDescription,
            jobDescription,
            title: reportData.title || "Interview Preparation Report",
            matchScore: reportData.matchScore || 80,
            technicalQuestions,
            behavioralQuestions,
            skillGaps,
            preparationPlan
        });
        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        });

    } catch (error) {
        console.error("Error generating interview report:", error);
        res.status(500).json({
            message: "Failed to generate interview report",
            error: error.message
        });
    }
}


/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

module.exports = { generateInterViewReportController,
    getAllInterviewReportsController,
    getInterviewReportByIdController,
    generateResumePdfController
 }