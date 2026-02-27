const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function extractEmployeeData() {
  try {
    console.log('📂 Starting PDF extraction...');
    
    const currentDir = process.cwd();
    const pdfPath = path.join(currentDir, 'directory.pdf');
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found!');
      return;
    }
    
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    const lines = data.text.split('\n');
    
    console.log(`📄 Total lines: ${lines.length}`);
    
    const employees = [];
    const seenNames = new Set(); // For duplicate detection
    
    const districts = [
      'AJMER', 'ALWAR', 'BANSWARA', 'BARAN', 'BARMER', 'BHARATPUR', 'BHILWARA',
      'BIKANER', 'BUNDI', 'CHITTORGARH', 'CHURU', 'DAUSA', 'DHOLPUR', 'DUNGARPUR',
      'HANUMANGARH', 'JAIPUR', 'JAISALMER', 'JALORE', 'JHALAWAR', 'JHUNJHUNU',
      'JODHPUR', 'KARAULI', 'KOTA', 'NAGAUR', 'PALI', 'PRATAPGARH', 'RAJSAMAND',
      'SAWAI MADHOPUR', 'SIKAR', 'SIROHI', 'SRI GANGANAGAR', 'TONK', 'UDAIPUR'
    ];
    
    let i = 0;
    let empCount = 0;
    let duplicateCount = 0;
    
    while (i < lines.length) {
      const line = lines[i].trim();
      
      // Look for serial numbers
      if (line.match(/^\d+$/) && parseInt(line) > 0 && parseInt(line) < 50000) {
        empCount++;
        
        if (empCount % 1000 === 0) {
          console.log(`Processing employee #${empCount}...`);
        }
        
        const emp = {
          name: '',
          designation: '',
          department: '',
          district: '',
          phone: '',
          email: ''
        };
        
        // Get name (skip if it's a designation)
        let nameLines = [];
        let j = i + 1;
        let nameFound = false;
        
        while (j < lines.length && j < i + 6) {
          const nameLine = lines[j].trim();
          
          // Stop if we hit designation keywords
          if (nameLine.includes('PROGRAM') || nameLine.includes('TECHNICAL') || 
              nameLine.includes('ASSISTANT') || nameLine.includes('SYSTEM') ||
              nameLine.includes('DIRECTOR') || nameLine.includes('OFFICER')) {
            nameFound = true;
            break;
          }
          
          // Collect name if it's valid
          if (nameLine && nameLine.match(/^[A-Z][A-Z\s]+$/) && nameLine.length > 2) {
            nameLines.push(nameLine);
          }
          j++;
        }
        
        if (nameLines.length >= 1) {
          emp.name = nameLines.join(' ').replace(/\s+/g, ' ').trim();
          
          // Check for duplicates
          const nameKey = emp.name.toLowerCase().replace(/\s+/g, '');
          if (seenNames.has(nameKey)) {
            duplicateCount++;
            i = j;
            continue;
          }
          seenNames.add(nameKey);
          
          // Get designation
          let k = i + nameLines.length + 1;
          while (k < lines.length && k < i + 10) {
            const desigLine = lines[k].trim();
            
            if (desigLine.includes('PROGRAM')) {
              emp.designation = 'Programmer';
              break;
            } else if (desigLine.includes('TECHNICAL')) {
              emp.designation = 'Technical Assistant';
              break;
            } else if (desigLine.includes('SYSTEM')) {
              emp.designation = 'System Analyst';
              break;
            } else if (desigLine.includes('DIRECTOR')) {
              if (desigLine.includes('ADDITIONAL')) emp.designation = 'Additional Director';
              else if (desigLine.includes('JOINT')) emp.designation = 'Joint Director';
              else if (desigLine.includes('DEPUTY')) emp.designation = 'Deputy Director';
              else if (desigLine.includes('ASSISTANT')) emp.designation = 'Assistant Director';
              else emp.designation = 'Director';
              break;
            } else if (desigLine.includes('OFFICER')) {
              emp.designation = 'Officer';
              break;
            }
            k++;
          }
          
          if (!emp.designation) {
            emp.designation = 'Staff Member';
          }
          
          // Get department and phone
          let deptLines = [];
          let l = i + nameLines.length + 2;
          let foundPhone = false;
          
          while (l < lines.length && l < i + 25 && !foundPhone) {
            const infoLine = lines[l].trim();
            
            // Check for phone
            const phoneMatch = infoLine.match(/\b[6-9]\d{9}\b/);
            if (phoneMatch) {
              emp.phone = phoneMatch[0];
              foundPhone = true;
            }
            
            // Collect department (skip if it's just numbers)
            if (infoLine && !infoLine.match(/^\d+$/) && !infoLine.includes('@')) {
              deptLines.push(infoLine);
            }
            
            // Check for district
            if (!emp.district) {
              for (const dist of districts) {
                if (infoLine.toUpperCase().includes(dist)) {
                  emp.district = dist.charAt(0) + dist.slice(1).toLowerCase();
                  break;
                }
              }
            }
            
            l++;
          }
          
          emp.department = deptLines.join(' ').substring(0, 200) || 'DoIT&C Rajasthan';
          emp.district = emp.district || 'Jaipur';
          emp.phone = emp.phone || 'Contact Office';
          
          // Get email
          let emailStr = '';
          let m = i + nameLines.length + 5;
          while (m < lines.length && m < i + 30) {
            const emailLine = lines[m].trim();
            if (emailLine.includes('@') || emailLine.includes('doit') || 
                emailLine.includes('rajasthan') || emailLine.includes('gov')) {
              emailStr += emailLine.replace(/\s+/g, '');
            } else if (emailStr && emailLine.match(/^[a-z]+/)) {
              emailStr += emailLine;
            } else if (emailStr) {
              break;
            }
            m++;
          }
          
          if (emailStr) {
            emp.email = emailStr.toLowerCase();
            if (!emp.email.includes('@')) {
              emp.email = emp.name.toLowerCase().replace(/\s+/g, '.') + '@rajasthan.gov.in';
            }
          } else {
            emp.email = emp.name.toLowerCase().replace(/\s+/g, '.') + '@rajasthan.gov.in';
          }
          
          // Clean email
          emp.email = emp.email.replace(/[^a-z0-9@.]/g, '');
          
          employees.push({
            ...emp,
            id: `EMP${String(employees.length + 1).padStart(4, '0')}`
          });
        }
      }
      i++;
    }
    
    console.log(`\n✅ Total employees processed: ${empCount}`);
    console.log(`✅ Duplicates removed: ${duplicateCount}`);
    console.log(`✅ Final unique employees: ${employees.length}`);
    
    // District statistics
    const districtCount = {};
    employees.forEach(emp => {
      districtCount[emp.district] = (districtCount[emp.district] || 0) + 1;
    });
    
    console.log('\n📊 District-wise distribution:');
    Object.entries(districtCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([dist, count]) => {
        console.log(`   ${dist}: ${count} employees`);
      });
    
    // Designation statistics
    const desigCount = {};
    employees.forEach(emp => {
      desigCount[emp.designation] = (desigCount[emp.designation] || 0) + 1;
    });
    
    console.log('\n📊 Designation-wise distribution:');
    Object.entries(desigCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([desig, count]) => {
        console.log(`   ${desig}: ${count} employees`);
      });
    
    // Save to file
    const outputPath = path.join(currentDir, 'src', 'employees.json');
    fs.writeFileSync(outputPath, JSON.stringify(employees, null, 2));
    
    console.log(`\n✅ Data saved to: ${outputPath}`);
    console.log('\n📋 Sample first 10 employees (no duplicates):');
    employees.slice(0, 10).forEach((emp, i) => {
      console.log(`${i+1}. ${emp.name} - ${emp.designation} (${emp.district})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

extractEmployeeData();