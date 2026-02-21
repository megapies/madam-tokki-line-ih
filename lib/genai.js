const { GoogleGenerativeAI } = require("@google/generative-ai");

const extractShippingLabel = async (text) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: [
      {
        text: `You are a precision data extraction assistant specializing in Thai shipping information. Your task is to parse unstructured text and convert it into a structured JSON object.

### Fields to Extract:
- name: The recipient's full name.
- mobile_number: The phone number (normalize to digits only or standard 08x-xxx-xxxx format).
- address_line: Building number, street, village, or condo name.
- subdistrict: Subdistrict (ตำบล/แขวง).
- district: District (อำเภอ/เขต).
- province: Province (จังหวัด).
- postal_code: 5-digit postal code.
- items: string of shipping items

### Guidelines:
1. Logic: Thai addresses often omit keywords like "ตำบล" or "จังหวัด". Use your knowledge of Thai geography to identify these fields even if prefixes are missing.
2. Cleaning: Remove any non-related text (e.g., "ส่งที่นี่ครับ", "โอนเงินแล้ว").
3. Format: Always return ONLY a valid JSON object. Do not include conversational text or markdown code blocks unless requested.
4. Null Values: If a field is missing, return it as null.

### Output Format:
{
  "name": string,
  "mobile_number": string,
  "address_line": string,
  "subdistrict": string,
  "district": string,
  "province": string,
  "postal_code": string,
  "items": string
}`,
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        required: ["name", "mobile_number", "address_line", "subdistrict", "district", "province", "postal_code"],
        properties: {
          name: {
            type: 'string',
          },
          mobile_number: {
            type: 'string',
          },
          address_line: {
            type: 'string',
          },
          subdistrict: {
            type: 'string',
          },
          district: {
            type: 'string',
          },
          province: {
            type: 'string',
          },
          postal_code: {
            type: 'string',
          },
          items: {
            type: 'string',
          },
        },
      },
    },
  });

  const result = await model.generateContent(text);
  console.log('raw result', result);
  const responseText = result.response.text();

  return responseText;
}

module.exports = { extractShippingLabel };