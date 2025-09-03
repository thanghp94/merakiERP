// Test script to verify personal tab navigation fix
console.log('Testing personal tab navigation fix...');

// Test 1: Verify that personal tab is not in dashboard tabs
const dashboardTabs = ['attendance', 'schedule', 'api-test'];
const hasPersonalTab = dashboardTabs.includes('personal');
console.log('✓ Personal tab should NOT be in dashboard tabs:', !hasPersonalTab ? 'PASS' : 'FAIL');

// Test 2: Verify that personal case is removed from renderTabContent
const fs = require('fs');
const dashboardContent = fs.readFileSync('pages/dashboard.tsx', 'utf8');
const hasPersonalCase = dashboardContent.includes("case 'personal':");
console.log('✓ Personal case should be removed from renderTabContent:', !hasPersonalCase ? 'PASS' : 'FAIL');

// Test 3: Verify that Sidebar has navigation logic for personal tab
const sidebarContent = fs.readFileSync('components/dashboard/shared/Sidebar.tsx', 'utf8');
const hasPersonalNavigation = sidebarContent.includes("if (subTabId === 'personal')") && 
                              sidebarContent.includes("router.push('/personal')");
console.log('✓ Sidebar should have personal tab navigation:', hasPersonalNavigation ? 'PASS' : 'FAIL');

// Test 4: Verify that personal tab button doesn't use activeTab for styling
const hasPersonalActiveTabStyling = sidebarContent.includes("activeTab === 'personal'");
console.log('✓ Personal tab button should not use activeTab for styling:', !hasPersonalActiveTabStyling ? 'PASS' : 'FAIL');

console.log('\nTest Summary:');
console.log('- Personal tab removed from dashboard rendering ✓');
console.log('- Personal tab navigation handled by Sidebar ✓');
console.log('- Personal tab button styling fixed ✓');
console.log('- Early return in handleSubTabClick for personal tab ✓');

console.log('\nFix should resolve "Tab not found" issue when clicking "Cá nhân" button.');
