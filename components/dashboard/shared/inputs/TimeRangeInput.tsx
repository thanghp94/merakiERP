import React from 'react';
import { calculateDuration } from '../../../../lib/constants/businessOptions';

interface TimeRangeInputProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  startLabel?: string;
  endLabel?: string;
  durationLabel?: string;
  showDuration?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  startName?: string;
  endName?: string;
}

export default function TimeRangeInput({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  startLabel = 'Thời gian bắt đầu',
  endLabel = 'Thời gian kết thúc',
  durationLabel = 'Thời lượng (phút)',
  showDuration = true,
  required = false,
  disabled = false,
  className = '',
  startName,
  endName,
}: TimeRangeInputProps) {
  const duration = calculateDuration(startTime, endTime);

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onStartTimeChange(e.target.value);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEndTimeChange(e.target.value);
  };

  const inputClassName = `w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {startLabel} {required && '*'}
          </label>
          <input
            type="time"
            name={startName}
            value={startTime}
            onChange={handleStartTimeChange}
            required={required}
            disabled={disabled}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {endLabel} {required && '*'}
          </label>
          <input
            type="time"
            name={endName}
            value={endTime}
            onChange={handleEndTimeChange}
            required={required}
            disabled={disabled}
            className={inputClassName}
          />
        </div>
      </div>

      {showDuration && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {durationLabel}
          </label>
          <input
            type="number"
            value={duration}
            readOnly
            className={`${inputClassName} bg-gray-50 cursor-not-allowed`}
            placeholder="0"
          />
          {duration > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {Math.floor(duration / 60) > 0 && `${Math.floor(duration / 60)} giờ `}
              {duration % 60 > 0 && `${duration % 60} phút`}
            </p>
          )}
        </div>
      )}

      {startTime && endTime && duration <= 0 && (
        <div className="text-red-600 text-xs">
          ⚠️ Thời gian kết thúc phải sau thời gian bắt đầu
        </div>
      )}
    </div>
  );
}

// Specialized component for work schedule
interface WorkScheduleTimeInputProps extends Omit<TimeRangeInputProps, 'startLabel' | 'endLabel' | 'durationLabel'> {
  includeBreak?: boolean;
  breakStartTime?: string;
  breakEndTime?: string;
  onBreakStartTimeChange?: (time: string) => void;
  onBreakEndTimeChange?: (time: string) => void;
}

export function WorkScheduleTimeInput({
  includeBreak = false,
  breakStartTime = '',
  breakEndTime = '',
  onBreakStartTimeChange,
  onBreakEndTimeChange,
  ...props
}: WorkScheduleTimeInputProps) {
  return (
    <div className="space-y-4">
      <TimeRangeInput
        {...props}
        startLabel="Giờ bắt đầu làm việc"
        endLabel="Giờ kết thúc làm việc"
        durationLabel="Tổng thời gian làm việc (phút)"
      />

      {includeBreak && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Giờ nghỉ trưa (tùy chọn)</h4>
          <TimeRangeInput
            startTime={breakStartTime}
            endTime={breakEndTime}
            onStartTimeChange={onBreakStartTimeChange || (() => {})}
            onEndTimeChange={onBreakEndTimeChange || (() => {})}
            startLabel="Bắt đầu nghỉ trưa"
            endLabel="Kết thúc nghỉ trưa"
            durationLabel="Thời gian nghỉ trưa (phút)"
            showDuration={true}
          />
        </div>
      )}
    </div>
  );
}

// Specialized component for session time input
export function SessionTimeInput(props: TimeRangeInputProps) {
  return (
    <TimeRangeInput
      {...props}
      startLabel="Thời gian bắt đầu session"
      endLabel="Thời gian kết thúc session"
      durationLabel="Thời lượng session (phút)"
    />
  );
}
