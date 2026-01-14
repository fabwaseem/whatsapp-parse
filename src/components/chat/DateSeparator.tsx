import { formatDate } from '@/lib/parser/whatsapp-parse';

interface DateSeparatorProps {
  date: Date;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex justify-center my-4 sticky top-2 z-10">
      <div className="bg-system-message text-system-message-foreground px-4 py-1.5 rounded-lg text-xs font-medium shadow-sm">
        {formatDate(date)}
      </div>
    </div>
  );
}
