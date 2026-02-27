// extract-pdf.js
const fs = require('fs');
const pdf = require('pdf-parse');

async function extractEmployeeData() {
  try {
    console.log('PDF file reading started...');
    const dataBuffer = fs.readFileSync('directory.pdf');
    console.log('PDF file read successfully');
    
    const data = await pdf(dataBuffer);
    const text = data.text;
    const lines = text.split('\n');
    
    console.log(`Total lines in PDF: ${lines.length}`);
    
    const employees = [];
    let currentEmployee = {};
    
    // Better regex patterns
    const patterns = {
      name: /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:[A-Z][a-z]+)?$/,
      designation: /(Technical Assistant|Programmer|System Analyst|Director|Addl\. Director|Joint Director|Deputy Director|Assistant Director|Junior Engineer|Senior Engineer|Accountant|Clerk|Steno|Driver|Peon)/i,
      phone: /(\+?91-?)?[6-9]\d{9}|0\d{2,4}[-]?\d{6,8}/,
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
      department: /(DoIT&C|DOIT&C|Department of IT|Commissionerate|Directorate|Jaipur|Jodhpur|Kota|Udaipur|Bikaner|Ajmer)/i
    };
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.length < 3) continue;
      
      // Skip page numbers and headers
      if (trimmedLine.includes('Page') || trimmedLine.match(/^\d+$/)) continue;
      
      // Extract name - proper format
      if (trimmedLine.match(/^[A-Z][A-Z\s]+$/)) {
        if (currentEmployee.name) {
          if (currentEmployee.name && (currentEmployee.designation || currentEmployee.phone)) {
            employees.push(currentEmployee);
          }
          currentEmployee = {};
        }
        currentEmployee.name = trimmedLine;
      }
      
      // Extract designation
      if (trimmedLine.match(patterns.designation)) {
        currentEmployee.designation = trimmedLine;
      }
      
      // Extract phone
      const phoneMatch = trimmedLine.match(patterns.phone);
      if (phoneMatch) {
        currentEmployee.phone = phoneMatch[0];
      }
      
      // Extract email
      const emailMatch = trimmedLine.match(patterns.email);
      if (emailMatch) {
        currentEmployee.email = emailMatch[0].toLowerCase();
      }
      
      // Extract department/location
      if (trimmedLine.match(patterns.department) && !currentEmployee.department) {
        currentEmployee.department = trimmedLine;
      }
    }
    
    // Clean up and validate employees
    const validEmployees = employees.filter(emp => 
      emp.name && (emp.designation || emp.phone || emp.email)
    );
    
    console.log(`Total valid employees extracted: ${validEmployees.length}`);
    
    // Save to JSON file with proper formatting
    fs.writeFileSync(
      'src/employees.json', 
      JSON.stringify(validEmployees, null, 2)
    );
    
    console.log('✅ Data successfully saved to src/employees.json');
    console.log('Sample first 3 employees:', validEmployees.slice(0, 3));
    
  } catch (error) {
    console.error('Error extracting PDF:', error);
  }
}

extractEmployeeData();