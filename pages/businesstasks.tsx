import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '@/auth/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { TabType, MainTabType, MainTab } from '@/shared/types';
import { Card, Button, Badge } from '@/components/ui';
import Sidebar from '@/dashboard/shared/Sidebar';
import BusinessTaskForm from '@/components/BusinessTaskForm';
import TaskInstanceForm from '@/components/TaskInstanceForm';
import { BusinessTask, TaskInstance, TaskStats, TASK_CATEGORY_LABELS, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_STATUS_COLORS, TASK_PRIORITY_COLORS, TASK_CATEGORY_COLORS } from '@/dashboard/shared/types';
import { DataTable, TableColumn } from '@/dashboard/shared';

export default function BusinessTasksPage() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('business-tasks');
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('hcns');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Business Tasks state
  const [activeView, setActiveView] = useState<'templates' | 'instances'>('instances');
  const [showBusinessTaskForm, setShowBusinessTaskForm] = useState(false);
  const [showInstanceForm, setShowInstanceForm] = useState(false);

  // Task Templates State
  const [taskTemplates, setTaskTemplates] = useState<BusinessTask[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Task Instances State
  const [taskInstances, setTaskInstances] = useState<TaskInstance[]>([]);
  const [isLoadingInstances, setIsLoadingInstances] = useState(false);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  // Define the hierarchical navigation structure (same as dashboard)
  const mainTabs: MainTab[] = [
    {
      id: 'vanhanh',
      label: 'Vận hành',
      icon: '⚙️',
      subtabs: [
        { id: 'classes', label: 'Lớp học', icon: '🏫' },
        { id: 'sessions', label: 'Buổi học', icon: '📚' },
        { id: 'schedule', label: 'Lịch học', icon: '📅' }
      ]
    },
    {
      id: 'khachhang',
      label: 'Khách hàng',
      icon: '👥',
      subtabs: [
        { id: 'admissions', label: 'Tuyển sinh', icon: '📋' },
        { id: 'students', label: 'Học sinh', icon: '🎓' }
      ]
    },
    {
      id: 'taichinh',
      label: 'Tài chính',
      icon: '💰',
      subtabs: [
        { id: 'finances', label: 'Tài chính', icon: '💳' },
        { id: 'payroll', label: 'Lương', icon: '💰' }
      ]
    },
    {
      id: 'hcns',
      label: 'HCNS',
      icon: '👤',
      subtabs: [
        { id: 'employees', label: 'Nhân viên', icon: '👨‍💼' },
        { id: 'requests', label: 'Yêu cầu', icon: '📋' },
        { id: 'tasks', label: 'Bài tập', icon: '📝' },
        { id: 'business-tasks', label: 'Công việc', icon: '💼' },
        { id: 'facilities', label: 'Cơ sở', icon: '🏢' }
      ]
    }
  ];

  // Load saved tab state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedActiveTab = localStorage.getItem('businesstasks-active-tab') as TabType;
      const savedActiveMainTab = localStorage.getItem('businesstasks-active-main-tab') as MainTabType;

      if (savedActiveTab) {
        setActiveTab(savedActiveTab);
      }
      if (savedActiveMainTab) {
        setActiveMainTab(savedActiveMainTab);
      }
    }
  }, []);

  // Save tab state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('businesstasks-active-tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('businesstasks-active-main-tab', activeMainTab);
    }
  }, [activeMainTab]);

  // Navigation helper functions
  const handleMainTabClickLocal = (mainTabId: MainTabType) => {
    handleMainTabClick(mainTabId, setActiveMainTab);
  };

  const handleSubTabClick = (subTabId: TabType) => {
    // If clicking business-tasks, stay on this page
    if (subTabId === 'business-tasks') {
      setActiveTab(subTabId);
    } else {
      // For other tabs, redirect to dashboard
      window.location.href = `/dashboard?tab=${subTabId}&mainTab=${activeMainTab}`;
    }
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  // Business Tasks fetch and handlers
  useEffect(() => {
    if (activeView === 'templates') {
      fetchTaskTemplates();
    } else {
      fetchTaskInstances();
    }
  }, [activeView, statusFilter, categoryFilter, employeeFilter]);

  const fetchTaskTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      let url = '/api/tasks';
      const params = new URLSearchParams();

      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setTaskTemplates(result.data || []);
      } else {
        console.error('Failed to fetch task templates:', result.message);
        setTaskTemplates([]);
      }
    } catch (error) {
      console.error('Error fetching task templates:', error);
      setTaskTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const fetchTaskInstances = async () => {
    setIsLoadingInstances(true);
    try {
      let url = '/api/task-instances';
      const params = new URLSearchParams();

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      if (employeeFilter !== 'all') {
        params.append('assigned_to_employee_id', employeeFilter);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setTaskInstances(result.data || []);
        setTaskStats(result.stats || {
          total: 0,
          pending: 0,
          completed: 0,
          overdue: 0
        });
      } else {
        console.error('Failed to fetch task instances:', result.message);
        setTaskInstances([]);
      }
    } catch (error) {
      console.error('Error fetching task instances:', error);
      setTaskInstances([]);
    } finally {
      setIsLoadingInstances(false);
    }
  };

  const handleTaskTemplateSubmit = async (taskData: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Tạo mẫu công việc thành công!');
        setShowBusinessTaskForm(false);
        fetchTaskTemplates();
      } else {
        throw new Error(result.message || 'Failed to create task template');
      }
    } catch (error) {
      console.error('Error creating task template:', error);
      alert(`Lỗi khi tạo mẫu công việc: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTaskInstanceSubmit = async (taskInstanceData: any) => {
    try {
      const response = await fetch('/api/task-instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
