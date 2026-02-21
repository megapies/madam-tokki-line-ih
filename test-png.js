const { generateShippingLabelPNG } = require('./lib/label-png');
const fs = require('fs');
const path = require('path');

async function test() {
  const data = {
    name: "สมชาย มีสุข",
    mobile_number: "081-234-5678",
    address_line: "123/45 หมู่บ้านสวยงาม ซอยสุขใจ ถนนมิตรภาพ",
    subdistrict: "บางนาใต้",
    district: "บางนา",
    province: "กรุงเทพมหานคร",
    postal_code: "10260",
    items: "ตุ๊กตากระต่าย 2 ตัว,\nพวงกุญแจ 1 อัน\nแมวขาว"
  };

  console.log("Generating PNG...");
  try {
    const buffer = await generateShippingLabelPNG(data);
    const outputPath = path.join(__dirname, 'test_label.png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`PNG generated successfully at: ${outputPath}`);
  } catch (error) {
    console.error("Error generating PNG:", error);
  }
}

test();
