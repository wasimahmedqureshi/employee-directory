// extract-pdf.js
const fs = require('fs');
const pdf = require('pdf-parse');

async function extractEmployeeData() {
  try {
    console.log('📂 Reading PDF file...');
    
    if (!fs.existsSync('directory.pdf')) {
      console.error('❌ directory.pdf not found!');
      return;
    }
    
    const dataBuffer = fs.readFileSync('directory.pdf');
    const data = await pdf(dataBuffer);
    const lines = data.text.split('\n');
    
    console.log(`📄 Total lines: ${lines.length}`);
    
    const employees = [];
    let currentEmployee = {};
    
    // Rajasthan districts list
    const districts = [
      'Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Bharatpur', 'Bhilwara',
      'Bikaner', 'Bundi', 'Chittorgarh', 'Churu', 'Dausa', 'Dholpur', 'Dungarpur',
      'Hanumangarh', 'Jaipur', 'Jaisalmer', 'Jalore', 'Jhalawar', 'Jhunjhunu',
      'Jodhpur', 'Karauli', 'Kota', 'Nagaur', 'Pali', 'Pratapgarh', 'Rajsamand',
      'Sawai Madhopur', 'Sikar', 'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur'
    ];
    
    const patterns = {
      name: /^[A-Z][A-Z\s]+$/,
      designation: /(Technical Assistant|Programmer|System Analyst|Director|Addl\. Director|Joint Director|Deputy Director|Assistant Director|Junior Engineer|Senior Engineer|Accountant|Clerk|Steno|Driver|Peon|Section Officer|Office Superintendent|Data Entry Operator|IT Officer|Network Administrator|Database Administrator)/i,
      phone: /(\+?91-?)?[6-9]\d{9}|0\d{2,4}[-]?\d{6,8}/,
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
      department: /(DoIT&C|DOIT&C|Department of IT|Commissionerate|Directorate|Head Office|Regional Office)/i
    };
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.length < 3) continue;
      
      // Skip page numbers
      if (trimmedLine.match(/^\d+$/) || trimmedLine.includes('Page')) continue;
      
      // Extract name (all caps lines)
      if (trimmedLine.match(/^[A-Z][A-Z\s]+$/) && trimmedLine.length > 5) {
        if (currentEmployee.name) {
          // Add district if found in previous lines
          if (!currentEmployee.district) {
            for (const dist of districts) {
              if (currentEmployee.name?.includes(dist) || currentEmployee.department?.includes(dist)) {
                currentEmployee.district = dist;
                break;
              }
            }
          }
          employees.push({...currentEmployee});
        }
        currentEmployee = {
          name: trimmedLine,
          id: `EMP${String(employees.length + 1).padStart(4, '0')}`
        };
        continue;
      }
      
      // Check for district in line
      for (const dist of districts) {
        if (trimmedLine.includes(dist) && !currentEmployee.district) {
          currentEmployee.district = dist;
          break;
        }
      }
      
      // Extract designation
      if (trimmedLine.match(patterns.designation) && currentEmployee.name) {
        currentEmployee.designation = trimmedLine;
        continue;
      }
      
      // Extract phone
      const phoneMatch = trimmedLine.match(patterns.phone);
      if (phoneMatch && currentEmployee.name) {
        currentEmployee.phone = phoneMatch[0];
        continue;
      }
      
      // Extract email
      const emailMatch = trimmedLine.match(patterns.email);
      if (emailMatch && currentEmployee.name) {
        currentEmployee.email = emailMatch[0].toLowerCase();
        continue;
      }
      
      // Extract department
      if (trimmedLine.match(patterns.department) && currentEmployee.name && !currentEmployee.department) {
        currentEmployee.department = trimmedLine;
        continue;
      }
    }
    
    // Add last employee
    if (currentEmployee.name) {
      employees.push(currentEmployee);
    }
    
    // Add default values
    const validEmployees = employees.filter(emp => emp.name).map((emp, index) => ({
      ...emp,
      id: emp.id || `EMP${String(index + 1).padStart(4, '0')}`,
      designation: emp.designation || 'Staff Member',
      department: emp.department || 'DoIT&C Rajasthan',
      district: emp.district || 'Jaipur',
      phone: emp.phone || 'Contact Office',
      email: emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '.')}@rajasthan.gov.in`
    }));
    
    console.log(`✅ Extracted ${validEmployees.length} employees`);
    
    // Save to file
    fs.writeFileSync(
      'src/employees.json',
      JSON.stringify(validEmployees, null, 2)
    );
    
    console.log('✅ Data saved to src/employees.json');
    console.log('\n📊 Statistics:');
    console.log(`Total: ${validEmployees.length}`);
    
    // District wise count
    const districtCount = {};
    validEmployees.forEach(emp => {
      districtCount[emp.district] = (districtCount[emp.district] || 0) + 1;
    });
    
    console.log('\n📍 District-wise distribution:');
    Object.entries(districtCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([dist, count]) => {
        console.log(`${dist}: ${count} employees`);
      });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

extractEmployeeData();