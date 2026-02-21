const PDFDocument = require('pdfkit');
const path = require('path');

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

      const regularFont = path.join(__dirname, '../assets/fonts/Prompt-Regular.ttf');
      const boldFont = path.join(__dirname, '../assets/fonts/Prompt-Bold.ttf');

      // Header - Medium size
      doc.font(boldFont).fontSize(14).text('ผู้ส่ง: แฟนเพจ มาดามต็อกกิกระตุ่ยติดตู่', { align: 'left' });

      // Divider
      doc.moveDown(0.2);
      doc.lineWidth(1).moveTo(30, doc.y).lineTo(390, doc.y).stroke();
      doc.moveDown(0.5);

      // Recipient section - Large size
      doc.font(boldFont).fontSize(18).text('ผู้รับ', { align: 'center' });
      doc.moveDown(0.3);

      const contentFontSize = 14;
      doc.font(regularFont).fontSize(contentFontSize);

      // Recipient Details
      const mobile = data.mobile_number || data.mobile || '';
      doc.text(`ชื่อ: ${data.name || ''}`);
      doc.text(`เบอร์โทร: ${mobile}`);

      // Address with overflow protection
      const addressText = `ที่อยู่จัดส่ง: ${data.address_line || ''}`;
      doc.text(addressText, {
        width: 360,
        align: 'left'
      });

      doc.text(`แขวง/ตำบล: ${data.subdistrict || ''}`);
      doc.text(`เขต/อำเภอ: ${data.district || ''}`);
      doc.text(`จังหวัด: ${data.province || ''}`);
      doc.text(`รหัสไปรษณีย์: ${data.postal_code || ''}`);

      // Footer - Small/Normal size
      doc.moveDown(0.5);
      doc.lineWidth(0.5).moveTo(30, doc.y).lineTo(390, doc.y).stroke();
      doc.moveDown(0.3);

      const today = new Date();
      const day = today.getDate().toString().padStart(2, '0');
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear();
      const dateStr = `${day} ${month} ${year}`;

      doc.fontSize(10);
      doc.text(`วันที่: ${dateStr}`, { continued: true });
      doc.text(` | สินค้า: ${data.items || ''}`, { align: 'right' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateShippingLabel };
