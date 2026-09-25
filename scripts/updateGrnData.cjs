const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/grnData.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace dummy supplier references with live catalog supplier references
content = content.replace(/'SUP-001'/g, "'SUP-S0128'");
content = content.replace(/'Reliance Polymers Ltd'/g, "'RELIANCE INDUSTRIES LIMITED BANGALORE'");
content = content.replace(/'SUP-REL-01'/g, "'S0128'");

content = content.replace(/'SUP-003'/g, "'SUP-S0068'");
content = content.replace(/'GAIL \(India\) Limited'/g, "'INDIAN OIL CORPORATION LIMITED'");
content = content.replace(/'SUP-GAIL-03'/g, "'S0068'");

content = content.replace(/'SUP-004'/g, "'SUP-S0017'");
content = content.replace(/'Precision Molds & Tooling Works'/g, "'BHANSALI ENGINEERING POLYMERS LIMITED'");
content = content.replace(/'SUP-IOCL-04'/g, "'S0017'");

content = content.replace(/'SUP-005'/g, "'SUP-S0010'");
content = content.replace(/'Astra Packaging Solutions Pvt Ltd'/g, "'AR INDUSTRIES'");
content = content.replace(/'SUP-ASTR-05'/g, "'S0010'");

content = content.replace(/'SUP-006'/g, "'SUP-S0058'");
content = content.replace(/'Omya India Pvt Ltd \(Mineral Fillers\)'/g, "'GUJARAT STATE FERTILIZERS & CHEMICALS LIMITED TN'");
content = content.replace(/'SUP-OMYA-06'/g, "'S0058'");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated src/data/grnData.ts with live catalog references!');
