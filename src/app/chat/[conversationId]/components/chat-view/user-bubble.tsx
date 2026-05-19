export default function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-3/4 rounded-[18px_18px_6px_18px] bg-secondary px-4 py-3 typo-body2 text-secondary-foreground">
        {content}
      </div>
    </div>
  );
}
