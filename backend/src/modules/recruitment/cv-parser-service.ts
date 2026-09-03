export interface ParsedCVResult {
    fullName: string;
    email: string;
    phone: string;
    location?: string;
    skills: string[];
    experienceYears?: number;
    experienceSummary?: string;
    education?: string;
    links: string[];
    rawText: string;
}

const KNOWN_SKILLS_DICTIONARY = [
    "JavaScript", "TypeScript", "React", "React Native", "Next.js", "Vue.js", "Angular", "Node.js",
    "Express.js", "NestJS", "Python", "Django", "FastAPI", "Flask", "Java", "Spring Boot", "Kotlin",
    "Swift", "Flutter", "Dart", "Go", "Golang", "C#", ".NET", "PHP", "Laravel", "Symfony",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Prisma", "TypeORM",
    "Docker", "Kubernetes", "AWS", "Google Cloud", "Azure", "CI/CD", "Git", "GitHub", "GitLab",
    "Linux", "Nginx", "Terraform", "GraphQL", "REST API", "Microservices", "WebSockets",
    "Figma", "UI/UX", "Adobe Photoshop", "Illustrator", "Product Design", "Design System",
    "1C Korxona", "Buxgalteriya", "Moliyaviy tahlil", "Audit", "Soliq hisobi", "IFRS",
    "HR Management", "Recruiting", "Talent Acquisition", "Onboarding", "Offboarding", "DISC",
    "OKR", "KPI", "Agile", "Scrum", "Kanban", "Project Management", "Jira", "Trello",
    "English (B1)", "English (B2)", "English (C1)", "English (Fluent)", "Russian", "Uzbek",
    "Sales", "B2B Sales", "Marketing", "SMM", "SEO", "Copywriting", "Targeting", "Data Analysis"
];

export class CVParserService {
    extractTextFromBuffer(buffer: Buffer, mimeType?: string): string {
        try {
            const rawStr = buffer.toString("utf-8");
            const cleanText = rawStr
                .replace(/[^\x20-\x7E\u0400-\u04FF\u0100-\u017F\n\r\t]/g, " ")
                .replace(/\s+/g, " ")
                .trim();
            return cleanText.length > 30 ? cleanText : rawStr.slice(0, 5000);
        } catch {
            return buffer.toString("utf-8");
        }
    }

    parseText(text: string): ParsedCVResult {
        const cleanText = text.replace(/\r\n/g, "\n");
        const lines = cleanText
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 0);

        const emailMatch = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const email = emailMatch ? emailMatch[0].toLowerCase() : "";

        const phoneMatch = cleanText.match(/(?:\+?998[\s.-]?)?\(?\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}|\+?\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}/);
        const phone = phoneMatch ? phoneMatch[0].replace(/\s+/g, " ").trim() : "";

        let fullName = "";
        for (let i = 0; i < Math.min(lines.length, 6); i++) {
            const line = lines[i];
            if (
                !line.includes("@") &&
                !line.match(/\d{4}/) &&
                !line.toLowerCase().includes("rezyume") &&
                !line.toLowerCase().includes("cv") &&
                !line.toLowerCase().includes("curriculum") &&
                line.split(" ").length >= 2 &&
                line.split(" ").length <= 4 &&
                line.length < 50
            ) {
                fullName = line;
                break;
            }
        }

        if (!fullName && lines.length > 0) {
            fullName = lines[0].slice(0, 40);
        }

        const lowerText = cleanText.toLowerCase();
        const extractedSkills: string[] = [];

        for (const skill of KNOWN_SKILLS_DICTIONARY) {
            const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
            const regex = new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, "i");
            if (regex.test(cleanText)) {
                extractedSkills.push(skill);
            }
        }

        let experienceYears: number | undefined = undefined;
        const expMatch = lowerText.match(/(\d+)\+?\s*(?:yil|years?|лет|года?)\s*(?:tajriba|experience|стаж|ish tajribasi)/i) ||
                         lowerText.match(/(?:tajriba|experience|стаж|ish tajribasi)[:\s]+(\d+)\+?\s*(?:yil|years?|лет)/i);
        if (expMatch) {
            experienceYears = parseInt(expMatch[1], 10);
        }

        let education = "";
        const eduKeywords = [
            "universitet", "institut", "university", "institute", "bakalavr", "magistr",
            "bachelor", "master", "akademik", "kollej", "college", "fakultet", "titu", "tatu", "inha", "wiut"
        ];
        for (const line of lines) {
            const lLower = line.toLowerCase();
            if (eduKeywords.some((k) => lLower.includes(k))) {
                education = line;
                break;
            }
        }

        let location = "";
        const locationKeywords = ["toshkent", "tashkent", "samarqand", "buxoro", "farg'ona", "namangan", "andijon", "urganch", "nukus", "navoiy", "uzbekistan", "o'zbekiston"];
        for (const loc of locationKeywords) {
            if (lowerText.includes(loc)) {
                location = loc.charAt(0).toUpperCase() + loc.slice(1);
                break;
            }
        }

        const links: string[] = [];
        const linkMatches = cleanText.match(/(?:https?:\/\/|t\.me\/|linkedin\.com\/in\/|github\.com\/)[^\s,]+/gi);
        if (linkMatches) {
            links.push(...Array.from(new Set(linkMatches)));
        }

        return {
            fullName: fullName.trim(),
            email,
            phone,
            location: location || undefined,
            skills: extractedSkills,
            experienceYears,
            education: education || undefined,
            links,
            rawText: cleanText.slice(0, 3000),
        };
    }
}

export const cvParserService = new CVParserService();
