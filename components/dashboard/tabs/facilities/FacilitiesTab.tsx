import React, { useState, useMemo, useEffect } from 'react';
import { Facility } from '../../shared/types';
import { formatDate, getStatusBadge } from '../../shared/utils';
import FilterBar, { FilterConfig } from '../../shared/FilterBar';
import { FormModal, FormGrid, FormField } from '../../shared';

interface Room {
  id: string;
  name: string;
  description: string;
}

interface FacilitiesTabProps {
  showFacilityForm: boolean;
  setShowFacilityForm: (show: boolean) => void;
  facilitiesList: Facility[];
  isLoadingFacilitiesList: boolean;
  handleFormSubmit: (data: any, formType: string) => void;
}

export default function FacilitiesTab({
  showFacilityForm,
  setShowFacilityForm,
  facilitiesList,
  isLoadingFacilitiesList,
  handleFormSubmit
}: FacilitiesTabProps) {
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all'
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    status: 'active',
    type: '',
    address: '',
    capacity: '',
    established: '',
    description: ''
  });

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [facilityTypes, setFacilityTypes] = useState<Array<{value: string, label: string}>>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

  // Fetch facility types from enum
  useEffect(() => {
    const fetchFacilityTypes = async () => {
      try {
        const response = await fetch('/api/metadata/enums?type=loai_co_so');
        const result = await response.json();
        
        if (result.success) {
          setFacilityTypes(result.data);
        } else {
          console.error('Failed to fetch facility types:', result.message);
          setFacilityTypes([
            { value: 'Meraki', label: 'Meraki' },
            { value: 'Trường đối tác', label: 'Trường đối tác' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching facility types:', error);
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

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Get unique values for filter options from actual data
  const filterOptions = useMemo(() => {
    const statuses = new Set<string>();

    facilitiesList.forEach((facility: any) => {
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
  }, [facilitiesList]);

  // Filter facilities based on selected filters
  const filteredFacilities = useMemo(() => {
    return facilitiesList.filter((facility: any) => {
      const facilityType = facility.type || facility.data?.type || '';
      const matchesType = filters.type === 'all' || facilityType === filters.type;
      const matchesStatus = filters.status === 'all' || facility.status === filters.status;

      return matchesType && matchesStatus;
    });
  }, [facilitiesList, filters]);

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

  const handleClearFilters = () => {
    setFilters({
      type: 'all',
      status: 'all'
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

  const handleModalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const submitData = {
        name: formData.name,
        status: formData.status,
        data: {
          type: formData.type,
          address: formData.address,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          established: formData.established,
          description: formData.description,
          rooms: rooms.filter(room => room.name.trim() !== '')
        }
      };

      await handleFormSubmit(submitData, 'Facility');
      
      // Reset form after successful creation
      setFormData({
        name: '',
        status: 'active',
        type: '',
        address: '',
        capacity: '',
        established: '',
        description: ''
      });
      setRooms([]);
      setShowFacilityForm(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalCancel = () => {
    setFormData({
      name: '',
      status: 'active',
      type: '',
      address: '',
      capacity: '',
      established: '',
      description: ''
    });
    setRooms([]);
    setShowFacilityForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {/* Filter Controls */}
        <FilterBar
          filters={filters}
          filterConfigs={getFilterConfigs()}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          actionButton={{
            label: showFacilityForm ? 'Xem danh sách' : 'Thêm cơ sở',
            icon: showFacilityForm ? '📋' : '➕',
            onClick: () => setShowFacilityForm(!showFacilityForm)
          }}
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-200">
            <h3 className="text-base font-medium text-gray-900">
              Danh sách cơ sở ({filteredFacilities.length})
            </h3>
          </div>

          {isLoadingFacilitiesList ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Đang tải danh sách cơ sở...</p>
            </div>
          ) : filteredFacilities.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0h3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Không có cơ sở nào</h4>
              <p className="text-gray-600">
                {filters.type === 'all' && filters.status === 'all'
                  ? 'Chưa có cơ sở nào được tạo.'
                  : 'Không tìm thấy cơ sở nào phù hợp với bộ lọc đã chọn.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên cơ sở
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Địa chỉ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sức chứa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày thành lập
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFacilities.map((facility: any) => (
                    <tr key={facility.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{facility.name}</div>
                        {facility.data?.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {facility.data.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {facility.type || facility.data?.type || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {facility.data?.address || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {facility.data?.capacity || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {facility.data?.established ? formatDate(facility.data.established) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(facility.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      <FormModal
        isOpen={showFacilityForm}
        onClose={() => setShowFacilityForm(false)}
        title="Thêm cơ sở mới"
        onSubmit={handleModalSubmit}
        onCancel={handleModalCancel}
        submitLabel="Thêm mới"
        cancelLabel="Hủy"
        isSubmitting={isSubmitting}
        maxWidth="6xl"
      >
        <FormGrid columns={3} gap="md">
          <FormField label="Tên cơ sở" required>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Nhập tên cơ sở"
            />
          </FormField>

          <FormField label="Trạng thái">
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="maintenance">Bảo trì</option>
            </select>
          </FormField>

          <FormField label="Loại cơ sở">
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
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
          </FormField>

          <FormField label="Địa chỉ cơ sở" className="md:col-span-2">
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Nhập địa chỉ cơ sở"
            />
          </FormField>

          <FormField label="Sức chứa">
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Số lượng học sinh tối đa"
            />
          </FormField>

          <FormField label="Ngày thành lập">
            <input
              type="date"
              name="established"
              value={formData.established}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </FormField>
        </FormGrid>

          <div className="mt-4">
            <FormField label="Mô tả">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
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
                      <FormField label="Tên phòng học" required>
                        <input
                          type="text"
                          value={room.name}
                          onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Nhập tên phòng học (VD: Phòng A101)"
                        />
                      </FormField>

                      <FormField label="Mô tả phòng học">
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
