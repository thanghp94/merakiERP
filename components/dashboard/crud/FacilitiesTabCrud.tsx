import React, { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { Facility } from '../shared/types';
import { formatDate, getStatusBadge } from '../shared/utils';
import { 
  CrudTable, 
  TableColumn, 
  TableAction, 
  FilterConfig, 
  FormModal, 
  FormGrid, 
  FormField 
} from '../shared';
import { useFormWithValidation, commonSchemas, createFormData } from '../../../lib/hooks/useFormWithValidation';

interface FacilitiesTabCrudProps {
  facilities: Facility[];
  isLoading: boolean;
  onSubmit: (data: any, formType: string) => Promise<void>;
  onEdit?: (facility: Facility) => void;
  onDelete?: (facility: Facility) => void;
  onView?: (facility: Facility) => void;
}

// Facility form validation schema
const facilitySchema = z.object({
  name: commonSchemas.requiredString('Tên cơ sở'),
  status: z.enum(['active', 'inactive', 'maintenance']),
  type: commonSchemas.requiredString('Loại cơ sở'),
  address: commonSchemas.optionalString,
  capacity: z.string().optional(),
  established: commonSchemas.optionalString,
  description: commonSchemas.optionalString,
  rooms: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, 'Tên phòng học không được để trống'),
    description: z.string().optional()
  })).optional()
});

type FacilityFormData = z.infer<typeof facilitySchema>;

interface Room {
  id: string;
  name: string;
  description: string;
}

export default function FacilitiesTabCrud({
  facilities,
  isLoading,
  onSubmit,
  onEdit,
  onDelete,
  onView
}: FacilitiesTabCrudProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [facilityTypes, setFacilityTypes] = useState<Array<{value: string, label: string}>>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Filter state
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all'
  });

  // Fetch facility types from enum
  useEffect(() => {
    const fetchFacilityTypes = async () => {
      try {
        const response = await fetch('/api/metadata/enums?type=loai_co_so');
        const result = await response.json();
        
        if (result.success) {
          setFacilityTypes(result.data);
        } else {
          setFacilityTypes([
            { value: 'Meraki', label: 'Meraki' },
            { value: 'Trường đối tác', label: 'Trường đối tác' }
          ]);
        }
      } catch (error) {
        setFacilityTypes([
          { value: 'Meraki', label: 'Meraki' },
          { value: 'Trường đối tác', label: 'Trường đối tác' }
        ]);
      } finally {
        setIsLoadingTypes(false);
      }
    };

    fetchFacilityTypes();
  }, []);

  // Use the form validation hook
  const form = useFormWithValidation<FacilityFormData>({
    schema: facilitySchema,
    defaultValues: {
      name: '',
      status: 'active',
      type: '',
      address: '',
      capacity: '',
      established: '',
      description: '',
      rooms: []
    },
    onSubmit: async (data) => {
      const submitData = createFormData(data, [
        'address', 'capacity', 'established', 'description'
      ]);

      // Add rooms to data
      if (rooms.length > 0) {
        submitData.data.rooms = rooms.filter(room => room.name.trim() !== '');
      }

      // Convert capacity to number
      if (data.capacity) {
        submitData.data.capacity = parseInt(data.capacity);
      }

      // If editing, add the facility ID
      if (editingFacility) {
        submitData.id = editingFacility.id;
      }

      await onSubmit(submitData, 'Facility');
      
      // Close the appropriate modal
      if (editingFacility) {
        setShowEditModal(false);
        setEditingFacility(null);
      } else {
        setShowCreateModal(false);
      }
      
      setRooms([]);
    },
    onSuccess: () => {
      form.resetForm();
      setRooms([]);
    }
  });

  // Filter facilities based on selected filters
  const filteredFacilities = useMemo(() => {
    return facilities.filter((facility: any) => {
      const facilityType = facility.type || facility.data?.type || '';
      const matchesType = filters.type === 'all' || facilityType === filters.type;
      const matchesStatus = filters.status === 'all' || facility.status === filters.status;

      return matchesType && matchesStatus;
    });
  }, [facilities, filters]);

  // Get unique values for filter options from actual data
  const filterOptions = useMemo(() => {
    const statuses = new Set<string>();

    facilities.forEach((facility: any) => {
      if (facility.status) {
        statuses.add(facility.status);
      }
    });

    return {
      types: [
        { value: 'Meraki', label: 'Meraki' },
        { value: 'Trường đối tác', label: 'Trường đối tác' }
      ],
      statuses: Array.from(statuses).sort()
    };
  }, [facilities]);

  // Room management functions
  const addRoom = () => {
    const newRoom: Room = {
      id: Date.now().toString(),
      name: '',
      description: ''
    };
    setRooms([...rooms, newRoom]);
  };

  const removeRoom = (roomId: string) => {
    setRooms(rooms.filter(room => room.id !== roomId));
  };

  const updateRoom = (roomId: string, field: keyof Room, value: string) => {
    setRooms(rooms.map(room => 
      room.id === roomId ? { ...room, [field]: value } : room
    ));
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      type: 'all',
      status: 'all'
    });
  };

  const handleModalCancel = () => {
    form.resetForm();
    setRooms([]);
    setShowCreateModal(false);
  };

  const handleEditModalCancel = () => {
    form.resetForm();
    setRooms([]);
    setShowEditModal(false);
    setEditingFacility(null);
  };

  const handleEditClick = (facility: Facility) => {
    setEditingFacility(facility);
    
    // Populate form with existing data
    form.setValue('name', facility.name);
    form.setValue('status', facility.status as 'active' | 'inactive' | 'maintenance');
    form.setValue('type', facility.type || facility.data?.type || '');
    form.setValue('address', facility.data?.address || '');
    form.setValue('capacity', facility.data?.capacity?.toString() || '');
    form.setValue('established', facility.data?.established || '');
    form.setValue('description', facility.data?.description || '');
    
    // Populate rooms if they exist
    if (facility.data?.rooms) {
      setRooms(facility.data.rooms.map((room: any) => ({
        id: room.id || Date.now().toString(),
        name: room.name || '',
        description: room.description || ''
      })));
    } else {
      setRooms([]);
    }
    
    setShowEditModal(true);
    
    // Call the parent onEdit handler if provided
    if (onEdit) {
      onEdit(facility);
    }
  };

  // Create filter configurations for FilterBar
  const getFilterConfigs = (): FilterConfig[] => {
    return [
      {
        key: 'type',
        label: 'Loại cơ sở',
        options: [
          { value: 'all', label: 'Tất cả loại' },
          ...filterOptions.types.map(type => ({
            value: type.value,
            label: type.label
          }))
        ]
      },
      {
        key: 'status',
        label: 'Trạng thái',
        options: [
          { value: 'all', label: 'Tất cả trạng thái' },
          ...filterOptions.statuses.map(status => ({
            value: status,
            label: status
          }))
        ]
      }
    ];
  };

  // Create table columns configuration
  const getTableColumns = (): TableColumn<Facility>[] => {
    return [
      {
        key: 'name',
        label: 'Tên cơ sở',
        render: (value, row) => (
          <div>
            <div className="text-sm font-medium text-gray-900">{value}</div>
            {row.data?.description && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {row.data.description}
              </div>
            )}
          </div>
        )
      },
      {
        key: 'type',
        label: 'Loại',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.type || row.data?.type || '-'}
          </div>
        )
      },
      {
        key: 'address',
        label: 'Địa chỉ',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.data?.address || '-'}
          </div>
        )
      },
      {
        key: 'capacity',
        label: 'Sức chứa',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.data?.capacity || '-'}
          </div>
        )
      },
      {
        key: 'established',
        label: 'Ngày thành lập',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.data?.established ? formatDate(row.data.established) : '-'}
          </div>
        )
      },
      {
        key: 'status',
        label: 'Trạng thái',
        render: (value) => getStatusBadge(value)
      }
    ];
  };

  return (
    <div className="space-y-6">
      <CrudTable
        data={filteredFacilities}
        columns={getTableColumns()}
        isLoading={isLoading}
        filters={filters}
        filterConfigs={getFilterConfigs()}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        onView={onView}
        onEdit={handleEditClick}
        onDelete={onDelete}
        title="Danh sách cơ sở"
        createButtonLabel="Thêm cơ sở"
        onCreateClick={() => setShowCreateModal(true)}
        emptyState={{
          icon: (
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0h3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
          title: 'Không có cơ sở nào',
          description: 'Chưa có cơ sở nào được tạo.'
        }}
      />

      {/* Create Facility Modal */}
      <FormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Thêm cơ sở mới"
        onSubmit={form.handleSubmit}
        onCancel={handleModalCancel}
        submitLabel="Thêm mới"
        cancelLabel="Hủy"
        isSubmitting={form.isSubmitting}
        maxWidth="near-full"
      >
        {form.submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {form.submitError}
          </div>
        )}

        <FormGrid columns={3} gap="md">
          <FormField label="Tên cơ sở" required layout="horizontal">
            <input
              {...form.register('name')}
              type="text"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Nhập tên cơ sở"
            />
            {form.formState.errors.name && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.name.message}</p>
            )}
          </FormField>

          <FormField label="Trạng thái" layout="horizontal">
            <select
              {...form.register('status')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="maintenance">Bảo trì</option>
            </select>
          </FormField>

          <FormField label="Loại cơ sở" required layout="horizontal">
            <select
              {...form.register('type')}
              disabled={isLoadingTypes}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {isLoadingTypes ? 'Đang tải...' : 'Chọn loại cơ sở'}
              </option>
              {facilityTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {form.formState.errors.type && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.type.message}</p>
            )}
          </FormField>

          <FormField label="Địa chỉ cơ sở" className="md:col-span-2" layout="horizontal">
            <input
              {...form.register('address')}
              type="text"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Nhập địa chỉ cơ sở"
            />
          </FormField>

          <FormField label="Sức chứa" layout="horizontal">
            <input
              {...form.register('capacity')}
              type="number"
              min="1"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Số lượng học sinh tối đa"
            />
          </FormField>

          <FormField label="Ngày thành lập" layout="horizontal">
            <input
              {...form.register('established')}
              type="date"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </FormField>
        </FormGrid>

        <div className="mt-4">
          <FormField label="Mô tả" layout="horizontal" className="md:col-span-2">
            <textarea
              {...form.register('description')}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Mô tả về cơ sở"
            />
          </FormField>
        </div>

        {/* Rooms Section */}
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-800">Phòng học</h3>
            <button
              type="button"
              onClick={addRoom}
              className="px-3 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-md hover:bg-orange-200 transition-colors duration-200"
            >
              ➕ Thêm phòng học
            </button>
          </div>

          {rooms.length > 0 && (
            <div className="space-y-3">
              {rooms.map((room, index) => (
                <div key={room.id} className="bg-orange-50 p-3 rounded-md border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-gray-700">Phòng học {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeRoom(room.id)}
                      className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors duration-200"
                    >
                      ❌ Xóa
                    </button>
                  </div>
                  
                  <FormGrid columns={2} gap="sm">
                    <FormField label="Tên phòng học" required layout="horizontal">
                      <input
                        type="text"
                        value={room.name}
                        onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Nhập tên phòng học (VD: Phòng A101)"
                      />
                    </FormField>

                    <FormField label="Mô tả phòng học" layout="horizontal">
                      <textarea
                        value={room.description}
                        onChange={(e) => updateRoom(room.id, 'description', e.target.value)}
                        rows={1}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Mô tả về phòng học"
                      />
                    </FormField>
                  </FormGrid>
                </div>
              ))}
            </div>
          )}
        </div>
      </FormModal>

      {/* Edit Facility Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Chỉnh sửa cơ sở"
        onSubmit={form.handleSubmit}
        onCancel={handleEditModalCancel}
        submitLabel="Cập nhật"
        cancelLabel="Hủy"
        isSubmitting={form.isSubmitting}
        maxWidth="near-full"
      >
        {form.submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {form.submitError}
          </div>
        )}

        <FormGrid columns={3} gap="md">
          <FormField label="Tên cơ sở" required layout="horizontal">
            <input
              {...form.register('name')}
              type="text"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Nhập tên cơ sở"
            />
            {form.formState.errors.name && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.name.message}</p>
            )}
          </FormField>

          <FormField label="Trạng thái" layout="horizontal">
            <select
              {...form.register('status')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="maintenance">Bảo trì</option>
            </select>
          </FormField>

          <FormField label="Loại cơ sở" required layout="horizontal">
            <select
              {...form.register('type')}
              disabled={isLoadingTypes}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {isLoadingTypes ? 'Đang tải...' : 'Chọn loại cơ sở'}
              </option>
              {facilityTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {form.formState.errors.type && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.type.message}</p>
            )}
          </FormField>

          <FormField label="Địa chỉ cơ sở" className="md:col-span-2" layout="horizontal">
            <input
              {...form.register('address')}
              type="text"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Nhập địa chỉ cơ sở"
            />
          </FormField>

          <FormField label="Sức chứa" layout="horizontal">
            <input
              {...form.register('capacity')}
              type="number"
              min="1"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Số lượng học sinh tối đa"
            />
          </FormField>

          <FormField label="Ngày thành lập" layout="horizontal">
            <input
              {...form.register('established')}
              type="date"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </FormField>
        </FormGrid>

        <div className="mt-4">
          <FormField label="Mô tả" layout="horizontal" className="md:col-span-2">
            <textarea
              {...form.register('description')}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Mô tả về cơ sở"
            />
          </FormField>
        </div>

        {/* Rooms Section */}
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-800">Phòng học</h3>
            <button
              type="button"
              onClick={addRoom}
              className="px-3 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-md hover:bg-orange-200 transition-colors duration-200"
            >
              ➕ Thêm phòng học
            </button>
          </div>

          {rooms.length > 0 && (
            <div className="space-y-3">
              {rooms.map((room, index) => (
                <div key={room.id} className="bg-orange-50 p-3 rounded-md border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-gray-700">Phòng học {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeRoom(room.id)}
                      className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors duration-200"
                    >
                      ❌ Xóa
                    </button>
                  </div>
                  
                  <FormGrid columns={2} gap="sm">
                    <FormField label="Tên phòng học" required layout="horizontal">
                      <input
                        type="text"
                        value={room.name}
                        onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Nhập tên phòng học (VD: Phòng A101)"
                      />
                    </FormField>

                    <FormField label="Mô tả phòng học" layout="horizontal">
                      <textarea
                        value={room.description}
                        onChange={(e) => updateRoom(room.id, 'description', e.target.value)}
                        rows={1}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Mô tả về phòng học"
                      />
                    </FormField>
                  </FormGrid>
                </div>
              ))}
            </div>
          )}
        </div>
      </FormModal>
    </div>
  );
}
