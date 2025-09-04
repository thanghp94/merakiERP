import { useRouter } from 'next/router';

interface ScheduleNavigationProps {
  className?: string;
  children: React.ReactNode;
}

export default function ScheduleNavigation({ className, children }: ScheduleNavigationProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push('/schedule');
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
