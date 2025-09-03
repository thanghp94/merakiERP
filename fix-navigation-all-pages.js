const fs = require('fs');
const path = require('path');

// List of pages that need to be fixed
const pagesToFix = [
  'pages/facilities.tsx',
  'pages/finances.tsx',
  'pages/personal.tsx',
  'pages/employee.tsx',
  'pages/businesstasks.tsx',
  'pages/classes.tsx',
  'pages/payroll.tsx',
  'pages/tasks.tsx',
  'pages/student.tsx',
  'pages/businesstask.tsx',
  'pages/requests.tsx',
  'pages/sessions.tsx'
];

function fixNavigationInFile(filePath) {
  console.log(`Fixing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Update import to include handleMainTabClick
    content = content.replace(
      /import { getMainTabs, handleSubTabNavigation } from '@\/components\/navigation\/NavigationConfig';/,
      "import { getMainTabs, handleSubTabNavigation, handleMainTabClick } from '@/components/navigation/NavigationConfig';"
    );
    
    // 2. Replace the problematic handleMainTabClick function
    const oldHandleMainTabClick = /\/\/ Navigation helper functions\s*\n\s*const handleMainTabClick = \(mainTabId: MainTabType\) => \{\s*\n\s*setActiveMainTab\(mainTabId\);\s*\n\s*\/\/ Set the first subtab as active when switching main tabs\s*\n\s*const mainTab = mainTabs\.find\(tab => tab\.id === mainTabId\);\s*\n\s*if \(mainTab && mainTab\.subtabs\.length > 0\) \{\s*\n\s*setActiveTab\(mainTab\.subtabs\[0\]\.id\);\s*\n\s*\}\s*\n\s*\};/;
    
    const newHandleMainTabClick = `// Navigation helper functions
  const handleMainTabClickLocal = (mainTabId: MainTabType) => {
    handleMainTabClick(mainTabId, setActiveMainTab);
  };`;
    
    content = content.replace(oldHandleMainTabClick, newHandleMainTabClick);
    
    // 3. Update the Sidebar component call
    content = content.replace(
      /onMainTabClick={handleMainTabClick}/,
      'onMainTabClick={handleMainTabClickLocal}'
    );
    
    // Write the fixed content back
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Fix all pages
console.log('Starting navigation fix for all pages...\n');

pagesToFix.forEach(fixNavigationInFile);

console.log('\n🎉 Navigation fix completed for all pages!');
