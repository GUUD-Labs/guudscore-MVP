interface ErrorMessageProps {
  header: string;
  error: string;
}

export const ErrorMessage = ({ header, error }: ErrorMessageProps) => {
  return (
    <div className="border-destructive bg-destructive/5 flex flex-col gap-1 rounded-md border p-4">
      <h5 className="text-destructive/30 font-pixel">{header}</h5>
      <p className="text-destructive !mt-0 text-sm">{error}</p>
    </div>
  );
};
