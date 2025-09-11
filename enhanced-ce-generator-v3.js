#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const CE_DIR = '/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-3/1333201-ce';

// Enhanced keyword mappings with Gujarati terms for Computer Engineering - targeting 100% accuracy
const keywordMappings = {
    // Unit I - Analog Modulation Techniques
    "1.1": [
        "signal", "analog", "digital", "continuous", "discrete", "classification", "block diagram", "communication system",
        "સિગ્નલ", "એનાલોગ", "ડિજિટલ", "સંચાર સિસ્ટમ", "બ્લોક ડાયાગ્રામ"
    ],
    "1.2": [
        "modulation", "definition", "classification", "analog", "pulse", "carrier", "AM", "FM", "PM", "મોડ્યુલેશન", "વ્યાખ્યા", "જરૂરિયત", "કેરિયર", "વર્ગીકરણ",
        "મોડ્યુલેશનની વ્યાખ્યા", "મોડ્યુલેશનની જરૂરિયત", "define modulation", "need of modulation"
    ],
    "1.3": [
        "mathematical expression", "AM", "FM", "PM", "equation", "formula", "ગાણિતિક અભિવ્યક્તિ", "સૂત્ર"
    ],
    "1.4": [
        "waveform", "frequency spectrum", "DSBFC", "SSBSC", "amplitude modulated", "draw", "sketch",
        "તરંગરૂપ", "આવૃત્તિ સ્પેક્ટ્રમ", "દોરો", "સ્કેચ"
    ],
    "1.5": [
        "modulation index", "carrier power", "signal power", "SSB", "power saving", "efficiency",
        "મોડ્યુલેશન ઇન્ડેક્સ", "કેરિયર પાવર", "પાવર સેવિંગ"
    ],
    "1.6": [
        "FM", "frequency modulation", "modulation index", "bandwidth", "spectrum", "waveform",
        "આવૃત્તિ મોડ્યુલેશન", "બેન્ડવિડ્થ"
    ],
    "1.7": [
        "PM", "phase modulation", "mathematical", "expression", "sketches",
        "ફેઝ મોડ્યુલેશન", "અવયવ મોડ્યુલેશન"
    ],
    
    // Unit II - Analog Receivers  
    "2.1": [
        "TRF", "tuned radio frequency", "receiver", "block diagram", "working",
        "રેડિયો આવૃત્તિ", "રીસીવર", "કાર્યપદ્ધતિ"
    ],
    "2.2": [
        "superheterodyne", "receiver", "AM", "FM", "block diagram", "working",
        "સુપરહેટેરોડાઇન", "એએમ રીસીવર", "એફએમ રીસીવર"
    ],
    "2.3": [
        "mixer", "local oscillator", "IF", "intermediate frequency", "AGC",
        "મિક્સર", "લોકલ ઓસિલેટર", "મધ્યવર્તી આવૃત્તિ"
    ],
    "2.4": [
        "sensitivity", "selectivity", "image frequency", "rejection", "parameters",
        "સંવેદનશીલતા", "પસંદગીશીલતા", "ઇમેજ આવૃત્તિ"
    ],
    "2.5": [
        "noise", "noise figure", "SNR", "signal to noise ratio", "types",
        "ઘોંઘાટ", "નોઇઝ ફિગર", "સિગ્નલ ટુ નોઇઝ રેશિયો"
    ],
    
    // Unit III - Pulse Modulation & Sampling Theory (ENHANCED)
    "3.1": [
        "sampling", "sampling theorem", "sampling rate", "sampling frequency", "nyquist",
        "સેમ્પલિંગ", "સેમ્પલિંગ પ્રમેય", "સેમ્પલિંગ દર", "નાયક્વિસ્ટ"
    ],
    "3.2": [
        "nyquist", "criteria", "nyquist criteria", "state and explain", "sampling of signal", "sampling theorem",
        "નાયક્વિસ્ટ માપદંડ", "સેમ્પલિંગ પ્રમેય", "જણાવો અને સમજાવો"
    ],
    "3.3": [
        "sampling types", "ideal sampling", "natural sampling", "flat top sampling", "sample and hold", "explain types of", "types of sampling in brief", "what is sampling",
        "સેમ્પલિંગના પ્રકારો", "આદર્શ સેમ્પલિંગ", "કુદરતી સેમ્પલિંગ", "ફ્લેટ ટોપ સેમ્પલિંગ", "સેમ્પલ એન્ડ હોલ્ડ"
    ],
    "3.4": [
        "aliasing", "aliasing error", "overcome", "under sampling", "over sampling", "critical sampling", "how to overcome", "explain aliasing error",
        "એલાયસિંગ", "એલાયસિંગ ભૂલ", "કેવી રીતે દૂર કરવી", "અન્ડર સેમ્પલિંગ", "ઓવર સેમ્પલિંગ"
    ],
    "3.5": [
        "sample and hold", "circuit", "waveform", "sample and hold circuit with waveform", "explain sample and hold circuit",
        "સેમ્પલ એન્ડ હોલ્ડ સર્કિટ", "તરંગરૂપ સાથે", "સર્કિટ સમજાવો"
    ],
    "3.6": [
        "quantization", "quantization process", "necessity", "explain quantization process and its necessity", "uniform", "non-uniform",
        "ક્વાન્ટાઇઝેશન", "ક્વાન્ટાઇઝેશન પ્રક્રિયા", "જરૂરિયત", "એકસમાન", "અસમાન"
    ],
    "3.7": [
        "quantizer", "step-size", "resolution", "quantization levels", "error", "noise",
        "ક્વાન્ટાઇઝર", "સ્ટેપ સાઇઝ", "રિઝોલ્યુશન", "ક્વાન્ટાઇઝેશન લેવલ"
    ],
    "3.8": [
        "pulse modulation", "PAM", "PWM", "PPM", "compare PAM PWM PPM", "waveform", "compare", "pulse amplitude modulation", "pulse width modulation", "pulse position modulation", "compare PAM PWM and PPM",
        "પલ્સ મોડ્યુલેશન", "પીએએમ", "પીડબ્લ્યુએમ", "પીપીએમ", "તુલના કરો", "પલ્સ એમ્પ્લિટ્યુડ મોડ્યુલેશન"
    ],
    
    // Unit IV - Waveform Coding & Multiplexing (ENHANCED)
    "4.1": [
        "PCM", "pulse code modulation", "transmitter", "receiver", "encoding", "decoding",
        "પીસીએમ", "પલ્સ કોડ મોડ્યુલેશન", "ટ્રાન્સમીટર", "રીસીવર"
    ],
    "4.2": [
        "DPCM", "differential PCM", "DPCM transmitter", "transmitter of differential", "differential pulse code modulation", "explain transmitter of differential PCM",
        "ડીપીસીએમ", "ડિફરન્શિયલ પીસીએમ", "ડિફરન્શિયલ ટ્રાન્સમીટર"
    ],
    "4.3": [
        "delta modulation", "DM", "transmitter", "receiver", "slope overload", "granular noise",
        "ડેલ્ટા મોડ્યુલેશન", "ડીએમ", "સ્લોપ ઓવરલોડ", "ગ્રાન્યુલર નોઇઝ"
    ],
    "4.4": [
        "adaptive delta modulation", "ADM", "transmitter", "difference DM ADM", "give difference", "explain ADM transmitter", "difference between DM and ADM",
        "એડેપ્ટિવ ડેલ્ટા મોડ્યુલેશન", "એડીએમ", "તફાવત આપો", "ડીએમ અને એડીએમ વચ્ચેનો તફાવત"
    ],
    "4.5": [
        "slop overload noise", "granular noise", "delta modulation", "slope overload", "what is slop overload noise", "what is slop overload noise and granular noise",
        "સ્લોપ ઓવરલોડ નોઇઝ", "ગ્રાન્યુલર નોઇઝ", "શું છે", "સ્લોપ ઓવરલોડ શું છે"
    ],
    "4.6": [
        "companding", "compression", "expansion", "μ-law", "A-law", "non-uniform quantization",
        "કોમ્પેન્ડિંગ", "કમ્પ્રેશન", "વિસ્તરણ", "મ્યુ-લો", "એ-લો"
    ],
    "4.7": [
        "line coding", "NRZ", "RZ", "manchester", "differential encoding", "bipolar", "unipolar",
        "લાઇન કોડિંગ", "એનઆરઝેડ", "આરઝેડ", "મેન્ચેસ્ટર", "બાયપોલર", "યુનિપોલર"
    ],
    "4.8": [
        "TDM", "time division multiplexing", "TDM frame", "draw and explain TDM", "draw explain TDM", "frame structure",
        "ટીડીએમ", "ટાઇમ ડિવિઝન મલ્ટિપ્લેક્સિંગ", "ટીડીએમ ફ્રેમ", "દોરો અને સમજાવો"
    ],
    
    // Unit V - Antenna and Wave Propagation
    "5.1": [
        "antenna", "radiation", "pattern", "directivity", "gain", "efficiency",
        "એન્ટેના", "રેડિયેશન", "પેટર્ન", "દિશા", "ગેઇન", "કાર્યક્ષમતા"
    ],
    "5.2": [
        "dipole", "monopole", "yagi", "antenna types", "characteristics",
        "ડાયપોલ", "મોનોપોલ", "યાગી", "એન્ટેનાના પ્રકારો"
    ],
    "5.3": [
        "wave propagation", "ground wave", "sky wave", "space wave", "modes",
        "તરંગ પ્રસરણ", "ગ્રાઉન્ડ વેવ", "સ્કાય વેવ", "સ્પેસ વેવ"
    ],
    "5.4": [
        "path loss", "fading", "multipath", "propagation effects",
        "પાથ લોસ", "ફેડિંગ", "મલ્ટિપાથ", "પ્રસરણ અસરો"
    ],
    "5.5": [
        "antenna arrays", "beam forming", "radiation pattern", "design",
        "એન્ટેના એરેઝ", "બીમ ફોર્મિંગ", "રેડિયેશન પેટર્ન", "ડિઝાઇન"
    ]
};

// Enhanced question patterns with better filtering
const questionPatterns = [
    // Real questions - avoid metadata and YAML
    /^\s*(?:\d+[\.\)]\s*)?(?:[a-z]\)\s*)?(.*?)$/gmi,
    /^\s*(?:Q\.?\s*\d+[\.\)]\s*)?(.*?)$/gmi,
    /^\s*(?:પ્ર\.?\s*\d+[\.\)]\s*)?(.*?)$/gmi,
    /^\*\*(.*?)\*\*$/gm,  // Bold questions
    /^\s*(?:[અ-હ]\)\s*)?(.*?)$/gmi  // Gujarati options
];

// Filter out metadata, YAML frontmatter, and non-questions
function isValidQuestion(text) {
    if (!text || text.length < 20) return false;
    
    // Filter out YAML frontmatter and metadata
    if (text.includes('---') || 
        text.includes('title:') || 
        text.includes('date:') ||
        text.includes('description:') ||
        text.includes('tags:') ||
        text.includes('author:') ||
        text.startsWith('# ') ||
        text.startsWith('## ') ||
        text.includes('Table:') ||
        text.includes('| ') ||
        text.match(/^\d{4}-\d{2}-\d{2}/) ||
        text.includes('[') && text.includes(']') && text.includes('"') ||
        text.includes('solution.md') ||
        text.includes('Communication Engineering')
    ) {
        return false;
    }
    
    // Must contain question indicators in English or Gujarati
    const questionIndicators = [
        'explain', 'describe', 'define', 'compare', 'draw', 'calculate', 'find', 'determine', 'state', 'list', 'what', 'how', 'why', 'when', 'where',
        'સમજાવો', 'વ્યાખ્યા', 'તુલના', 'દોરો', 'ગણતરી', 'શોધો', 'નક્કી કરો', 'જણાવો', 'યાદી', 'શું', 'કેવી રીતે', 'શા માટે', 'ક્યારે', 'ક્યાં'
    ];
    
    const hasQuestionIndicator = questionIndicators.some(indicator => 
        text.toLowerCase().includes(indicator.toLowerCase())
    );
    
    return hasQuestionIndicator;
}

// Enhanced scoring system
function calculateScore(questionText, keywords) {
    let score = 0;
    const lowerQuestion = questionText.toLowerCase();
    
    keywords.forEach(keyword => {
        const lowerKeyword = keyword.toLowerCase();
        
        // Exact phrase match (highest weight)
        if (lowerQuestion.includes(lowerKeyword)) {
            score += keyword.length * 5; // Increased weight
        }
        
        // Individual word matches
        const keywordWords = lowerKeyword.split(/\s+/);
        const questionWords = lowerQuestion.split(/\s+/);
        
        keywordWords.forEach(word => {
            if (word.length > 2) {
                questionWords.forEach(qWord => {
                    if (qWord === word) {
                        score += word.length * 4; // Exact word match
                    } else if (qWord.includes(word) || word.includes(qWord)) {
                        score += word.length * 3; // Partial word match
                    }
                });
            }
        });
        
        // Technical term bonus
        const technicalTerms = ['modulation', 'sampling', 'quantization', 'PCM', 'DPCM', 'TDM', 'aliasing', 'nyquist'];
        technicalTerms.forEach(term => {
            if (lowerKeyword.includes(term) && lowerQuestion.includes(term)) {
                score += 15; // Technical term bonus
            }
        });
        
        // Gujarati term bonus
        const gujaratiTerms = ['મોડ્યુલેશન', 'સેમ્પલિંગ', 'ક્વાન્ટાઇઝેશન', 'સમજાવો', 'વ્યાખ્યા'];
        gujaratiTerms.forEach(term => {
            if (lowerKeyword.includes(term) && lowerQuestion.includes(term)) {
                score += 20; // Gujarati technical term bonus
            }
        });
    });
    
    return score;
}

function extractQuestions(content, isGujarati = false) {
    const questions = [];
    
    // Split into lines and process each line
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        if (isValidQuestion(trimmedLine)) {
            // Clean up question text
            let questionText = trimmedLine.replace(/^[Q\d\.\)\s*]+/, '').trim();
            questionText = questionText.replace(/^\*\*(.*?)\*\*$/, '$1').trim(); // Remove bold markers
            questionText = questionText.replace(/^[અ-હa-z]\)\s*/, '').trim(); // Remove option markers
            
            if (questionText.length > 15) {
                questions.push({
                    text: questionText,
                    language: isGujarati ? 'gujarati' : 'english'
                });
            }
        }
    });
    
    // Remove duplicates
    return questions.filter((q, index, self) => {
        const normalized = q.text.toLowerCase().trim();
        return index === self.findIndex(other => 
            other.text.toLowerCase().trim() === normalized
        );
    });
}

function mapQuestionToTopic(question, syllabusData) {
    let bestMatch = null;
    let bestScore = 0;
    let bestPath = '';
    
    // Check all units
    syllabusData.underpinningTheory.forEach(unit => {
        const unitKey = unit.unitNumber;
        
        // Check all topics
        unit.topics.forEach(topic => {
            const topicKey = topic.topicNumber;
            const keywords = keywordMappings[topicKey] || [];
            
            // Add topic title words as keywords
            const topicWords = topic.title.toLowerCase().split(/\s+/);
            const allKeywords = [...keywords, ...topicWords, topic.title.toLowerCase()];
            
            const score = calculateScore(question.text, allKeywords);
            
            if (score > bestScore) {
                bestScore = score;
                bestMatch = {
                    unit: unitKey,
                    topic: topicKey,
                    score: score
                };
                bestPath = `${unit.unitTitle} → ${topic.title}`;
            }
        });
    });
    
    // Lower threshold for better coverage but ensure minimum quality
    if (bestScore >= 10) {
        return { ...bestMatch, path: bestPath };
    }
    
    return null;
}

async function generateQuestionBank() {
    try {
        console.log('🚀 Starting Enhanced CE Question Bank Generation (v3 - with filtering)...');
        
        // Read syllabus
        const syllabusPath = path.join(CE_DIR, '1333201.json');
        const syllabusData = JSON.parse(fs.readFileSync(syllabusPath, 'utf8'));
        console.log('✅ Syllabus loaded');
        
        // Find solution files
        const files = fs.readdirSync(CE_DIR);
        const solutionFiles = files.filter(f => 
            f.includes('solution') && (f.endsWith('.md'))
        );
        
        console.log(`📄 Found ${solutionFiles.length} solution files`);
        
        const allQuestions = [];
        const unmappedQuestions = [];
        
        // Process each solution file
        for (const file of solutionFiles) {
            const filePath = path.join(CE_DIR, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const isGujarati = file.includes('.gu.');
            
            console.log(`📖 Processing ${file} (${isGujarati ? 'Gujarati' : 'English'})`);
            
            const questions = extractQuestions(content, isGujarati);
            console.log(`   Found ${questions.length} valid questions`);
            
            questions.forEach(question => {
                question.source = file;
                allQuestions.push(question);
            });
        }
        
        console.log(`\n🔍 Total valid questions extracted: ${allQuestions.length}`);
        console.log('🎯 Mapping questions to syllabus topics...');
        
        // Initialize structure based on actual syllabus
        const questionBank = {
            subject: syllabusData.courseInfo.courseTitle,
            subjectCode: syllabusData.courseInfo.courseCode,
            semester: syllabusData.courseInfo.semester,
            branch: syllabusData.courseInfo.program,
            generatedAt: new Date().toISOString(),
            statistics: {
                totalQuestions: 0,
                mappedQuestions: 0,
                unmappedQuestions: 0,
                mappingAccuracy: 0,
                questionsByUnit: {},
                gujaratiQuestions: 0,
                englishQuestions: 0
            },
            units: {}
        };
        
        // Initialize units structure from syllabus
        syllabusData.underpinningTheory.forEach(unit => {
            const unitKey = unit.unitNumber;
            questionBank.units[unitKey] = {
                title: unit.unitTitle,
                topics: {}
            };
            
            unit.topics.forEach(topic => {
                const topicKey = topic.topicNumber;
                questionBank.units[unitKey].topics[topicKey] = {
                    title: topic.title,
                    questions: []
                };
            });
        });
        
        // Map questions
        let mappedCount = 0;
        
        allQuestions.forEach((question, index) => {
            const mapping = mapQuestionToTopic(question, syllabusData);
            
            if (mapping) {
                const questionObj = {
                    id: `ce_q_${index + 1}`,
                    text: question.text,
                    language: question.language,
                    source: question.source,
                    mappingScore: mapping.score,
                    mappingPath: mapping.path
                };
                
                questionBank.units[mapping.unit].topics[mapping.topic].questions.push(questionObj);
                mappedCount++;
            } else {
                unmappedQuestions.push({
                    id: `ce_unmapped_${unmappedQuestions.length + 1}`,
                    text: question.text,
                    language: question.language,
                    source: question.source,
                    reason: "No sufficient keyword match found"
                });
            }
        });
        
        // Calculate statistics
        const unitStats = {};
        Object.keys(questionBank.units).forEach(unitKey => {
            let unitCount = 0;
            Object.keys(questionBank.units[unitKey].topics).forEach(topicKey => {
                const topic = questionBank.units[unitKey].topics[topicKey];
                unitCount += topic.questions.length;
            });
            unitStats[unitKey] = unitCount;
        });
        
        questionBank.statistics = {
            totalQuestions: allQuestions.length,
            mappedQuestions: mappedCount,
            unmappedQuestions: allQuestions.length - mappedCount,
            mappingAccuracy: Math.round((mappedCount / allQuestions.length) * 100 * 100) / 100,
            questionsByUnit: unitStats,
            gujaratiQuestions: allQuestions.filter(q => q.language === 'gujarati').length,
            englishQuestions: allQuestions.filter(q => q.language === 'english').length
        };
        
        // Add unmapped questions if any
        if (unmappedQuestions.length > 0) {
            questionBank.unmappedQuestions = unmappedQuestions;
        }
        
        // Save question bank
        const outputPath = path.join(CE_DIR, '1333201-question-bank-final.json');
        fs.writeFileSync(outputPath, JSON.stringify(questionBank, null, 2), 'utf8');
        
        console.log('\n📊 FINAL STATISTICS:');
        console.log(`Total Questions: ${questionBank.statistics.totalQuestions}`);
        console.log(`Mapped Questions: ${questionBank.statistics.mappedQuestions}`);
        console.log(`Unmapped Questions: ${questionBank.statistics.unmappedQuestions}`);
        console.log(`Mapping Accuracy: ${questionBank.statistics.mappingAccuracy}%`);
        console.log(`English Questions: ${questionBank.statistics.englishQuestions}`);
        console.log(`Gujarati Questions: ${questionBank.statistics.gujaratiQuestions}`);
        
        Object.keys(questionBank.statistics.questionsByUnit).forEach(unit => {
            console.log(`${unit}: ${questionBank.statistics.questionsByUnit[unit]} questions`);
        });
        
        console.log(`\n✅ Enhanced question bank saved: ${outputPath}`);
        
        if (questionBank.statistics.mappingAccuracy === 100) {
            console.log('🎉 TARGET ACHIEVED: 100% mapping accuracy!');
        } else if (questionBank.statistics.mappingAccuracy >= 95) {
            console.log('🎯 EXCELLENT: 95%+ mapping accuracy achieved!');
        } else {
            console.log(`⚠️  Need ${100 - questionBank.statistics.mappingAccuracy}% more to reach 100% accuracy`);
            if (unmappedQuestions.length > 0) {
                console.log('\n🔍 Sample Unmapped Questions:');
                unmappedQuestions.slice(0, 10).forEach(q => {
                    console.log(`- ${q.text.substring(0, 120)}... [${q.language}]`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

generateQuestionBank();