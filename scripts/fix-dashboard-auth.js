const fs = require('fs');
const path = require('path');

// Read the current dashboard file
const dashboardPath = path.join(__dirname, '..', 'pages', 'dashboard.tsx');
const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

// Replace the fetchStudents function to include auth headers
const updatedContent = dashboardContent.replace(
  /const fetchStudents = async \(\) => \{[\s\S]*?\};/,
  `const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const response = await fetch('/api/students', {
        headers: {
          'Authorization': \`Bearer \${getCookie('supabase-auth-token') || ''}\`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setStudents(result.data);
      } else {
        console.error('Failed to fetch students:', result.message);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  };`
);

// Add helper function to get cookie
const finalContent = updatedContent.replace(
  /export default function Dashboard\(\) \{/,
  `// Helper function to get cookie by name
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
}

export default function Dashboard() {`
);

// Write the updated content back
fs.writeFileSync(dashboardPath, finalContent);

console.log('✅ Dashboard updated with authentication headers');
console.log('📝 Updated fetchStudents function to include Authorization header');
