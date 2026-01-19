// Azure OpenAI utility for generating podcast scripts
// @ts-ignore - using legacy build to avoid worker issues
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
// @ts-ignore
import PdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?worker';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerPort = new PdfjsWorker();

export interface AzureOpenAIConfig {
  endpoint: string;  // e.g., "https://your-resource.openai.azure.com"
  apiKey: string;
  deploymentName: string;  // e.g., "gpt-5"
}

export interface PodcastScriptRequest {
  url: string;
  speakers: string[];
  language?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Check if URL points to a PDF file
 */
function isPdfUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.pdf') || lowerUrl.includes('.pdf?');
}

/**
 * Extract text from a PDF ArrayBuffer
 */
async function extractPdfFromBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 20); // Limit to first 20 pages

    console.log('PDF has', pdf.numPages, 'pages, extracting up to', maxPages);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    // Clean up and limit content
    return fullText
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100000); // Allow up to 100k characters for PDFs
  } catch (error) {
    throw new Error(`Failed to extract PDF content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from HTML string
 */
function extractTextFromHtml(html: string): string {
  // Simple HTML to text extraction
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove script and style elements
  const scripts = doc.querySelectorAll('script, style, nav, header, footer, aside');
  scripts.forEach(el => el.remove());

  // Get text content
  const textContent = doc.body?.textContent || '';

  // Clean up whitespace
  return textContent
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100000); // Allow up to 100k characters
}

/**
 * Fetch content from a URL (handles both HTML and PDF)
 */
async function fetchUrlContent(url: string): Promise<string> {
  // First, do a HEAD request or fetch to check content-type
  let content: string;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const isPdf = isPdfUrl(url) || contentType.includes('application/pdf');

    console.log('=== URL FETCH INFO ===');
    console.log('URL:', url);
    console.log('Content-Type:', contentType);
    console.log('Is PDF:', isPdf);

    if (isPdf) {
      const arrayBuffer = await response.arrayBuffer();
      content = await extractPdfFromBuffer(arrayBuffer);
    } else {
      const html = await response.text();
      content = extractTextFromHtml(html);
    }
  } catch (error) {
    throw new Error(`Failed to fetch URL content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Log extracted content for debugging
  console.log('Content length:', content.length, 'characters');
  console.log('--- Content Preview (first 2000 chars) ---');
  console.log(content.substring(0, 2000));
  console.log('--- End Preview ---');
  if (content.length > 2000) {
    console.log('... [truncated, total', content.length, 'characters]');
  }
  console.log('=================================');

  return content;
}

/**
 * Generate a podcast script from URL content using Azure OpenAI
 */
export async function generatePodcastScript(
  config: AzureOpenAIConfig,
  request: PodcastScriptRequest
): Promise<string> {
  // First, fetch the URL content
  const urlContent = await fetchUrlContent(request.url);

  if (!urlContent || urlContent.length < 50) {
    throw new Error('Could not extract enough content from the URL');
  }

  const speakerList = request.speakers.join(', ');
  const language = request.language || 'English';
  const speaker1 = request.speakers[0] || 'speaker1';
  const speaker2 = request.speakers[1] || 'speaker2';

  // Determine backchanneling examples based on language
  const backchannelExamples = language === 'Chinese'
    ? '"嗯", "对", "哦", "是的", "没错", "对对", "嗯嗯"'
    : language === 'Japanese'
    ? '"うん", "そうですね", "なるほど", "ええ", "確かに"'
    : language === 'Korean'
    ? '"네", "그렇죠", "아", "맞아요", "음"'
    : '"yeah", "right", "oh", "mm-hmm", "I see", "exactly", "uh-huh"';

  const systemPrompt = `You are a podcast script writer. Your task is to create an engaging, natural-sounding podcast dialogue script based on the provided content.

Rules:
1. Write in ${language}
2. Use exactly these speaker names: ${speakerList}
3. Format each line as "speakername: dialog text" (lowercase speaker name, colon, then the text)

Script style guidelines:
- Start with a friendly greeting and introduction to the topic
- Break down the content into conversational exchanges
- ${speaker1} (first speaker) typically leads, asks questions, and drives the conversation
- ${speaker2} (second speaker) provides answers, explanations, and insights
- **Use backchanneling as separate lines** to show active listening and engagement:
  - Use expressions like: ${backchannelExamples}
  - Insert these as **separate lines** by the listener during longer explanations
  - Example format:
    ${speaker1}: So the framework has three main components...
    ${speaker2}: 嗯
    ${speaker1}: First, they use something called LoRA...
    ${speaker2}: 对对
- Add 3-5 backchanneling turns throughout the conversation to create natural interaction
- End with key takeaways and a friendly goodbye
- Make it sound natural and engaging, like a real podcast conversation
- Keep the script between 15-30 lines total
- Do not include any stage directions, actions, or parenthetical notes - only dialog text`;

  const userPrompt = `Create a podcast script discussing the following content:

${urlContent}

Remember:
- Use speakers: ${speakerList}
- Format: speakername: dialog text
- Include 3-5 backchanneling responses (short acknowledgments like ${backchannelExamples}) as separate lines
- Make it conversational and engaging`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  // Call Azure OpenAI API
  const apiUrl = `${config.endpoint}/openai/deployments/${config.deploymentName}/chat/completions?api-version=2024-02-15-preview`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': config.apiKey,
    },
    body: JSON.stringify({
      messages,
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const generatedScript = data.choices?.[0]?.message?.content;

  if (!generatedScript) {
    throw new Error('No script generated from Azure OpenAI');
  }

  return generatedScript.trim();
}
