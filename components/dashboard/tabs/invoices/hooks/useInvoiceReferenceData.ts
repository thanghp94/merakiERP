import { useState, useEffect } from 'react';
import { 
  Student, 
  Employee, 
  Facility, 
  Class, 
  Category, 
  PaymentMethod,
  fallbackCategories,
  fallbackPaymentMethods
} from '../types/invoice.types';

interface ReferenceData {
  students: Student[];
  employees: Employee[];
  facilities: Facility[];
  classes: Class[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
}

interface UseInvoiceReferenceDataReturn extends ReferenceData {
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useInvoiceReferenceData = (): UseInvoiceReferenceDataReturn => {
  const [data, setData] = useState<ReferenceData>({
    students: [],
    employees: [],
    facilities: [],
    classes: [],
    categories: fallbackCategories,
    paymentMethods: fallbackPaymentMethods,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReferenceData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all reference data in parallel
      const [
        studentsRes,
        employeesRes,
        facilitiesRes,
        classesRes,
        categoriesRes,
        paymentMethodsRes
      ] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/employees'),
        fetch('/api/facilities'),
        fetch('/api/classes'),
        fetch('/api/finance-categories'),
        fetch('/api/payment-methods')
      ]);

      // Parse responses
      const [
        studentsData,
        employeesData,
        facilitiesData,
        classesData,
        categoriesData,
        paymentMethodsData
      ] = await Promise.all([
        studentsRes.json(),
        employeesRes.json(),
        facilitiesRes.json(),
        classesRes.json(),
        categoriesRes.json(),
        paymentMethodsRes.json()
      ]);

      // Update state with fetched data or fallbacks
      setData({
        students: studentsData.success ? studentsData.data || [] : [],
        employees: employeesData.success ? employeesData.data || [] : [],
        facilities: facilitiesData.success ? facilitiesData.data || [] : [],
        classes: classesData.success ? classesData.data || [] : [],
        categories: (categoriesData.success && categoriesData.data?.length > 0) 
          ? categoriesData.data 
          : fallbackCategories,
        paymentMethods: (paymentMethodsData.success && paymentMethodsData.data?.length > 0)
          ? paymentMethodsData.data
          : fallbackPaymentMethods,
      });

    } catch (err) {
      console.error('Error loading invoice reference data:', err);
      setError('Không thể tải dữ liệu tham chiếu');
      
      // Set fallback data in case of error
      setData(prev => ({
        ...prev,
        categories: fallbackCategories,
        paymentMethods: fallbackPaymentMethods,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferenceData();
  }, []);

  return {
    ...data,
    isLoading,
    error,
    refetch: fetchReferenceData,
  };
};

// Helper hooks for filtered categories
export const useIncomeCategories = (categories: Category[]) => {
  return categories.filter(cat => cat.type === 'income');
};

export const useExpenseCategories = (categories: Category[]) => {
  return categories.filter(cat => cat.type === 'expense');
};
