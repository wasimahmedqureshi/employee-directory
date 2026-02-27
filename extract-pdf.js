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
    const seenNames = new Set();
    
    // Rajasthan ke saare 33 districts (पूरी लिस्ट)
    const districts = [
      'AJMER', 'ALWAR', 'BANSWARA', 'BARAN', 'BARMER', 'BHARATPUR', 'BHILWARA',
      'BIKANER', 'BUNDI', 'CHITTORGARH', 'CHURU', 'DAUSA', 'DHOLPUR', 'DUNGARPUR',
      'HANUMANGARH', 'JAIPUR', 'JAISALMER', 'JALORE', 'JHALAWAR', 'JHUNJHUNU',
      'JODHPUR', 'KARAULI', 'KOTA', 'NAGAUR', 'PALI', 'PRATAPGARH', 'RAJSAMAND',
      'SAWAI MADHOPUR', 'SIKAR', 'SIROHI', 'SRI GANGANAGAR', 'TONK', 'UDAIPUR'
    ];
    
    // Designations की सही लिस्ट
    const designations = [
      { pattern: /PROGRAMMER|PROGRAM MER|PROGRAM/i, name: 'Programmer' },
      { pattern: /TECHNICAL ASSISTANT|TECHNICAL/i, name: 'Technical Assistant' },
      { pattern: /SYSTEM ANALYST|SYSTEM/i, name: 'System Analyst' },
      { pattern: /DIRECTOR|DIR/i, name: 'Director' },
      { pattern: /ADDITIONAL DIRECTOR|ADDL DIRECTOR/i, name: 'Additional Director' },
      { pattern: /JOINT DIRECTOR|JOINT/i, name: 'Joint Director' },
      { pattern: /DEPUTY DIRECTOR|DEPUTY/i, name: 'Deputy Director' },
      { pattern: /ASSISTANT DIRECTOR|ASST DIRECTOR/i, name: 'Assistant Director' },
      { pattern: /OFFICER/i, name: 'Officer' },
      { pattern: /SECTION OFFICER/i, name: 'Section Officer' },
      { pattern: /ACCOUNTANT/i, name: 'Accountant' },
      { pattern: /CLERK/i, name: 'Clerk' },
      { pattern: /STENO/i, name: 'Stenographer' },
      { pattern: /DRIVER/i, name: 'Driver' },
      { pattern: /PEON/i, name: 'Peon' },
      { pattern: /DATA ENTRY OPERATOR|DEO/i, name: 'Data Entry Operator' }
    ];
    
    let i = 0;
    let empCount = 0;
    let skippedCount = 0;
    
    while (i < lines.length) {
      const line = lines[i].trim();
      
      // Serial numbers (1, 2, 3...)
      if (line.match(/^\d+$/) && parseInt(line) > 0 && parseInt(line) < 10000) {
        empCount++;
        
        if (empCount % 500 === 0) {
          console.log(`Processing employee #${empCount}...`);
        }
        
        const emp = {
          name: '',
          designation: 'Staff',
          department: '',
          district: 'Jaipur',
          phone: '',
          email: ''
        };
        
        // नाम ढूंढो (अगली 3-4 लाइनों में)
        let nameLines = [];
        let j = i + 1;
        let nameFound = false;
        
        while (j < lines.length && j < i + 6 && !nameFound) {
          const nameLine = lines[j].trim();
          
          // Skip करो अगर ये डिज़िग्नेशन है
          if (nameLine.match(/PROGRAMMER|TECHNICAL|DIRECTOR|OFFICER|ACCOUNTANT|CLERK|STENO|DRIVER|PEON/i)) {
            nameFound = true;
            break;
          }
          
          // नाम इकट्ठा करो (अगर ये सिर्फ कैपिटल लेटर्स में है)
          if (nameLine && nameLine.match(/^[A-Z][A-Z\s]+$/) && nameLine.length > 2) {
            nameLines.push(nameLine);
          } else if (nameLines.length > 0) {
            // अगर नाम मिलना बंद हो गया
            nameFound = true;
            break;
          }
          j++;
        }
        
        if (nameLines.length >= 1) {
          emp.name = nameLines.join(' ').replace(/\s+/g, ' ').trim();
          
          // Duplicate check
          const nameKey = emp.name.toLowerCase().replace(/\s+/g, '');
          if (seenNames.has(nameKey)) {
            skippedCount++;
            i = j;
            continue;
          }
          seenNames.add(nameKey);
          
          // Designation ढूंढो
          let k = i + nameLines.length + 1;
          while (k < lines.length && k < i + 10) {
            const desigLine = lines[k].trim().toUpperCase();
            
            let found = false;
            for (const d of designations) {
              if (d.pattern.test(desigLine)) {
                emp.designation = d.name;
                found = true;
                break;
              }
            }
            
            if (found) break;
            k++;
          }
          
          // Department और Phone ढूंढो
          let deptLines = [];
          let l = i + nameLines.length + 1;
          let phoneFound = false;
          
          while (l < lines.length && l < i + 20) {
            const infoLine = lines[l].trim();
            
            // Phone number ढूंढो
            const phoneMatch = infoLine.match(/\b[6-9]\d{9}\b/);
            if (phoneMatch) {
              emp.phone = phoneMatch[0];
              phoneFound = true;
            }
            
            // Department line (अगर फोन नंबर नहीं है)
            if (!phoneMatch && infoLine && !infoLine.match(/^\d+$/)) {
              // बहुत लंबी लाइनों को मत जोड़ो
              if (infoLine.length < 100) {
                deptLines.push(infoLine);
              }
            }
            
            // District ढूंढो
            if (!emp.district || emp.district === 'Jaipur') {
              for (const dist of districts) {
                if (infoLine.toUpperCase().includes(dist)) {
                  emp.district = dist.charAt(0) + dist.slice(1).toLowerCase();
                  break;
                }
              }
            }
            
            l++;
          }
          
          // Department name clean करो
          let deptStr = deptLines.join(' ');
          deptStr = deptStr.replace(/\b[6-9]\d{9}\b/g, ''); // Phone numbers हटाओ
          deptStr = deptStr.replace(/\s+/g, ' ').trim();
          deptStr = deptStr.substring(0, 100); // लंबाई limit करो
          
          emp.department = deptStr || 'DoIT&C Rajasthan';
          
          // Email ढूंढो
          let emailStr = '';
          let m = i + nameLines.length + 5;
          while (m < lines.length && m < i + 25) {
            const emailLine = lines[m].trim();
            if (emailLine.includes('@') || emailLine.includes('doit') || emailLine.includes('rajasthan')) {
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
    console.log(`✅ Duplicates skipped: ${skippedCount}`);
    console.log(`✅ Final unique employees: ${employees.length}`);
    
    // District statistics
    const districtCount = {};
    employees.forEach(emp => {
      districtCount[emp.district] = (districtCount[emp.district] || 0) + 1;
    });
    
    console.log('\n📊 District-wise distribution:');
    const sortedDistricts = Object.entries(districtCount).sort((a, b) => b[1] - a[1]);
    sortedDistricts.forEach(([dist, count]) => {
      console.log(`   ${dist}: ${count} employees`);
    });
    
    console.log(`\n📊 Total Districts Found: ${sortedDistricts.length} / 33`);
    
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
    
    console.log(`\n✅ Data saved to: ${output    consolePath}`);
    console.log('\.log('\n📋 Samplen📋 Sample first 5 employees first :');
5 employees:');
    employees.slice(    employees0,.slice(0, 5 5).forEach((emp).forEach((emp, i, i) =>) => {
      console.log {
      console.log(`${i+1(`${i+1}. ${emp.name}. ${emp.name} - ${emp} - ${emp.design.designation} (${ation} (${emp.demp.district}) - ${empistrict}) - ${emp.phone.phone}`);
    });
    
}`);
    });
    
   } catch } catch (error (error) {
) {
    console    console.error('.error('❌❌ Error:', Error:', error);
 error);
  }
  }
}

ext}

extractEmployeeractEmployeeData();