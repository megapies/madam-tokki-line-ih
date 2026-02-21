require('dotenv').config();
const { extractShippingLabel } = require('./lib/genai');

const sampleTexts = [
  "นายสมชาย เข็มกลัด 081-234-5678 123/45 หมู่ 6 ซ.สุขุมวิท 21 แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ 10110 (ส่ง เสื้อยืด 2 ตัว)",
  "กิ๊ฟ 0998887766 ที่อยู่ 88/1 ม.9 ต.บางแก้ว อ.บางพลี จ.สมุทรปราการ 10540 สินค้าคือ กระเป๋าหนัง",
  "วรรณภา 0876543210 9/99 ถ.ลาดพร้าว ซอย 1 แยก 2 แขวงจอมพล เขตจตุจักร กทม 10900"
];

async function runTest() {
  console.log("🚀 Starting Local Test for extractShippingLabel...");

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    console.error("❌ Link Error: GEMINI_API_KEY is not set correctly in .env file.");
    process.exit(1);
  }

  for (let i = 0; i < sampleTexts.length; i++) {
    console.log(`\n--- Test Case ${i + 1} ---`);
    console.log(`Input: ${sampleTexts[i]}`);
    try {
      const result = await extractShippingLabel(sampleTexts[i]);
      console.log("Output (JSON):");
      console.log(JSON.stringify(JSON.parse(result), null, 2));
    } catch (error) {
      console.error(`❌ Error in Test Case ${i + 1}:`, error.message);
    }
  }
}

runTest();
