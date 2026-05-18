import { Button } from "@/components/ui/button";
import { toErrorInfo } from "@/utils/to-error-info";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  error: unknown;
  refetch: (...args: unknown[]) => void;
}

export default function RecentConversationsError(props: Props) {
  const { error, refetch } = props;
  const errorInfo = toErrorInfo(error);

  const canRetry =
    errorInfo.recoveryAction === "retry" ||
    errorInfo.recoveryAction === "refresh-auth";

  return (
    <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
      <AlertCircle size={16} className="text-destructive/60" />
      <p className="typo-caption5 text-muted-foreground/60">
        {errorInfo.message}
      </p>
      {canRetry && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => refetch()}
          className="text-muted-foreground/40 hover:text-muted-foreground/70"
        >
          <RefreshCw size={10} />
          다시 시도
        </Button>
      )}
    </div>
  );
}
