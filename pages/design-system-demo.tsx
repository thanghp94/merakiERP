import React, { useState } from 'react';
import { Button, Card, Input, Badge } from '@/components/ui';

export default function DesignSystemDemo() {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (e.target.value.length < 3) {
      setInputError('Must be at least 3 characters');
    } else {
      setInputError('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Meraki Education Design System
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A comprehensive component library featuring the Meraki Education color palette
            and consistent design patterns for professional, accessible UI.
          </p>
        </div>

        {/* Color Palette */}
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Color Palette</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Primary Colors</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg shadow-sm"></div>
                  <div>
                    <div className="font-medium">Primary Orange</div>
                    <div className="text-sm text-gray-500">#F97316</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-teal-500 rounded-lg shadow-sm"></div>
                  <div>
                    <div className="font-medium">Secondary Teal</div>
                    <div className="text-sm text-gray-500">#14B8A6</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-400 rounded-lg shadow-sm"></div>
                  <div>
                    <div className="font-medium">Accent Yellow</div>
                    <div className="text-sm text-gray-500">#FBBF24</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Status Colors</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-500 rounded-lg shadow-sm"></div>
                  <div>
                    <div className="font-medium">Success Green</div>
                    <div className="text-sm text-gray-500">#22C55E</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-500 rounded-lg shadow-sm"></div>
                  <div>
                    <div className="font-medium">Error Red</div>
                    <div className="text-sm text-gray-500">#EF4444</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg shadow-sm"></div>
                  <div>
                    <div className="font-medium">Info Blue</div>
                    <div className="text-sm text-gray-500">#3B82F6</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Neutral Colors</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-900 rounded-lg shadow-sm"></div>
                  <div>
                    <div className="font-medium">Text Primary</div>
                    <div className="text-sm text-gray-500">#1F2937</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-600 rounded-lg shadow-sm"></div>
                  <div>
                    <div className="font-medium">Text Secondary</div>
                    <div className="text-sm text-gray-500">#4B5563</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-400 rounded-lg shadow-sm"></div>
                  <div>
                    <div className="font-medium">Text Muted</div>
                    <div className="text-sm text-gray-500">#9CA3AF</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Typography */}
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Typography</h2>
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold">Heading 1 - 28px Bold</h1>
              <p className="text-sm text-gray-500 mt-1">Used for page titles and main headings</p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Heading 2 - 22px Semibold</h2>
              <p className="text-sm text-gray-500 mt-1">Used for section headers</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold">Heading 3 - 18px Semibold</h3>
              <p className="text-sm text-gray-500 mt-1">Used for subsection headers</p>
            </div>
            <div>
              <p className="text-base">Body Text - 14px Regular</p>
              <p className="text-sm text-gray-500 mt-1">Used for main content and descriptions</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Caption Text - 12px Regular</p>
              <p className="text-sm text-gray-500 mt-1">Used for helper text and labels</p>
            </div>
          </div>
        </Card>

        {/* Buttons */}
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Buttons</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Variants</h3>
              <div className="space-y-3">
                <Button variant="primary" fullWidth>
                  Primary Button
                </Button>
                <Button variant="secondary" fullWidth>
                  Secondary Button
                </Button>
                <Button variant="text" fullWidth>
                  Text Button
                </Button>
                <Button variant="danger" fullWidth>
                  Danger Button
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Sizes</h3>
              <div className="space-y-3">
                <Button variant="primary" size="sm" fullWidth>
                  Small Button
                </Button>
                <Button variant="primary" size="md" fullWidth>
                  Medium Button
                </Button>
                <Button variant="primary" size="lg" fullWidth>
                  Large Button
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">States</h3>
              <div className="space-y-3">
                <Button variant="primary" fullWidth>
                  Normal State
                </Button>
                <Button variant="primary" loading fullWidth>
                  Loading State
                </Button>
                <Button variant="primary" disabled fullWidth>
                  Disabled State
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Elements */}
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Form Elements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Basic Input"
                placeholder="Enter text here"
                fullWidth
              />
              <Input
                label="Input with Value"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Type at least 3 characters"
                fullWidth
              />
              <Input
                label="Input with Error"
                error={inputError}
                value={inputValue}
                onChange={handleInputChange}
                placeholder="This will show error if less than 3 chars"
                fullWidth
              />
              <Input
                label="Disabled Input"
                value="Disabled value"
                disabled
                fullWidth
              />
            </div>
            <div className="space-y-4">
              <Input
                label="Email Input"
                type="email"
                placeholder="user@example.com"
                helperText="We'll never share your email"
                fullWidth
              />
              <Input
                label="Password Input"
                type="password"
                placeholder="Enter password"
                fullWidth
              />
              <Input
                label="Input with Icons"
                placeholder="Search..."
                startIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                fullWidth
              />
            </div>
          </div>
        </Card>

        {/* Badges */}
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Variants</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="secondary">Secondary</Badge>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Sizes</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success" size="sm">Small</Badge>
                <Badge variant="success" size="md">Medium</Badge>
                <Badge variant="success" size="lg">Large</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Cards */}
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card padding="sm" shadow="sm">
              <h3 className="font-semibold mb-2">Small Card</h3>
              <p className="text-sm text-gray-600">
                Small padding and shadow for compact content.
              </p>
            </Card>
            <Card padding="md" shadow="md">
              <h3 className="font-semibold mb-2">Medium Card</h3>
              <p className="text-sm text-gray-600">
                Medium padding and shadow for standard content.
              </p>
            </Card>
            <Card padding="lg" shadow="lg" hover>
              <h3 className="font-semibold mb-2">Large Hover Card</h3>
              <p className="text-sm text-gray-600">
                Large padding with hover effect for interactive content.
              </p>
            </Card>
          </div>
        </Card>

        {/* CSS Classes */}
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">CSS Classes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Legacy Classes</h3>
              <div className="space-y-2">
                <button className="btn-primary w-full">
                  .btn-primary
                </button>
                <button className="btn-secondary w-full">
                  .btn-secondary
                </button>
                <input className="form-input w-full" placeholder=".form-input" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Design System Classes</h3>
              <div className="space-y-2">
                <button className="ds-button-primary w-full">
                  .ds-button-primary
                </button>
                <button className="ds-button-secondary w-full">
                  .ds-button-secondary
                </button>
                <input className="ds-input w-full" placeholder=".ds-input" />
              </div>
            </div>
          </div>
        </Card>

        {/* Navigation Example */}
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Navigation</h2>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button className="ds-nav-tab-active">
                Active Tab
              </button>
              <button className="ds-nav-tab-inactive">
                Inactive Tab
              </button>
              <button className="ds-nav-tab-inactive">
                Another Tab
              </button>
            </nav>
          </div>
        </Card>

        {/* Table Example */}
        <Card>
          <h2 className="text-2xl font-semibold mb-6">Table</h2>
          <div className="overflow-x-auto">
            <table className="ds-table">
              <thead className="ds-table-header">
                <tr>
                  <th className="ds-table-header-cell">Name</th>
                  <th className="ds-table-header-cell">Status</th>
                  <th className="ds-table-header-cell">Role</th>
                  <th className="ds-table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="ds-table-body">
                <tr className="ds-table-row">
                  <td className="ds-table-cell font-medium">John Doe</td>
                  <td className="ds-table-cell">
                    <Badge variant="success">Active</Badge>
                  </td>
                  <td className="ds-table-cell">Administrator</td>
                  <td className="ds-table-cell">
                    <Button variant="text" size="sm">Edit</Button>
                  </td>
                </tr>
                <tr className="ds-table-row">
                  <td className="ds-table-cell font-medium">Jane Smith</td>
                  <td className="ds-table-cell">
                    <Badge variant="warning">Pending</Badge>
                  </td>
                  <td className="ds-table-cell">Teacher</td>
                  <td className="ds-table-cell">
                    <Button variant="text" size="sm">Edit</Button>
                  </td>
                </tr>
                <tr className="ds-table-row">
                  <td className="ds-table-cell font-medium">Bob Johnson</td>
                  <td className="ds-table-cell">
                    <Badge variant="error">Inactive</Badge>
                  </td>
                  <td className="ds-table-cell">Student</td>
                  <td className="ds-table-cell">
                    <Button variant="text" size="sm">Edit</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
