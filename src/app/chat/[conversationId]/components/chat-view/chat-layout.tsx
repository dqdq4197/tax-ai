import { forwardRef, type ReactNode } from "react";

interface ChatLayoutProps {
  children: ReactNode;
  footer: ReactNode;
}

const ChatLayout = forwardRef<HTMLDivElement, ChatLayoutProps>(
  ({ children, footer }, ref) => (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div ref={ref} className="flex-1 overflow-y-auto pb-44">
        {children}
      </div>
      <div className="absolute right-0 bottom-0 left-0 bg-linear-to-b from-transparent via-background/80 to-background px-4 pt-16 pb-6">
        <div className="mx-auto max-w-190">{footer}</div>
      </div>
    </div>
  ),
);

ChatLayout.displayName = "ChatLayout";

export default ChatLayout;
