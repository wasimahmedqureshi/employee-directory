// preview-pdf.js
const fs = require('fs');
const pdf = require('pdf-parse');

async function previewPDF() {
  try {
    console.log('📂 Reading PDF file...');
    const dataBuffer = fs.readFileSync('directory.pdf');
    const data = await pdf(dataBuffer);
    const lines = data.text.split('\n');
    
    console.log('\n📄 First 100 lines of PDF:');
    console.log('===========================\n');
    
    for (let i = 0; i < 100; i++) {
      if (lines[i] && lines[i].trim()) {
        console.log(`${i + 1}: ${lines[i].trim()}`);
      }
    }
    
    console.log('\n📊 Total lines in PDF:', lines.length);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

previewPDF();