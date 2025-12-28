// /src/lib/openai.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function extractTransactionsFromFile(fileContent, fileName, fileType, isJsonData = false) {
  try {
    console.log('OpenAI: Starting transaction extraction for:', fileName, 'Type:', fileType);

    // Common system prompt for transaction extraction
    const systemPrompt = `You are a financial data extraction expert. Analyze bank statement data and extract transactions.

Rules:
- Look for dates, amounts, descriptions in the text
- Handle debit/credit amounts correctly (debits = negative amounts for spending)
- Ignore headers, summaries, account balances, page numbers
- Extract ONLY actual transaction records
- Return ONLY a JSON array of transactions
- Format: [{"date": "YYYY-MM-DD", "amount": number, "description": "text"}]
- Ensure amounts are numbers (positive for income/credits, negative for spending/debits)
- Clean up descriptions (remove extra spaces, codes)
- Parse dates into YYYY-MM-DD format`;

    if (isJsonData) {
      // For CSV converted to JSON
      console.log('Processing CSV data...');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Extract transactions from this CSV data:\n\n${fileContent}`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      });

      return processOpenAIResponse(completion.choices[0].message.content);

    } else if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      // For PDF files - process the extracted text
      console.log('Processing PDF text content...');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: systemPrompt + `

Additional PDF-specific rules:
- PDF text may have formatting issues (split lines, extra spaces)
- Look for patterns like dates followed by descriptions and amounts
- Common formats: "MM/DD/YYYY Description $XX.XX" or "YYYY-MM-DD Description Amount"
- Ignore page headers, footers, account summaries
- Handle multi-line descriptions by combining related text`
          },
          {
            role: "user",
            content: `Extract transactions from this bank statement PDF text:\n\n${fileContent}`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      });

      return processOpenAIResponse(completion.choices[0].message.content);

    } else if (fileType === 'text/csv' || fileName.toLowerCase().endsWith('.csv')) {
      // For CSV files - process as text
      console.log('Processing CSV text content...');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: systemPrompt + `

Additional CSV-specific rules:
- First row is usually headers - identify date, amount, description columns
- Handle different CSV formats (comma, tab separated)
- Look for debit/credit columns or positive/negative amounts
- Skip empty rows and summary rows`
          },
          {
            role: "user",
            content: `Extract transactions from this CSV file:\n\n${fileContent}`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      });

      return processOpenAIResponse(completion.choices[0].message.content);

    } else if (fileType === 'text/plain' || fileName.toLowerCase().endsWith('.txt')) {
      // For TXT files
      console.log('Processing TXT content...');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Extract transactions from this text file:\n\n${fileContent}`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      });

      return processOpenAIResponse(completion.choices[0].message.content);

    } else {
      // For Excel and other file types
      console.log('Processing other file type content...');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Extract transactions from this financial data:\n\n${fileContent}`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      });

      return processOpenAIResponse(completion.choices[0].message.content);
    }

  } catch (error) {
    console.error('OpenAI extraction error:', error);
    return {
      success: false,
      error: error.message || 'Failed to extract transactions'
    };
  }
}

// Helper function to process OpenAI response
function processOpenAIResponse(responseText) {
  console.log('OpenAI Response:', responseText);

  // Extract JSON from response - look for JSON array
  const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
  if (jsonMatch) {
    try {
      const transactions = JSON.parse(jsonMatch[0]);
      
      // Validate and clean transaction format
      const validTransactions = transactions.filter(t => 
        t && t.date && t.amount !== undefined && t.description
      ).map(t => ({
        date: t.date,
        amount: parseFloat(t.amount),
        description: String(t.description).trim(),
        ...(t.category && { category: t.category })
      }));

      console.log(`Extracted ${validTransactions.length} valid transactions`);
      
      return {
        success: true,
        transactions: validTransactions
      };
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      throw new Error('Invalid JSON format in AI response');
    }
  } else {
    console.error('No JSON array found in response:', responseText);
    throw new Error('No JSON array found in AI response');
  }
}