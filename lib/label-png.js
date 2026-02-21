const { createCanvas, registerFont } = require('canvas');
const path = require('path');

// Register Fonts
const regularFontPath = path.join(__dirname, '../assets/fonts/Prompt-Regular.ttf');
const boldFontPath = path.join(__dirname, '../assets/fonts/Prompt-Bold.ttf');
registerFont(regularFontPath, { family: 'Prompt' });
registerFont(boldFontPath, { family: 'Prompt', weight: 'bold' });

/**
 * Wraps text based on maximum width
 */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(''); // Thai doesn't use spaces, splitting by character is safer for basic wrap
  let lines = [];
  let currentLine = '';

  for (let n = 0; n < words.length; n++) {
    let testLine = currentLine + words[n];
    let metrics = ctx.measureText(testLine);
    let testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(currentLine);
      currentLine = words[n];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  return lines;
}

/**
 * Generates a shipping label Image (PNG)
 * @param {Object} data 
 * @returns {Promise<Buffer>}
 */
async function generateShippingLabelPNG(data) {
  const width = 800;
  const height = 550;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const marginLeft = 40;
  const marginTop = 40;
  let currentY = marginTop;

  // Header
  ctx.font = 'bold 20px Prompt';
  ctx.fillStyle = '#000000';
  ctx.fillText('ผู้ส่ง: แฟนเพจ มาดามต็อกกิกระตุ่ยติดตู่', marginLeft, currentY);

  currentY += 20;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(marginLeft, currentY);
  ctx.lineTo(width - marginLeft, currentY);
  ctx.stroke();

  currentY += 40;

  // Recipient Section
  ctx.font = 'bold 28px Prompt';
  ctx.textAlign = 'left';
  ctx.fillText('ผู้รับ', marginLeft, currentY);

  currentY += 40;

  const labelColor = '#666666';
  const infoColor = '#000000';
  const fontSize = '24px Prompt';
  const labelFontSize = '20px Prompt';

  const drawField = (label, value) => {
    ctx.font = labelFontSize;
    ctx.fillStyle = labelColor;
    const labelWidth = ctx.measureText(label).width;
    ctx.fillText(label, marginLeft, currentY);

    ctx.font = fontSize;
    ctx.fillStyle = infoColor;

    // Handle multi-line value if it's address
    if (label === 'ที่อยู่จัดส่ง: ') {
      const lines = wrapText(ctx, value || '', width - marginLeft - labelWidth - 40);
      lines.forEach((line, index) => {
        ctx.fillText(line, marginLeft + labelWidth, currentY + (index * 30));
      });
      currentY += Math.max(1, lines.length) * 30;
    } else {
      ctx.fillText(value || '', marginLeft + labelWidth, currentY);
      currentY += 35;
    }
  };

  drawField('ชื่อ: ', data.name);
  drawField('เบอร์โทร: ', data.mobile_number || data.mobile);
  drawField('ที่อยู่จัดส่ง: ', data.address_line);
  drawField('แขวง/ตำบล: ', data.subdistrict);
  drawField('เขต/อำเภอ: ', data.district);
  drawField('จังหวัด: ', data.province);
  drawField('รหัสไปรษณีย์: ', data.postal_code);

  // Footer Divider
  currentY = height - 80;
  ctx.strokeStyle = '#cccccc';
  ctx.beginPath();
  ctx.moveTo(marginLeft, currentY);
  ctx.lineTo(width - marginLeft, currentY);
  ctx.stroke();

  currentY += 30;

  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, '0')} ${(today.getMonth() + 1).toString().padStart(2, '0')} ${today.getFullYear()}`;

  ctx.font = '16px Prompt';
  ctx.fillStyle = '#333333';
  ctx.fillText(`วันที่: ${dateStr}`, marginLeft, currentY);

  ctx.textAlign = 'right';
  const items = (data.items || '').replace(/\n/g, ', ');
  ctx.fillText(`สินค้า: ${items}`, width - marginLeft, currentY);

  return canvas.toBuffer('image/png');
}

module.exports = { generateShippingLabelPNG };
