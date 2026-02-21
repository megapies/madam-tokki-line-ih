const PDFDocument = require('pdfkit');
const axios = require('axios');

// In-memory font cache
const fontCache = {};

async function getFont(url) {
  if (fontCache[url]) return fontCache[url];
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fontCache[url] = Buffer.from(response.data);
  return fontCache[url];
}

const REGULAR_FONT_URL = 'https://github.com/google/fonts/raw/main/ofl/prompt/Prompt-Regular.ttf';
const BOLD_FONT_URL = 'https://github.com/google/fonts/raw/main/ofl/prompt/Prompt-Bold.ttf';

/**
 * Generates a shipping label PDF (A6 Landscape)
 * @param {Object} data 
 * @param {string} data.name
 * @param {string} data.mobile_number
 * @param {string} data.address_line
 * @param {string} data.subdistrict
 * @param {string} data.district
 * @param {string} data.province
 * @param {string} data.postal_code
 * @param {string} data.items
 * @returns {Promise<Buffer>}
 */
async function generateShippingLabel(data) {
  // Pre-fetch fonts
  const [regularFont, boldFont] = await Promise.all([
    getFont(REGULAR_FONT_URL),
    getFont(BOLD_FONT_URL)
  ]);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A6',
        layout: 'landscape',
        margins: { top: 20, bottom: 20, left: 30, right: 30 }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header - Medium size
      doc.font(boldFont).fontSize(10).text('ผู้ส่ง: แฟนเพจ มาดามต็อกกิกระตุ่ยติดตู่', { align: 'left' });

      // Divider
      doc.moveDown(0.2);
      doc.lineWidth(1).moveTo(30, doc.y).lineTo(390, doc.y).stroke();
      doc.moveDown(0.5);

      // Recipient section - Large size
      doc.font(boldFont).fontSize(14).text('ผู้รับ', { align: 'left' });
      doc.moveDown(0.3);

      const contentFontSize = 12;
      doc.font(regularFont).fontSize(contentFontSize);

      // Recipient Details
      const labelColor = '#666666';
      const infoColor = '#000000';
      const mobile = data.mobile_number || data.mobile || '';

      doc.fillColor(labelColor).text('ชื่อ: ', { continued: true });
      doc.fillColor(infoColor).text(data.name || '', { width: 360, align: 'left' });

      doc.fillColor(labelColor).text('เบอร์โทร: ', { continued: true });
      doc.fillColor(infoColor).text(mobile);

      // Address with overflow protection
      doc.fillColor(labelColor).text('ที่อยู่จัดส่ง: ', { continued: true });
      doc.fillColor(infoColor).text(data.address_line || '', {
        width: 360,
        align: 'left'
      });

      doc.fillColor(labelColor).text('แขวง/ตำบล: ', { continued: true });
      doc.fillColor(infoColor).text(data.subdistrict || '');

      doc.fillColor(labelColor).text('เขต/อำเภอ: ', { continued: true });
      doc.fillColor(infoColor).text(data.district || '');

      doc.fillColor(labelColor).text('จังหวัด: ', { continued: true });
      doc.fillColor(infoColor).text(data.province || '');

      doc.fillColor(labelColor).text('รหัสไปรษณีย์: ', { continued: true });
      doc.fillColor(infoColor).text(data.postal_code || '');

      // Reset color and size for footer
      doc.fillColor(infoColor).fontSize(8);

      // Footer - Small/Normal size
      doc.moveDown(0.5);
      doc.lineWidth(0.5).moveTo(30, doc.y).lineTo(390, doc.y).stroke();
      doc.moveDown(0.3);

      const today = new Date();
      const day = today.getDate().toString().padStart(2, '0');
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear();
      const dateStr = `${day} ${month} ${year}`;

      doc.fontSize(8);
      doc.text(`วันที่: ${dateStr}`, { continued: true });
      doc.text(` | สินค้า: ${data.items || ''}`, { align: 'right' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateShippingLabel };
